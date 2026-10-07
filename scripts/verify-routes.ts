import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildHref,
  isFeatureEnabled,
  matchPath,
} from "../src/platform/grammar";
import { resolveNavGroup } from "../src/platform/nav";
import { parseSeoRegistryCsv } from "../src/platform/seo";
import { features } from "../src/project/features.config";
import { grammar } from "../src/project/grammar.config";
import { navigation } from "../src/project/navigation.config";
import { seo } from "../src/project/seo.config";

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

const registry = parseSeoRegistryCsv(
  readFileSync(join(root, seo.registryPath), "utf8"),
);
const grammarKeys = new Set<string>(
  grammar.routes.map((route) => route.pageKey),
);

for (const route of grammar.routes) {
  const href = buildHref(grammar, features, route.pageKey, {
    slug: "sample",
    publicUrlId: "aaaaab",
    semantic: "2k",
    id: "aaaaab",
  });
  if (!href) {
    const feature =
      "feature" in route
        ? (route.feature as keyof typeof features | undefined)
        : undefined;
    check(
      `route-disabled:${route.pageKey}`,
      Boolean(feature) && !isFeatureEnabled(features, feature),
    );
    continue;
  }
  const matched = matchPath(grammar, features, href);
  check(
    `route-match:${route.pageKey}`,
    matched?.pageKey === route.pageKey,
    matched?.pageKey,
  );
}

for (const row of registry) {
  if (row.pageKey === "notFound") {
    continue;
  }
  check(`registry-in-grammar:${row.pageKey}`, grammarKeys.has(row.pageKey));
}

check("search-disabled", features.search === "DISABLED");
check("favorites-disabled", features.favorites === "DISABLED");
check("search-href-absent", !buildHref(grammar, features, "search"));
check("favorites-href-absent", !buildHref(grammar, features, "favorites"));

const header = navigation.header.flatMap(
  (group) =>
    resolveNavGroup(group, grammar, features, registry, navigation.labels)
      .items,
);
const footer = navigation.footer.flatMap(
  (group) =>
    resolveNavGroup(group, grammar, features, registry, navigation.labels)
      .items,
);
const geoHub = buildHref(grammar, features, "geoHub");
check(
  "nav-hides-noindex-geoHub",
  !geoHub || header.every((item) => item.href !== geoHub),
);
check(
  "nav-hides-favorites",
  header.every((item) => !item.href.includes("izbrannoe")) &&
    footer.every((item) => !item.href.includes("izbrannoe")),
);
check(
  "nav-hides-search",
  header.every((item) => !item.href.includes("/poisk/")) &&
    footer.every((item) => !item.href.includes("/poisk/")),
);
const yuristOff = resolveNavGroup(
  navigation.header[1],
  grammar,
  { ...features, yurist: "DISABLED" },
  registry,
  navigation.labels,
);
check(
  "nav-hides-disabled-yurist",
  yuristOff.items.every((item) => item.label !== navigation.labels.yurist),
);
if (grammar.routes.some((route) => route.pageKey === "privacy")) {
  const docs = resolveNavGroup(
    navigation.footer[3],
    grammar,
    features,
    registry,
    navigation.labels,
  );
  check(
    "footer-documents-privacy",
    docs.items.some((item) => item.label === navigation.labels.privacy),
  );
}

if (failed) {
  process.exit(1);
}
console.log("route list vs §7 PASS");
