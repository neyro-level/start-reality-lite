import { createHash, generateKeyPairSync, sign } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { env } from "../src/platform/env";
import { PropertyTypeSchema } from "../src/platform/hub/contract";
import { listPendingAcks } from "../src/platform/snapshot/ack";
import { REQUIRED_DATASET_KINDS } from "../src/platform/snapshot/constants";
import {
  createHubAdapter,
  parseSyncTrigger,
} from "../src/platform/snapshot/provider";
import {
  acquireLock,
  activateStaging,
  openSnapshotStore,
  prepareStaging,
  pruneRevisions,
  readCurrentManifest,
  readCurrentSequence,
  releaseLock,
  revisionDir,
  revisionTmpDir,
} from "../src/platform/snapshot/store";
import {
  applyLocalSnapshot,
  loadCurrentSnapshot,
} from "../src/platform/snapshot/sync";
import { loadTrustSetFromFile, TrustSet } from "../src/platform/snapshot/trust";
import { verifyCandidate } from "../src/platform/snapshot/verify";
import {
  flushPendingAcks,
  runProviderSync,
} from "../src/platform/snapshot/worker";

const PROJECT_ID = "lite-demo";
let failed = 0;

function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    console.log(`PASS ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name}${detail ? `: ${detail}` : ""}`);
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function publicUrlIdFromIndex(index: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz234567";
  let value = index + 1;
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out = alphabet[value % alphabet.length] + out;
    value = Math.floor(value / alphabet.length);
  }
  return out;
}

function projectContact(projectId = PROJECT_ID) {
  return {
    projectId,
    phone: "+70000000000",
    email: "office@example.test",
    updatedAt: "2026-10-03T00:00:00Z",
  };
}

function listing(index: number, extra: Record<string, unknown> = {}) {
  return {
    uid: `uid-${index}`,
    publicUrlId: publicUrlIdFromIndex(index),
    propertyType: "APARTMENT",
    transactionType: "SALE",
    dealKind: "SECONDARY_SALE",
    addressPublic: "Public street",
    geoPrecision: "street",
    slugHistory: [],
    facts: { rooms: 1 },
    media: [],
    status: "ACTIVE",
    ...extra,
  };
}

function createKeys() {
  const pair = generateKeyPairSync("ed25519");
  return {
    privateKey: pair.privateKey,
    publicKeyDer: pair.publicKey.export({
      type: "spki",
      format: "der",
    }) as Buffer,
  };
}

function writeCandidate(input: {
  sequence: number;
  keyId: string;
  privateKey: Parameters<typeof sign>[2];
  inventory?: unknown[];
  projectId?: string;
  schemaMajor?: number;
  schemaMinor?: number;
  schemaPatch?: number;
  pretty?: boolean;
  omitKind?: string;
  corruptHash?: boolean;
  corruptBytes?: boolean;
  corruptSignature?: boolean;
  envelopeBroken?: boolean;
}) {
  const dir = mkdtempSync(join(tmpdir(), "sz-snap-"));
  if (input.envelopeBroken) {
    writeFileSync(join(dir, "manifest.json"), "{");
    return dir;
  }
  const files = [];
  for (const kind of REQUIRED_DATASET_KINDS) {
    if (kind === input.omitKind) {
      continue;
    }
    const payload =
      kind === "inventory"
        ? Buffer.from(JSON.stringify(input.inventory ?? [listing(0)]), "utf8")
        : kind === "contacts"
          ? Buffer.from(
              JSON.stringify([projectContact(input.projectId ?? PROJECT_ID)]),
              "utf8",
            )
          : Buffer.from("[]", "utf8");
    const key = `${kind}.json`;
    writeFileSync(join(dir, key), payload);
    files.push({
      kind,
      key,
      sha256: input.corruptHash ? "c".repeat(64) : sha256(payload),
      bytes: input.corruptBytes ? payload.byteLength + 9 : payload.byteLength,
      count:
        kind === "inventory" ? (input.inventory ?? [listing(0)]).length : 0,
    });
  }
  const unsigned = {
    schemaMajor: input.schemaMajor ?? 3,
    schemaMinor: input.schemaMinor ?? 1,
    ...(input.schemaPatch === undefined
      ? {}
      : { schemaPatch: input.schemaPatch }),
    projectId: input.projectId ?? PROJECT_ID,
    publishSequence: input.sequence,
    generatedAt: "2026-10-03T00:00:00Z",
    publishedAt: "2026-10-03T00:00:00Z",
    catalogRevision: `r${input.sequence}`,
    sourceRevisions: ["src-1"],
    files,
    keyId: input.keyId,
  };
  const manifestBytes = Buffer.from(
    input.pretty
      ? `${JSON.stringify(unsigned, null, 2)}\n`
      : JSON.stringify(unsigned),
    "utf8",
  );
  const signature = sign(null, manifestBytes, input.privateKey);
  if (input.corruptSignature) {
    signature[0] = signature[0] ^ 0xff;
  }
  writeFileSync(join(dir, "manifest.json"), manifestBytes);
  writeFileSync(join(dir, "manifest.sig"), signature);
  return dir;
}

