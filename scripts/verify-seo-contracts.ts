import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SnapshotRepository } from "../src/platform/catalog/snapshot-repository";
import { buildHref } from "../src/platform/grammar";
import {
  buildBreadcrumbListJsonLd,
  buildRealEstateAgentJsonLd,
  buildRobotsTxt,
  buildSitemapEntries,
  evaluateDevelopmentTextGate,
  evaluatePriceFreshness,
  fillSeoTemplate,
  jsonLdHasForbiddenType,
  legacyLocation,
  matchLegacy,
  parseSeoRegistryCsv,
  resolvePageMetadata,
  sitemapAllowed,
} from "../src/platform/seo";
import { features } from "../src/project/features.config";
import { grammar } from "../src/project/grammar.config";
import { legacyRules } from "../src/project/redirects/legacy";
import { metadataContext } from "../src/project/runtime";
import { seo } from "../src/project/seo.config";
import { site } from "../src/project/site.config";

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

const csv = readFileSync(join(root, seo.registryPath), "utf8");
const rows = parseSeoRegistryCsv(csv);
const byKey = new Map(rows.map((row) => [row.pageKey, row]));

for (const route of grammar.routes) {
  check(`pageKey-present:${route.pageKey}`, byKey.has(route.pageKey));
}
check("pageKey-present:notFound", byKey.has("notFound"));

const forbiddenKeys = ["stroitelstvo", "otzyvy", "reviews", "blog"];
for (const key of forbiddenKeys) {
  check(`d14-absent:${key}`, !byKey.has(key));
}

const titles = new Set<string>();
const descriptions = new Set<string>();
for (const row of rows) {
  check(`unique-title:${row.pageKey}`, !titles.has(row.title), row.title);
  titles.add(row.title);
  check(
    `unique-description:${row.pageKey}`,
    !descriptions.has(row.description),
  );
  descriptions.add(row.description);
  if (!row.title.includes("{")) {
    const len = [...row.title].length;
    check(
      `title-length:${row.pageKey}`,
      len >= seo.titleMin && len <= seo.titleMax,
      String(len),
    );
  }
  if (!row.description.includes("{")) {
    const len = [...row.description].length;
    check(
      `description-length:${row.pageKey}`,
      len >= seo.descriptionMin && len <= seo.descriptionMax,
      String(len),
    );
  }
  if (seo.brandInTitlePageKeys.includes(row.pageKey as never)) {
    check(`brand-in-title:${row.pageKey}`, row.title.includes(site.brand));
  }
  if (seo.catalogPageKeys.includes(row.pageKey as never)) {
    check(`catalog-no-brand:${row.pageKey}`, !row.title.includes(site.brand));
  }
}

const thresholds = {
  hideAfterDays: seo.priceHideAfterDays,
  failAfterDays: seo.priceGateFailAfterDays,
  developmentTextFailAfterDays: seo.developmentTextFailAfterDays,
};
const now = new Date("2026-10-03T00:00:00Z");
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 86_400_000).toISOString();

check(
  "d4-show-at-45",
  evaluatePriceFreshness(daysAgo(45), now, thresholds).hidePrice === false &&
    evaluatePriceFreshness(daysAgo(45), now, thresholds).gate === "PASS",
);
check(
  "d4-hide-at-46",
  evaluatePriceFreshness(daysAgo(46), now, thresholds).hidePrice === true &&
    evaluatePriceFreshness(daysAgo(46), now, thresholds).gate === "PASS",
);
check(
  "d4-fail-at-120",
  evaluatePriceFreshness(daysAgo(120), now, thresholds).gate === "FAIL",
);
check(
  "d4-text-pass-at-180",
  evaluateDevelopmentTextGate(daysAgo(180), now, thresholds) === "PASS",
);
check(
  "d4-text-fail-at-181",
  evaluateDevelopmentTextGate(daysAgo(181), now, thresholds) === "FAIL",
);

const propertyTitle = byKey.get("property")?.title ?? "";
const hidden = fillSeoTemplate(
  propertyTitle,
  { N: "2", S: "54", "ЖК|район": "ЖК Река", price: "8500000" },
  { hidePrice: true },
);
check(
  "hidden-price-not-in-title",
  !hidden.includes("8500000") && !hidden.includes("₽"),
);

const exampleEnv = readFileSync(join(root, ".env.example"), "utf8").replaceAll(
  "\r\n",
  "\n",
);
const envSource = readFileSync(join(root, "src/platform/env.ts"), "utf8");
check(
  "INDEXING_MODE=private",
  /^INDEXING_MODE$/m.test(exampleEnv) &&
    envSource.includes('.default("private")'),
);

const agent = buildRealEstateAgentJsonLd({
  name: site.brand,
  url: site.siteUrl,
  telephone: site.phoneTel,
  email: site.email,
  address: site.address,
  openingHours: site.hoursSchema,
});
check("d12-agent-type", agent["@type"] === "RealEstateAgent");
check("d12-no-forbidden-types", jsonLdHasForbiddenType(agent) === false);

const crumbs = buildBreadcrumbListJsonLd([
  { name: site.brand, item: `${site.siteUrl}/` },
]);
check("d12-breadcrumb-type", crumbs["@type"] === "BreadcrumbList");
check("d12-breadcrumb-clean", jsonLdHasForbiddenType(crumbs) === false);
check(
  "seo-registry-og-column",
  rows.every((row) => typeof row.og === "string"),
);

const gone = matchLegacy("/blog/old-post/", legacyRules);
check("legacy-410-blog", gone?.status === 410);
const sample308 = legacyRules.find((rule) => rule.status === 308);
const moved = sample308 ? matchLegacy(sample308.from, legacyRules) : null;
const novostroykiHref = buildHref(grammar, features, "catNovostroyki");
check(
  "legacy-308-novostroyki",
  Boolean(sample308) &&
    moved?.status === 308 &&
    Boolean(novostroykiHref) &&
    legacyLocation(moved, grammar, features) === novostroykiHref,
);

