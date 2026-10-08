import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

const packageJson = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};
const allDeps = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

const forbiddenPackages = [
  "@prisma/client",
  "prisma",
  "payload",
  "@payloadcms/db-postgres",
  "pg",
  "postgres",
];
for (const pkg of forbiddenPackages) {
  check(`gate6-no-package-${pkg}`, allDeps[pkg] === undefined);
}

const envExample = readFileSync(join(root, ".env.example"), "utf8");
check("gate6-no-database-url", !/DATABASE_URL/i.test(envExample));

const verifyScript = packageJson.scripts?.verify ?? "";
check(
  "gate5-verify-includes-template-check",
  verifyScript.includes("template:check"),
);
check(
  "gate5-verify-includes-exit-mode",
  verifyScript.includes("verify:exit-mode"),
);
check(
  "gate5-verify-includes-lifecycle",
  verifyScript.includes("verify:lifecycle"),
);
check(
  "gate5-verify-includes-repository",
  verifyScript.includes("verify:repository"),
);
check(
  "gate5-verify-includes-e2e-chain",
  verifyScript.includes("verify:ui-core"),
);

check(
  "gate1-new-project-doc",
  readFileSync(join(root, "docs/NEW_PROJECT.md"), "utf8").includes(
    "template:check",
  ),
);
check(
  "gate1-freeze-doc",
  readFileSync(
    join(root, "docs/archive/TEMPLATE_FREEZE_GATE.md"),
    "utf8",
  ).includes("verify:freeze"),
);

check(
  "gate6-no-payload-in-src",
  !readFileSync(join(root, "src/platform/env.ts"), "utf8").includes(
    "DATABASE_URL",
  ),
);

if (failed) {
  process.exit(1);
}
console.log("verify:freeze PASS");
