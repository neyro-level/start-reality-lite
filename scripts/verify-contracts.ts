import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FORBIDDEN_PUBLIC_FIELDS,
  HUB_CONTRACT_VERSION,
  isSupportedSchema,
  PropertyTypeSchema,
  PublicInventoryDtoSchema,
  parseMoneyValue,
  parsePublicInventoryDto,
  parseSnapshotManifest,
  propertyTypes,
  SUPPORTED_SCHEMA_MAJOR,
  SUPPORTED_SCHEMA_MINOR,
  serializeMoneyValue,
  transactionTypes,
} from "../src/platform/hub/contract";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0;

function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    console.log(`PASS ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name}${detail ? `: ${detail}` : ""}`);
}

const hubContract = readFileSync(
  join(root, "docs/archive/AMS_DATA_HUB_CONTRACT.md"),
  "utf8",
);
check(
  "hub-contract-version",
  hubContract.includes("**Версия:** 3.1.2") && HUB_CONTRACT_VERSION === "3.1.2",
);
check(
  "garage-box-accepted",
  PropertyTypeSchema.safeParse("GARAGE_BOX").success,
);
check(
  "commercial-type-accepted",
  PropertyTypeSchema.safeParse("COMMERCIAL").success,
);
check(
  "new-build-unit-type-accepted",
  PropertyTypeSchema.safeParse("NEW_BUILD_UNIT").success,
);
check("other-type-accepted", PropertyTypeSchema.safeParse("OTHER").success);
check("forked-garage-enum-absent", !propertyTypes.includes("GARAGE" as never));
check("rent-long-accepted", transactionTypes.includes("RENT_LONG"));
check("rent-short-accepted", transactionTypes.includes("RENT_SHORT"));

const inventory = parsePublicInventoryDto({
  uid: "inv-1",
  publicUrlId: "abcde23",
  propertyType: "LAND",
  transactionType: "SALE",
  dealKind: "PRIMARY_SALE",
  price: { amount: "12500000", currency: "RUB", scale: 2 },
  priceCheckedAt: "2026-09-01T00:00:00Z",
  addressPublic: "Public street",
  geoPrecision: "street",
  facts: { lotAreaM2: 640 },
  media: [],
  status: "ACTIVE",
});
check("deal-kind-semantics", inventory.dealKind === "PRIMARY_SALE");
check("lot-area-m2-naming", inventory.facts.lotAreaM2 === 640);

const money = { amount: "9900", currency: "RUB", scale: 2 as const };
const roundTrip = parseMoneyValue(serializeMoneyValue(money));
check(
  "money-value-serialization",
  roundTrip.amount === money.amount &&
    roundTrip.currency === money.currency &&
    roundTrip.scale === 2,
);

check(
  "unknown-major-rejected",
  isSupportedSchema(SUPPORTED_SCHEMA_MAJOR + 1, 0) === false,
);
check(
  "future-minor-rejected",
  isSupportedSchema(SUPPORTED_SCHEMA_MAJOR, SUPPORTED_SCHEMA_MINOR + 1) ===
    false,
);
check(
  "supported-minor-accepted",
  isSupportedSchema(SUPPORTED_SCHEMA_MAJOR, SUPPORTED_SCHEMA_MINOR) === true,
);

const leak = PublicInventoryDtoSchema.safeParse({
  ...inventory,
  apartmentNumberPrivate: "12",
});
check("private-field-leak-rejected", leak.success === false);
check(
  "forbidden-field-list",
  FORBIDDEN_PUBLIC_FIELDS.includes("apartmentNumberPrivate"),
);

try {
  parseSnapshotManifest({
    schemaMajor: 4,
    schemaMinor: 0,
    projectId: "demo",
    publishSequence: 1,
    generatedAt: "2026-10-03T00:00:00Z",
    publishedAt: "2026-10-03T00:00:00Z",
    catalogRevision: "r1",
    sourceRevisions: [],
    files: [
      {
        kind: "inventory",
        key: "inventory.json",
        sha256: "a".repeat(64),
        bytes: 1,
        count: 1,
      },
    ],
    keyId: "key-1",
  });
  check("manifest-unknown-major-throws", false);
} catch {
  check("manifest-unknown-major-throws", true);
}

parseSnapshotManifest({
  schemaMajor: 3,
  schemaMinor: 1,
  schemaPatch: 0,
  projectId: "demo",
  publishSequence: 1,
  generatedAt: "2026-10-03T00:00:00Z",
  publishedAt: "2026-10-03T00:00:00Z",
  catalogRevision: "r1",
  sourceRevisions: [],
  files: [
    {
      kind: "inventory",
      key: "inventory.json",
      sha256: "b".repeat(64),
      bytes: 12,
      count: 1,
    },
  ],
  keyId: "key-1",
});
check("supported-manifest-accepted", true);

if (failed) {
  process.exit(1);
}

console.log("verify:contracts PASS");