const trusted = createKeys();
const other = createKeys();
const trust = new TrustSet();
trust.add({ keyId: "trusted", publicKeyDer: trusted.publicKeyDer });
trust.add({
  keyId: "revoked",
  publicKeyDer: other.publicKeyDer,
  revoked: true,
});

const storeRoot = mkdtempSync(join(tmpdir(), "sz-store-"));

function apply(candidateDir: string) {
  return applyLocalSnapshot({
    storeRoot,
    candidateDir,
    trust,
    expectedProjectId: PROJECT_ID,
    lockTtlMs: 5_000,
  });
}

check("data-mode-local", env.DATA_MODE === "local");

const pkg = readFileSync(join(process.cwd(), "package.json"), "utf8");
check("no-database-client", !/payload|prisma|postgres|pg\b/i.test(pkg));

const accepted = apply(
  writeCandidate({
    sequence: 1,
    keyId: "trusted",
    privateKey: trusted.privateKey,
  }),
);
check(
  "valid-signature-accept",
  accepted.status === "activated",
  accepted.status === "rejected" ? accepted.reason : "",
);

const current = loadCurrentSnapshot(storeRoot);
check("current-readable", current?.publishSequence === 1);

check(
  "invalid-signature-reject",
  apply(
    writeCandidate({
      sequence: 2,
      keyId: "trusted",
      privateKey: trusted.privateKey,
      corruptSignature: true,
    }),
  ).status === "rejected",
);
check(
  "last-good-after-invalid",
  loadCurrentSnapshot(storeRoot)?.publishSequence === 1,
);

check(
  "unknown-key-reject",
  apply(
    writeCandidate({
      sequence: 2,
      keyId: "missing",
      privateKey: trusted.privateKey,
    }),
  ).status === "rejected",
);

check(
  "revoked-key-reject",
  apply(
    writeCandidate({
      sequence: 2,
      keyId: "revoked",
      privateKey: other.privateKey,
    }),
  ).status === "rejected",
);

check(
  "wrong-project-reject",
  apply(
    writeCandidate({
      sequence: 2,
      keyId: "trusted",
      privateKey: trusted.privateKey,
      projectId: "other-project",
    }),
  ).status === "rejected",
);

check(
  "unsupported-major-reject",
  apply(
    writeCandidate({
      sequence: 2,
      keyId: "trusted",
      privateKey: trusted.privateKey,
      schemaMajor: 4,
    }),
  ).status === "rejected",
);

check(
  "incompatible-minor-reject",
  apply(
    writeCandidate({
      sequence: 2,
      keyId: "trusted",
      privateKey: trusted.privateKey,
      schemaMinor: 2,
    }),
  ).status === "rejected",
);

check(
  "equal-sequence-reject",
  apply(
    writeCandidate({
      sequence: 1,
      keyId: "trusted",
      privateKey: trusted.privateKey,
    }),
  ).status === "rejected",
);

check(
  "hash-mismatch-reject",
  apply(
    writeCandidate({
      sequence: 2,
      keyId: "trusted",
      privateKey: trusted.privateKey,
      corruptHash: true,
    }),
  ).status === "rejected",
);

check(
  "bytes-mismatch-reject",
  apply(
    writeCandidate({
      sequence: 2,
      keyId: "trusted",
      privateKey: trusted.privateKey,
      corruptBytes: true,
    }),
  ).status === "rejected",
);

check(
  "missing-dataset-reject",
  apply(
    writeCandidate({
      sequence: 2,
      keyId: "trusted",
      privateKey: trusted.privateKey,
      omitKind: "inventory",
    }),
  ).status === "rejected",
);

