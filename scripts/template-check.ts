import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { site as altSite } from "../fixtures/fixture-alt/project/site.config";
import { loadFixtureInventory } from "../src/platform/catalog/local";
import {
  assertNoCollisions,
  type FeatureFlags,
  type GrammarConfig,
} from "../src/platform/grammar";
import { TrustSet } from "../src/platform/snapshot/trust";
import { verifyCandidate } from "../src/platform/snapshot/verify";
import { data } from "../src/project/data.config";
import { features as primaryFeatures } from "../src/project/features.config";
import { grammar as primaryGrammar } from "../src/project/grammar.config";
import { site as primarySite } from "../src/project/site.primary.config";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const altDir = "fixtures/fixture-alt";
function resolvePnpmCmd(): string {
  if (process.env.npm_execpath && existsSync(process.env.npm_execpath)) {
    return process.env.npm_execpath;
  }
  if (process.platform === "win32" && process.env.APPDATA) {
    const winPnpm = join(process.env.APPDATA, "npm", "pnpm.cmd");
    if (existsSync(winPnpm)) {
      return winPnpm;
    }
  }
  return "pnpm";
}

const pnpmCmd = resolvePnpmCmd();
let failed = 0;

function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    console.log(`PASS ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name}${detail ? `: ${detail}` : ""}`);
}

function loadTrust(fixtureDir: string) {
  const trustJson = JSON.parse(
    readFileSync(join(root, fixtureDir, "trust.json"), "utf8"),
  ) as { keyId: string; publicKeySpkiBase64: string };
  const trust = new TrustSet();
  trust.add({
    keyId: trustJson.keyId,
    publicKeyDer: Buffer.from(trustJson.publicKeySpkiBase64, "base64"),
  });
  return trust;
}

function runChecks(label: string, extraEnv: Record<string, string>) {
  const commands: Array<{ cmd: string; args: string[] }> = [
    { cmd: pnpmCmd, args: ["build"] },
    { cmd: pnpmCmd, args: ["verify:seo-contracts"] },
    { cmd: pnpmCmd, args: ["verify:layers"] },
    { cmd: pnpmCmd, args: ["verify:routes"] },
  ];
  for (const { cmd, args } of commands) {
    const result = spawnSync(cmd, args, {
      cwd: root,
      env: { ...process.env, ...extraEnv },
      stdio: "inherit",
      shell: true,
    });
    const ok = result.status === 0;
    check(`${label}:${args.join(" ")}`, ok, ok ? "" : `exit ${result.status}`);
    if (!ok) {
      return;
    }
  }
}

const overlay = JSON.parse(
  readFileSync(join(root, altDir, "project.json"), "utf8"),
) as GrammarConfig & { features: FeatureFlags };

assertNoCollisions(overlay);
const altInventory = loadFixtureInventory(root, altDir);
const primaryInventory = loadFixtureInventory(root, data.fixtureDir);

const primarySnapshot = verifyCandidate({
  candidateDir: join(root, data.fixtureDir),
  trust: loadTrust(data.fixtureDir),
  expectedProjectId: "fixture-demo",
});
const altSnapshot = verifyCandidate({
  candidateDir: join(root, altDir),
  trust: loadTrust(altDir),
  expectedProjectId: "fixture-alt",
});

check(
  "primary-snapshot-ok",
  primarySnapshot.manifest.projectId === "fixture-demo",
);
check("alt-snapshot-ok", altSnapshot.manifest.projectId === "fixture-alt");
check("primary-inventory-loaded", primaryInventory.length > 0);
check("alt-inventory-loaded", altInventory.length > 0);
check("alt-geo-differs", overlay.geo !== primaryGrammar.geo);
check(
  "alt-categories-differs",
  overlay.categories.join(",") !== primaryGrammar.categories.join(","),
);
check(
  "alt-flags-differs",
  overlay.features.vtorichka !== primaryFeatures.vtorichka &&
    overlay.features.yurist !== primaryFeatures.yurist,
);
const primaryFixtureDir = "fixtures/fixture-demo";
const primaryContacts = JSON.parse(
  readFileSync(join(root, primaryFixtureDir, "contacts.json"), "utf8"),
) as Array<{ phone: string; email: string }>;
const altContacts = JSON.parse(
  readFileSync(join(root, altDir, "contacts.json"), "utf8"),
) as Array<{ phone: string; email: string }>;
check(
  "alt-brand-differs",
  (altSite.brand as string) !== (primarySite.brand as string),
);
check(
  "alt-contacts-differs",
  altContacts[0]?.phone !== primaryContacts[0]?.phone ||
    altContacts[0]?.email !== primaryContacts[0]?.email,
);
const primaryRouteKeys = new Set(
  primaryGrammar.routes.map((route) => route.pageKey),
);
const altRouteKeys = new Set(overlay.routes.map((route) => route.pageKey));
const routesDiffer =
  primaryRouteKeys.size !== altRouteKeys.size ||
  [...primaryRouteKeys].some((key) => !altRouteKeys.has(key));
check("alt-routes-differs", routesDiffer);
check(
  "platform-untouched-by-alt-geo",
  !readFileSync(join(root, "src/platform/grammar/engine.ts"), "utf8").includes(
    overlay.geo,
  ),
);
check(
  "platform-untouched-by-alt-brand",
  !readFileSync(join(root, "src/platform/grammar/engine.ts"), "utf8").includes(
    altSite.brand,
  ),
);

if (!failed) {
  runChecks("primary-fixture", {
    PROJECT_FIXTURE: "fixture-demo",
  });
}
if (!failed) {
  runChecks("alt-fixture", {
    PROJECT_FIXTURE: "fixture-alt",
  });
}

check(
  "overlay-home-config",
  existsSync(join(root, altDir, "project/home.config.ts")),
);
check(
  "overlay-ui-text-config",
  existsSync(join(root, altDir, "project/ui-text.config.ts")),
);
check("overlay-theme", existsSync(join(root, altDir, "project/theme.css")));

const primaryBrandNeedles = [
  "Старт Недвижимость",
  "start-realty.example",
  "hello@start-realty",
  "Примерск",
];

function collectFiles(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) {
    return files;
  }
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectFiles(full, files);
      continue;
    }
    const ext = extname(full);
    if ([".html", ".rsc", ".css"].includes(ext)) {
      files.push(full);
    }
  }
  return files;
}

function isScanTarget(file: string): boolean {
  const rel = file.slice(root.length + 1).replaceAll("\\", "/");
  if (rel.includes("fixtures/fixture-demo")) {
    return false;
  }
  if (rel.includes("docs/seo")) {
    return false;
  }
  if (rel.includes(".next/cache")) {
    return false;
  }
  return true;
}

if (!failed) {
  const leak = collectFiles(join(root, ".next")).find((file) => {
    if (!isScanTarget(file)) {
      return false;
    }
    const text = readFileSync(file, "utf8");
    return primaryBrandNeedles.some((needle) => text.includes(needle));
  });
  check(
    "alt-next-no-primary-brand",
    !leak,
    leak ? leak.slice(root.length + 1) : "",
  );
}

if (failed) {
  process.exit(1);
}
console.log("template:check PASS");