function legacyPathname(href: string): string {
  return new URL(href, site.siteUrl).pathname;
}

for (const rule of legacyRules) {
  if (rule.status !== 308) {
    continue;
  }
  const matched = matchLegacy(rule.from, legacyRules);
  const target = matched ? legacyLocation(matched, grammar, features) : null;
  check(`legacy-target-resolves:${rule.from}`, Boolean(target));
  if (!target) {
    continue;
  }
  const pathname = legacyPathname(target);
  const chain = matchLegacy(pathname, legacyRules);
  check(
    `legacy-no-redirect-chain:${rule.from}`,
    !chain || chain.status === 410,
    chain?.status === 308 ? pathname : "",
  );
}
check(
  "robots-staging-disallow",
  buildRobotsTxt("staging").includes("Disallow: /"),
);
check(
  "robots-private-disallow",
  buildRobotsTxt("private").includes("Disallow: /"),
);
check("sitemap-staging-empty", sitemapAllowed("staging") === false);
check("sitemap-private-empty", sitemapAllowed("private") === false);

const repo = SnapshotRepository.fromRevisionDir(root, "fixtures/fixture-demo");
const snapshot = repo.catalogSnapshot();
const context = metadataContext();
const publicContext = { ...context, indexingMode: "public" as const };
let missingThrows = false;
try {
  resolvePageMetadata("missing-page-key", {}, snapshot, context);
} catch {
  missingThrows = true;
}
check("missing-registry-row-throws", missingThrows);

const homeMeta = resolvePageMetadata("home", {}, snapshot, context);
check(
  "resolver-title-from-registry",
  homeMeta.title === fillSeoTemplate(byKey.get("home")?.title ?? "", {}),
);
check(
  "home-title-not-placeholder",
  homeMeta.title !== "Realty Lite" && homeMeta.title.length >= seo.titleMin,
);
check(
  "home-canonical-absolute",
  homeMeta.canonical.startsWith("https://") && homeMeta.canonical.endsWith("/"),
);
check(
  "home-single-h1",
  typeof homeMeta.h1 === "string" && homeMeta.h1.length > 0,
);

const listing = snapshot.inventory[0];
if (listing) {
  const propertyMeta = resolvePageMetadata(
    "property",
    {
      slug: listing.slug || listing.publicUrlId,
      publicUrlId: listing.publicUrlId,
    },
    snapshot,
    context,
  );
  const pLen = [...propertyMeta.title].length;
  check(
    "filled-property-title-length",
    pLen >= seo.titleMin && pLen <= seo.titleMax,
    String(pLen),
  );
  const dLen = [...propertyMeta.description].length;
  check(
    "filled-property-description-length",
    dLen >= seo.descriptionMin && dLen <= seo.descriptionMax,
    String(dLen),
  );
}

for (const pageKey of seo.noindexAutoPageKeys) {
  const starterMeta = resolvePageMetadata(pageKey, {}, snapshot, publicContext);
  check(
    `starter-noindex:${pageKey}`,
    starterMeta.robots.index === false && starterMeta.robots.follow === true,
  );
}

const liveEntries = buildSitemapEntries(snapshot, publicContext);
check("sitemap-public-not-empty", liveEntries.length > 0);
const liveUrls = liveEntries.map((item) => String(item.url));
check(
  "sitemap-no-duplicate-canonicals",
  liveUrls.length === new Set(liveUrls).size,
);
check(
  "sitemap-public-no-noindex-thanks",
  liveEntries.every((item) => !String(item.url).includes("/spasibo/")),
);
const propertySitemapEntry = listing
  ? liveEntries.find((item) =>
      String(item.url).includes(`-${listing.publicUrlId}/`),
    )
  : undefined;
check(
  "sitemap-property-factual-lastmod",
  propertySitemapEntry?.lastModified instanceof Date,
);
const stagingEntries = buildSitemapEntries(snapshot, {
  ...context,
  indexingMode: "staging",
});
check("sitemap-staging-entries-empty", stagingEntries.length === 0);

const privateHome = resolvePageMetadata("home", {}, snapshot, {
  ...context,
  indexingMode: "private",
});
check(
  "private-html-noindex-nofollow",
  privateHome.robots.index === false && privateHome.robots.follow === false,
);
const stagingHome = resolvePageMetadata("home", {}, snapshot, {
  ...context,
  indexingMode: "staging",
});
check(
  "staging-html-noindex-nofollow",
  stagingHome.robots.index === false && stagingHome.robots.follow === false,
);
check("og-title-present", privateHome.ogTitle.length > 0);

if (listing) {
  const unitMeta = resolvePageMetadata(
    "property",
    {
      slug: listing.slug || listing.publicUrlId,
      publicUrlId: listing.publicUrlId,
    },
    {
      ...snapshot,
      inventory: snapshot.inventory.map((item) =>
        item.publicUrlId === listing.publicUrlId
          ? { ...item, propertyType: "NEW_BUILD_UNIT" as const }
          : item,
      ),
    },
    publicContext,
  );
  check(
    "new-build-unit-noindex-follow",
    unitMeta.robots.index === false && unitMeta.robots.follow === true,
  );
}

const thinListing = resolvePageMetadata(
  "catNovostroyki",
  {},
  { ...snapshot, developments: [] },
  { ...publicContext, listingIndexMinCount: 3 },
);
check("listing-gate-threshold", thinListing.gate === "FAIL");

if (failed) {
  process.exit(1);
}
console.log("verify:seo-contracts PASS");