check(
  "envelope-error-reject",
  apply(
    writeCandidate({
      sequence: 2,
      keyId: "trusted",
      privateKey: trusted.privateKey,
      envelopeBroken: true,
    }),
  ).status === "rejected",
);

check(
  "private-leak-reject",
  apply(
    writeCandidate({
      sequence: 2,
      keyId: "trusted",
      privateKey: trusted.privateKey,
      inventory: [listing(0, { apartmentNumberPrivate: "12" })],
    }),
  ).status === "rejected",
);

check(
  "identity-collision-reject",
  apply(
    writeCandidate({
      sequence: 2,
      keyId: "trusted",
      privateKey: trusted.privateKey,
      inventory: [listing(0), listing(1, { uid: "uid-0" })],
    }),
  ).status === "rejected",
);

const underThreshold = Array.from({ length: 200 }, (_, index) =>
  index === 0 ? { broken: true } : listing(index),
);
const warned = apply(
  writeCandidate({
    sequence: 2,
    keyId: "trusted",
    privateKey: trusted.privateKey,
    inventory: underThreshold,
  }),
);
check(
  "quarantine-under-threshold-activate",
  warned.status === "activated",
  warned.status === "rejected" ? warned.reason : "",
);

const overThreshold = Array.from({ length: 200 }, (_, index) =>
  index < 2 ? { broken: true } : listing(index),
);
check(
  "quarantine-over-threshold-reject",
  apply(
    writeCandidate({
      sequence: 3,
      keyId: "trusted",
      privateKey: trusted.privateKey,
      inventory: overThreshold,
    }),
  ).status === "rejected",
);

check(
  "core-property-types-accepted",
  PropertyTypeSchema.safeParse("COMMERCIAL").success &&
    PropertyTypeSchema.safeParse("NEW_BUILD_UNIT").success &&
    PropertyTypeSchema.safeParse("OTHER").success,
);

check(
  "duplicate-publicUrlId-reject",
  apply(
    writeCandidate({
      sequence: 4,
      keyId: "trusted",
      privateKey: trusted.privateKey,
      inventory: [
        listing(0),
        listing(1, { publicUrlId: listing(0).publicUrlId }),
      ],
    }),
  ).status === "rejected",
);

check(
  "broken-relation-reject",
  apply(
    writeCandidate({
      sequence: 5,
      keyId: "trusted",
      privateKey: trusted.privateKey,
      inventory: [listing(0, { developmentUid: "missing-development-uid" })],
    }),
  ).status === "rejected",
);

const store = openSnapshotStore(storeRoot);
const seqBeforeAtomic = readCurrentManifest(store)?.publishSequence ?? 1;
const atomicSeq = seqBeforeAtomic + 1;
const atomicApply = apply(
  writeCandidate({
    sequence: atomicSeq,
    keyId: "trusted",
    privateKey: trusted.privateKey,
  }),
);
check(
  "atomic-switch-activates",
  atomicApply.status === "activated",
  atomicApply.status === "rejected" ? atomicApply.reason : "",
);
check(
  "atomic-switch-current-pointer",
  readCurrentManifest(store)?.publishSequence === atomicSeq,
);
check(
  "atomic-switch-prior-revision-kept",
  existsSync(join(revisionDir(store, seqBeforeAtomic), "manifest.json")),
);

