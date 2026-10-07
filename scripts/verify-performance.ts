import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SnapshotRepository } from "../src/platform/catalog/snapshot-repository";
import { performance } from "../src/project/performance.config";

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

const gallery = readFileSync(join(root, "src/ui/domain/gallery.tsx"), "utf8");
const nextConfig = readFileSync(join(root, "next.config.ts"), "utf8");

check("lcp-budget-2500ms", performance.lcpMs <= 2500 && performance.lcpMs > 0);
check("cls-budget-0.1", performance.cls <= 0.1 && performance.cls > 0);
check("gallery-lazy-below-fold", gallery.includes('loading="lazy"'));
check("gallery-uses-next-image", gallery.includes('from "next/image"'));
check("custom-image-loader", nextConfig.includes('loader: "custom"'));
check("no-wildcard-remote-patterns", !nextConfig.includes("remotePatterns"));

async function main() {
  const started = Date.now();
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
  const cards = await repo.listProperties();
  const elapsed = Date.now() - started;
  check("fixture-list-properties-count", cards.length >= 300);
  check("fixture-list-properties-budget", elapsed < 2000, `${elapsed}ms`);

  if (failed) {
    process.exit(1);
  }
  console.log("verify:performance PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
