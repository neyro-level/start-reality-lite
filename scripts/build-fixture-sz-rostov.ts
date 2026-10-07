import { createHash, createPrivateKey, sign } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { REQUIRED_DATASET_KINDS } from "../src/platform/snapshot/constants";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "fixtures", "fixture-sz-rostov");

const PROJECT_ID = "fixture-sz-rostov";
const KEY_ID = "fixture-local";
const ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

// Fixture-only signing material. Not a production secret.
const PUBLIC_SPKI_B64 =
  "MCowBQYDK2VwAyEAw0AjeRyINi4mb5YDAhERxs23rSnzDfdaXnnafK3LNLM=";
const PRIVATE_PKCS8_B64 =
  "MC4CAQAwBQYDK2VwBCIEIAirppe3zZZKdz744DbtLSCbza15fvfm4APBJQNo0lN5";

const DISTRICTS = [
  "Центр",
  "Западный",
  "Северный",
  "Сельмаш",
  "Нахичевань",
  "Левенцовка",
  "Суворовский",
  "Темерник",
  "Александровка",
  "Чкаловский",
];

function publicUrlId(index: number, length = 6): string {
  let value = index + 1;
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out = ALPHABET[value % ALPHABET.length] + out;
    value = Math.floor(value / ALPHABET.length);
  }
  return out;
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function writeJson(name: string, data: unknown): Buffer {
  const bytes = Buffer.from(`${JSON.stringify(data)}\n`, "utf8");
  writeFileSync(join(outDir, name), bytes);
  return bytes;
}

mkdirSync(outDir, { recursive: true });
mkdirSync(join(outDir, "keys"), { recursive: true });

const geo = DISTRICTS.map((name, index) => ({
  uid: `geo-${index + 1}`,
  slug: `geo-${index + 1}`,
  slugHistory: [],
  name,
}));

const developers = Array.from({ length: 20 }, (_, index) => ({
  uid: `dev-${index + 1}`,
  name: `Застройщик ${index + 1}`,
}));

const developments = developers.map((developer, index) => ({
  uid: `dvl-${index + 1}`,
  publicUrlId: publicUrlId(1000 + index),
  slug: `zhk-${index + 1}`,
  slugHistory: [],
  name: `Жилой комплекс ${index + 1}`,
  developerUid: developer.uid,
  checkedAt: "2026-09-01T00:00:00Z",
}));

const agents = Array.from({ length: 8 }, (_, index) => ({
  uid: `agt-${index + 1}`,
  slug: `agent-${index + 1}`,
  slugHistory: [],
  displayName: `Агент ${index + 1}`,
  listingPresenceStatus: "HAS_ACTIVE_LISTINGS",
}));

const contacts = [
  {
    projectId: PROJECT_ID,
    phone: "+78000000000",
    email: "hello@start-realty.example",
    addressPublic: "ул. Центральная, 1",
    hours: "Mo-Su 09:00-18:00",
    updatedAt: "2026-09-01T00:00:00Z",
  },
];

const inventory = Array.from({ length: 300 }, (_, index) => {
  const development = developments[index % developments.length];
  const district = geo[index % geo.length];
  return {
    uid: `inv-${index + 1}`,
    publicUrlId: publicUrlId(index),
    propertyType: "APARTMENT",
    transactionType: "SALE",
    dealKind: index % 5 === 0 ? "ASSIGNMENT" : "PRIMARY_SALE",
    price: {
      amount: String(4_500_000_00 + index * 10_000_00),
      currency: "RUB",
      scale: 2,
    },
    priceCheckedAt: "2026-09-01T00:00:00Z",
    addressPublic: `${district.name}, дом ${1 + (index % 40)}`,
    geoPrecision: "street",
    slug: `listing-${index + 1}`,
    slugHistory: [],
    lifecycle: "active",
    facts: {
      rooms: 1 + (index % 4),
      floor: 1 + (index % 16),
      floorsTotal: 18,
      totalAreaM2: 32 + (index % 40),
    },
    agentUid: agents[index % agents.length].uid,
    media: [],
    status: "ACTIVE",
    developmentUid: development.uid,
  };
});

const datasets: Record<string, unknown> = {
  inventory,
  agents,
  contacts,
  developments,
  geo,
  developers,
  media: [],
  urls: [],
  redirects: [],
  lifecycle: [],
};

const files = [...REQUIRED_DATASET_KINDS, "developers"].map((kind) => {
  const payload = datasets[kind];
  const bytes = writeJson(`${kind}.json`, payload);
  return {
    kind,
    key: `${kind}.json`,
    sha256: sha256(bytes),
    bytes: bytes.byteLength,
    count: Array.isArray(payload) ? payload.length : 0,
  };
});

const unsigned = {
  schemaMajor: 3,
  schemaMinor: 1,
  projectId: PROJECT_ID,
  publishSequence: 1,
  generatedAt: "2026-10-03T00:00:00Z",
  publishedAt: "2026-10-03T00:00:00Z",
  catalogRevision: "fixture-1",
  sourceRevisions: ["local-fixture"],
  files,
  keyId: KEY_ID,
};

const privateKey = createPrivateKey({
  key: Buffer.from(PRIVATE_PKCS8_B64, "base64"),
  format: "der",
  type: "pkcs8",
});
const manifestBytes = Buffer.from(`${JSON.stringify(unsigned)}\n`, "utf8");
writeFileSync(join(outDir, "manifest.json"), manifestBytes);
writeFileSync(
  join(outDir, "manifest.sig"),
  sign(null, manifestBytes, privateKey),
);
writeJson("trust.json", {
  keyId: KEY_ID,
  publicKeySpkiBase64: PUBLIC_SPKI_B64,
  note: "Fixture-only trust. Not a production key.",
});
writeFileSync(
  join(outDir, "keys", "README.md"),
  "Local fixture signing key only. Do not use outside this repository fixture.\n",
);
writeFileSync(join(outDir, "keys", "pkcs8.b64"), `${PRIVATE_PKCS8_B64}\n`);
writeFileSync(
  join(outDir, "README.md"),
  [
    "# fixture-sz-rostov",
    "",
    "Local Hub 3.1.2 snapshot for Lite: 10 districts, 20 developers, 300 apartments.",
    "Signed with the fixture-only Ed25519 key in `trust.json`.",
    "",
  ].join("\n"),
);

console.log(
  `wrote ${outDir}: geo=${geo.length} developers=${developers.length} inventory=${inventory.length}`,
);
