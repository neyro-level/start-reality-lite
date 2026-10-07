import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { RealtyRepository } from "../src/platform/catalog";
import { SnapshotRepository } from "../src/platform/catalog/snapshot-repository";

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

const operations: (keyof RealtyRepository)[] = [
  "getProjectContact",
  "getGeo",
  "listProperties",
  "getProperty",
  "listDevelopments",
  "getDevelopment",
  "listDevelopers",
  "getDeveloper",
  "listAgents",
  "getAgent",
];

const repoSource = readFileSync(
  join(root, "src/platform/catalog/repository.ts"),
  "utf8",
);
const dtoSource = readFileSync(
  join(root, "src/platform/catalog/dto.ts"),
  "utf8",
);

for (const name of operations) {
  check(`operation-${name}`, repoSource.includes(name));
}

const dtos = [
  "PropertyCardDTO",
  "PropertyDetailsDTO",
  "DevelopmentCardDTO",
  "DevelopmentDetailsDTO",
  "DeveloperDTO",
  "AgentCardDTO",
  "AgentDetailsDTO",
  "ProjectContactDTO",
  "GeoDTO",
];
for (const name of dtos) {
  check(`dto-${name}`, dtoSource.includes(`export type ${name}`));
}

const snapshotRepo = readFileSync(
  join(root, "src/platform/catalog/snapshot-repository.ts"),
  "utf8",
);
check(
  "snapshot-repository-class",
  snapshotRepo.includes("class SnapshotRepository") &&
    snapshotRepo.includes("fromRevisionDir"),
);

const appFiles = [
  "src/app/site-page.tsx",
  "src/app/page.tsx",
  "src/app/not-found.tsx",
  "src/app/sitemap.ts",
  "src/app/[...path]/page.tsx",
];
for (const rel of appFiles) {
  const text = readFileSync(join(root, rel), "utf8");
  check(
    `app-no-fixture:${rel}`,
    !text.includes("fixture") &&
      !text.includes("catalog/local") &&
      !text.includes("catalog/entities"),
  );
}
check(
  "site-page-uses-repository",
  readFileSync(join(root, "src/app/site-page.tsx"), "utf8").includes(
    "getRealtyRepository",
  ),
);

const repo = SnapshotRepository.fromRevisionDir(
  root,
  "fixtures/fixture-demo",
  true,
  {
    thresholds: {
      hideAfterDays: 45,
      failAfterDays: 120,
      developmentTextFailAfterDays: 180,
    },
    now: new Date("2026-09-20T00:00:00Z"),
  },
);

async function main() {
  const properties = await repo.listProperties();
  check("runtime-list-properties", properties.length > 0);
  const first = properties[0];
  const details = first ? await repo.getProperty(first.publicUrlId) : null;
  check("runtime-get-property", Boolean(details?.publicUrlId));
  check(
    "runtime-property-rooms-typed",
    details?.rooms === null || typeof details?.rooms === "number",
  );
  const developments = await repo.listDevelopments();
  check("runtime-list-developments", developments.length > 0);
  const development = developments[0]
    ? await repo.getDevelopment(developments[0].publicUrlId)
    : null;
  check("runtime-get-development", Boolean(development?.publicUrlId));
  const agents = await repo.listAgents();
  check("runtime-list-agents", agents.length > 0);
  const agent = agents[0] ? await repo.getAgent(agents[0].slug) : null;
  check("runtime-get-agent", Boolean(agent?.slug));
  const contact = await repo.getProjectContact();
  check("runtime-contact", Boolean(contact?.phone));
  const geo = await repo.getGeo("geo-1");
  check("runtime-geo", geo?.slug === "geo-1");

  if (failed) {
    process.exit(1);
  }
  console.log("verify:repository PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
