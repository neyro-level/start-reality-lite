import {
  createHash,
  createPrivateKey,
  generateKeyPairSync,
  type KeyObject,
  sign,
} from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REQUIRED_DATASET_KINDS } from "../src/platform/snapshot/constants";

export function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function publicUrlIdFromIndex(index: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz234567";
  let value = index + 1;
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out = alphabet[value % alphabet.length] + out;
    value = Math.floor(value / alphabet.length);
  }
  return out;
}

export function listing(index: number, extra: Record<string, unknown> = {}) {
  return {
    uid: `uid-${index}`,
    publicUrlId: publicUrlIdFromIndex(index),
    propertyType: "APARTMENT",
    transactionType: "SALE",
    dealKind: "SECONDARY_SALE",
    addressPublic: "Public street",
    geoPrecision: "street",
    slug: `listing-${index}`,
    slugHistory: [],
    facts: { rooms: 1, totalAreaM2: 32 },
    media: [],
    status: "ACTIVE",
    descriptionText: "TEST",
    price: {
      amount: String(4_500_000_00 + index * 10_000_00),
      currency: "RUB",
      scale: 2,
    },
    priceCheckedAt: "2026-09-01T00:00:00Z",
    ...extra,
  };
}

export function projectContact(projectId: string) {
  return {
    projectId,
    phone: "+70000000000",
    email: "office@example.test",
    updatedAt: "2026-10-03T00:00:00Z",
  };
}

export function writeSnapshotCandidate(input: {
  dir: string;
  sequence: number;
  keyId: string;
  privateKey: KeyObject;
  projectId: string;
  inventory?: unknown[];
  developments?: unknown[];
  agents?: unknown[];
  developers?: unknown[];
  geo?: unknown[];
  contacts?: unknown[];
  corruptHash?: boolean;
  corruptSignature?: boolean;
}): string {
  mkdirSync(input.dir, { recursive: true });
  const payloads: Record<string, unknown> = {};
  for (const kind of REQUIRED_DATASET_KINDS) {
    if (kind === "inventory") {
      payloads[kind] = input.inventory ?? [listing(0)];
    } else if (kind === "contacts") {
      payloads[kind] = input.contacts ?? [projectContact(input.projectId)];
    } else if (kind === "developments") {
      payloads[kind] = input.developments ?? [];
    } else if (kind === "agents") {
      payloads[kind] = input.agents ?? [];
    } else if (kind === "geo") {
      payloads[kind] = input.geo ?? [];
    } else {
      payloads[kind] = [];
    }
  }
  if (input.developers) {
    payloads.developers = input.developers;
  }
  const files = [];
  for (const [kind, value] of Object.entries(payloads)) {
    const payload = Buffer.from(JSON.stringify(value), "utf8");
    const key = `${kind}.json`;
    writeFileSync(join(input.dir, key), payload);
    files.push({
      kind,
      key,
      sha256: input.corruptHash ? "c".repeat(64) : sha256(payload),
      bytes: payload.byteLength,
      count: Array.isArray(value) ? value.length : 0,
    });
  }
  const unsigned = {
    schemaMajor: 3,
    schemaMinor: 1,
    projectId: input.projectId,
    publishSequence: input.sequence,
    generatedAt: "2026-10-03T00:00:00Z",
    publishedAt: "2026-10-03T00:00:00Z",
    catalogRevision: `r${input.sequence}`,
    sourceRevisions: ["TEST"],
    files,
    keyId: input.keyId,
  };
  const manifestBytes = Buffer.from(JSON.stringify(unsigned), "utf8");
  const signature = sign(null, manifestBytes, input.privateKey);
  if (input.corruptSignature) {
    signature[0] = signature[0] ^ 0xff;
  }
  writeFileSync(join(input.dir, "manifest.json"), manifestBytes);
  writeFileSync(join(input.dir, "manifest.sig"), signature);
  return input.dir;
}

export function loadOrCreateKeyPair(keysDir: string): {
  privateKey: KeyObject;
  publicKeyDer: Buffer;
} {
  mkdirSync(keysDir, { recursive: true });
  const pkcs8Path = join(keysDir, "pkcs8.b64");
  const spkiPath = join(keysDir, "spki.b64");
  if (existsSync(pkcs8Path) && existsSync(spkiPath)) {
    const privateDer = Buffer.from(
      readFileSync(pkcs8Path, "utf8").trim(),
      "base64",
    );
    const publicKeyDer = Buffer.from(
      readFileSync(spkiPath, "utf8").trim(),
      "base64",
    );
    return {
      privateKey: createPrivateKey({
        key: privateDer,
        format: "der",
        type: "pkcs8",
      }),
      publicKeyDer,
    };
  }
  const pair = generateKeyPairSync("ed25519");
  const publicKeyDer = pair.publicKey.export({
    type: "spki",
    format: "der",
  }) as Buffer;
  const privateDer = pair.privateKey.export({
    type: "pkcs8",
    format: "der",
  }) as Buffer;
  writeFileSync(pkcs8Path, privateDer.toString("base64"));
  writeFileSync(spkiPath, publicKeyDer.toString("base64"));
  return { privateKey: pair.privateKey, publicKeyDer };
}