const seqBeforeCrash = readCurrentManifest(store)?.publishSequence;
const crashSeq = (seqBeforeCrash ?? 1) + 1;
const crashDir = writeCandidate({
  sequence: crashSeq,
  keyId: "trusted",
  privateKey: trusted.privateKey,
});
prepareStaging(store, crashDir, crashSeq);
rmSync(revisionTmpDir(store, crashSeq), { recursive: true, force: true });
try {
  activateStaging(store, crashSeq);
  check("activation-failure-throws", false);
} catch {
  check("activation-failure-throws", true);
}
check(
  "last-good-untouched",
  loadCurrentSnapshot(storeRoot)?.publishSequence === seqBeforeCrash,
);
function isDir(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

check(
  "tmp-not-visible-to-web",
  !isDir(join(storeRoot, "current")) &&
    !isDir(join(storeRoot, "last-good")) &&
    !isDir(join(storeRoot, "staging")) &&
    !existsSync(revisionTmpDir(store, crashSeq)) &&
    loadCurrentSnapshot(storeRoot)?.publishSequence === seqBeforeCrash,
);
check(
  "previous-known-good-kept",
  existsSync(join(revisionDir(store, seqBeforeCrash ?? 1), "manifest.json")),
);

check(
  "hub-unavailable-current-works",
  loadCurrentSnapshot(storeRoot)?.publishSequence === seqBeforeCrash,
);

acquireLock(store, 60_000);
const concurrent = apply(
  writeCandidate({
    sequence: (seqBeforeCrash ?? 1) + 1,
    keyId: "trusted",
    privateKey: trusted.privateKey,
  }),
);
releaseLock(store);
check("concurrent-apply-reject", concurrent.status === "rejected");

writeFileSync(
  store.lockPath,
  JSON.stringify({ at: Date.now() - 120_000, pid: 1 }),
);
mkdirSync(storeRoot, { recursive: true });
const stale = apply(
  writeCandidate({
    sequence: (loadCurrentSnapshot(storeRoot)?.publishSequence ?? 1) + 1,
    keyId: "trusted",
    privateKey: trusted.privateKey,
  }),
);
check(
  "stale-lock-recovery",
  stale.status === "activated",
  stale.status === "rejected" ? stale.reason : "",
);

const prettyDir = writeCandidate({
  sequence: 99,
  keyId: "trusted",
  privateKey: trusted.privateKey,
  pretty: true,
  schemaPatch: 0,
});
try {
  const pretty = verifyCandidate({
    candidateDir: prettyDir,
    trust,
    expectedProjectId: PROJECT_ID,
  });
  check(
    "detached-utf8-bytes-no-reserialize",
    pretty.manifest.schemaPatch === 0,
  );
} catch (error) {
  check(
    "detached-utf8-bytes-no-reserialize",
    false,
    error instanceof Error ? error.message : "",
  );
}

const compactReplay = writeCandidate({
  sequence: 100,
  keyId: "trusted",
  privateKey: trusted.privateKey,
  pretty: true,
});
const prettyBytes = readFileSync(join(compactReplay, "manifest.json"));
const compactBytes = Buffer.from(
  JSON.stringify(JSON.parse(prettyBytes.toString("utf8"))),
  "utf8",
);
writeFileSync(
  join(compactReplay, "manifest.sig"),
  sign(null, compactBytes, trusted.privateKey),
);
try {
  verifyCandidate({
    candidateDir: compactReplay,
    trust,
    expectedProjectId: PROJECT_ID,
  });
  check("reserialize-payload-reject", false);
} catch {
  check("reserialize-payload-reject", true);
}

const missingSig = writeCandidate({
  sequence: 101,
  keyId: "trusted",
  privateKey: trusted.privateKey,
});
rmSync(join(missingSig, "manifest.sig"), { force: true });
check("missing-detached-sig-reject", apply(missingSig).status === "rejected");

const fixtureDir = join(process.cwd(), "fixtures", "fixture-demo");
const fixtureTrust = JSON.parse(
  readFileSync(join(fixtureDir, "trust.json"), "utf8"),
) as { keyId: string; publicKeySpkiBase64: string };
const fixtureStore = mkdtempSync(join(tmpdir(), "sz-fixture-"));
const fixtureKeys = new TrustSet();
fixtureKeys.add({
  keyId: fixtureTrust.keyId,
  publicKeyDer: Buffer.from(fixtureTrust.publicKeySpkiBase64, "base64"),
});
const fixtureApply = applyLocalSnapshot({
  storeRoot: fixtureStore,
  candidateDir: fixtureDir,
  trust: fixtureKeys,
  expectedProjectId: "fixture-demo",
});
check(
  "fixture-apply",
  fixtureApply.status === "activated",
  fixtureApply.status === "rejected" ? fixtureApply.reason : "",
);
const fixtureGeo = JSON.parse(
  readFileSync(join(fixtureDir, "geo.json"), "utf8"),
) as unknown[];
const fixtureDevelopers = JSON.parse(
  readFileSync(join(fixtureDir, "developers.json"), "utf8"),
) as unknown[];
const fixtureInventory = JSON.parse(
  readFileSync(join(fixtureDir, "inventory.json"), "utf8"),
) as unknown[];
check(
  "fixture-counts",
  fixtureGeo.length === 10 &&
    fixtureDevelopers.length === 20 &&
    fixtureInventory.length === 300,
  `geo=${fixtureGeo.length} developers=${fixtureDevelopers.length} inventory=${fixtureInventory.length}`,
);

try {
  parseSyncTrigger({});
  parseSyncTrigger({ at: "2026-10-06T00:00:00Z" });
  check("signal-only-trigger-accept", true);
} catch {
  check("signal-only-trigger-accept", false);
}
try {
  parseSyncTrigger({ url: "https://evil.example/snapshot" });
  check("signal-only-trigger-reject-url", false);
} catch {
  check("signal-only-trigger-reject-url", true);
}

const providerStore = mkdtempSync(join(tmpdir(), "sz-provider-"));
const origin = writeCandidate({
  sequence: 1,
  keyId: "trusted",
  privateKey: trusted.privateKey,
});
const synced = runProviderSync({
  storeRoot: providerStore,
  provider: createHubAdapter(origin),
  trust,
  expectedProjectId: PROJECT_ID,
});
check(
  "hub-adapter-local-sync",
  synced.status === "activated",
  synced.status === "rejected" || synced.status === "provider-unavailable"
    ? synced.reason
    : "",
);

const replay = runProviderSync({
  storeRoot: providerStore,
  provider: createHubAdapter(origin),
  trust,
  expectedProjectId: PROJECT_ID,
});
check(
  "idempotent-ack-same-sequence",
  replay.status === "already-current" &&
    loadCurrentSnapshot(providerStore)?.publishSequence === 1,
  replay.status,
);

let ackFails = 1;
const flakyOrigin = writeCandidate({
  sequence: 2,
  keyId: "trusted",
  privateKey: trusted.privateKey,
});
const flaky = createHubAdapter(flakyOrigin);
const flakyProvider = {
  ...flaky,
  ack() {
    if (ackFails > 0) {
      ackFails -= 1;
      throw new Error("ack transport down");
    }
  },
};
const pendingSync = runProviderSync({
  storeRoot: providerStore,
  provider: flakyProvider,
  trust,
  expectedProjectId: PROJECT_ID,
});
check(
  "ack-retry-pending",
  pendingSync.status === "activated" &&
    pendingSync.ack === "pending" &&
    listPendingAcks(openSnapshotStore(providerStore)).length === 1,
  JSON.stringify(pendingSync),
);
flushPendingAcks(providerStore, flakyProvider);
check(
  "ack-retry-flush",
  listPendingAcks(openSnapshotStore(providerStore)).length === 0,
);

const down = runProviderSync({
  storeRoot: providerStore,
  provider: {
    fetchManifest() {
      throw new Error("hub down");
    },
    fetchSignature() {
      throw new Error("hub down");
    },
    fetchFile() {
      throw new Error("hub down");
    },
    ack() {},
  },
  trust,
  expectedProjectId: PROJECT_ID,
});
check(
  "provider-down-keeps-current",
  down.status === "provider-unavailable" &&
    loadCurrentSnapshot(providerStore)?.publishSequence === 2,
);

const pruneStore = openSnapshotStore(providerStore);
const pruneCurrent = readCurrentSequence(pruneStore);
pruneRevisions(pruneStore, pruneCurrent === null ? null : pruneCurrent - 1);
check(
  "prune-keeps-current-and-previous",
  pruneCurrent !== null &&
    existsSync(join(revisionDir(pruneStore, pruneCurrent), "manifest.json")) &&
    existsSync(
      join(revisionDir(pruneStore, pruneCurrent - 1), "manifest.json"),
    ),
);

const brokenRoot = join(process.cwd(), "fixtures/fixture-broken");
const brokenTrust = loadTrustSetFromFile(join(brokenRoot, "trust.json"));
const brokenCases: Array<[string, string]> = [
  ["bad-signature", "invalid signature"],
  ["hash-mismatch", "hash mismatch"],
  ["duplicate-publicUrlId", "identity collision"],
  ["privacy-leak", "private forbidden"],
  ["broken-relation", "quarantine"],
  ["invalid-slug", "slug reserved"],
  ["excessive-quarantine", "quarantine"],
];
for (const [name, expected] of brokenCases) {
  let message = "";
  try {
    verifyCandidate({
      candidateDir: join(brokenRoot, name),
      trust: brokenTrust,
      expectedProjectId: "fixture-broken",
    });
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  check(
    `fixture-broken-${name}`,
    message.toLowerCase().includes(expected.toLowerCase()) ||
      message.toLowerCase().includes("private") ||
      (name === "duplicate-publicUrlId" &&
        message.toLowerCase().includes("collision")),
    message,
  );
}

if (failed) {
  process.exit(1);
}
console.log("verify:snapshot PASS");
