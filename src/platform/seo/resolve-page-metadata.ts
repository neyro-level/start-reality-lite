import type { Metadata } from "next";
import type { CatalogSnapshot } from "../catalog/entities";
import {
  findDevelopment,
  findProperty,
  listingPriceCheckedAt,
} from "../catalog/entities";
import { buildHref, type FeatureFlags, type GrammarConfig } from "../grammar";
import { isPubliclyListed, normalizeLifecycle } from "../lifecycle";
import {
  evaluateDevelopmentTextGate,
  evaluatePriceFreshness,
  type PriceGateThresholds,
} from "./content-gate";
import type { SeoRegistryRow } from "./csv";
import {
  absoluteCanonical,
  fillSeoTemplate,
  parseRobotsDirective,
} from "./metadata";
import type { IndexingMode } from "./robots";

export type PageMetadataContext = {
  siteUrl: string;
  indexingMode: IndexingMode;
  grammar: GrammarConfig;
  features: FeatureFlags;
  registry: SeoRegistryRow[];
  thresholds: PriceGateThresholds;
  mapVars: (
    pageKey: string,
    params: Record<string, string>,
    snapshot: CatalogSnapshot,
  ) => Record<string, string | undefined>;
  noindexAutoPageKeys?: readonly string[];
  catalogReady?: boolean;
  listingIndexMinCount?: number;
  now?: Date;
};

export type ResolvedPageMetadata = {
  title: string;
  description: string;
  h1: string;
  canonical: string;
  robots: { index: boolean; follow: boolean };
  gate: "PASS" | "FAIL";
  hidePrice: boolean;
  vars: Record<string, string | undefined>;
  href: string;
  ogTitle: string;
};

const CATALOG_PAGE_KEYS = new Set([
  "property",
  "development",
  "developer",
  "developers",
  "agent",
  "team",
  "geoHub",
  "catNovostroyki",
  "catKvartiry",
  "facetVtorichka",
]);

function isCatalogSeoPage(pageKey: string): boolean {
  return CATALOG_PAGE_KEYS.has(pageKey) || pageKey.startsWith("dist");
}

function rowOrThrow(
  registry: SeoRegistryRow[],
  pageKey: string,
): SeoRegistryRow {
  const row = registry.find((item) => item.pageKey === pageKey);
  if (!row) {
    throw new Error(`SEO registry missing pageKey ${pageKey}`);
  }
  return row;
}

const LISTING_PAGE_KEYS = new Set([
  "catNovostroyki",
  "catKvartiry",
  "facetVtorichka",
]);

function listingObjectCount(
  pageKey: string,
  snapshot: CatalogSnapshot,
): number {
  if (pageKey === "catNovostroyki" || pageKey.startsWith("dist")) {
    return snapshot.developments.filter((item) =>
      isPubliclyListed(item.lifecycle),
    ).length;
  }
  return snapshot.inventory.filter((item) => isPubliclyListed(item.lifecycle))
    .length;
}

export function evaluatePageGate(
  pageKey: string,
  snapshot: CatalogSnapshot,
  params: Record<string, string>,
  thresholds: PriceGateThresholds,
  now: Date,
  catalogReady = true,
  listingIndexMinCount = 1,
): { gate: "PASS" | "FAIL"; hidePrice: boolean; checkedAt?: string } {
  if (!catalogReady && isCatalogSeoPage(pageKey)) {
    return { gate: "FAIL", hidePrice: false };
  }
  if (LISTING_PAGE_KEYS.has(pageKey) || pageKey.startsWith("dist")) {
    if (listingObjectCount(pageKey, snapshot) < listingIndexMinCount) {
      return { gate: "FAIL", hidePrice: false };
    }
  }
  const gated =
    pageKey === "property" ||
    pageKey === "development" ||
    pageKey === "facetVtorichka" ||
    pageKey.startsWith("dist");
  if (!gated) {
    return { gate: "PASS", hidePrice: false };
  }
  if (pageKey === "property") {
    const listing = findProperty(snapshot, params.publicUrlId);
    if (!listing) {
      return { gate: "FAIL", hidePrice: false };
    }
    if (!listing.price) {
      return { gate: "PASS", hidePrice: true };
    }
    const checkedAt = listingPriceCheckedAt(listing);
    const price = evaluatePriceFreshness(checkedAt, now, thresholds);
    return {
      gate: price.gate,
      hidePrice: price.hidePrice,
      checkedAt,
    };
  }
  if (pageKey === "development") {
    const development = findDevelopment(snapshot, params.slug);
    if (!development) {
      return { gate: "FAIL", hidePrice: false };
    }
    const textGate = evaluateDevelopmentTextGate(
      development?.checkedAt,
      now,
      thresholds,
    );
    const priced = snapshot.inventory.filter(
      (item) => item.developmentUid === development.uid && item.price,
    );
    const results = priced.map((item) =>
      evaluatePriceFreshness(listingPriceCheckedAt(item), now, thresholds),
    );
    const hidePrice =
      results.length === 0 || results.every((item) => item.hidePrice);
    const priceGate =
      results.length === 0 || results.some((item) => item.gate === "PASS")
        ? "PASS"
        : "FAIL";
    return {
      gate: textGate === "FAIL" || priceGate === "FAIL" ? "FAIL" : "PASS",
      hidePrice,
      checkedAt: development?.checkedAt,
    };
  }
  const priced = snapshot.inventory.filter((item) => item.price);
  const results = priced.map((item) =>
    evaluatePriceFreshness(listingPriceCheckedAt(item), now, thresholds),
  );
  const hidePrice =
    results.length === 0 || results.every((item) => item.hidePrice);
  const gate =
    results.length === 0 || results.some((item) => item.gate === "PASS")
      ? "PASS"
      : "FAIL";
  return { gate, hidePrice };
}

export function resolveHref(
  context: PageMetadataContext,
  pageKey: string,
  params: Record<string, string>,
): string {
  if (pageKey === "notFound") {
    return "/404/";
  }
  return buildHref(context.grammar, context.features, pageKey, params) ?? "/";
}

export function resolvePageMetadata(
  pageKey: string,
  params: Record<string, string>,
  snapshot: CatalogSnapshot,
  context: PageMetadataContext,
): ResolvedPageMetadata {
  const row = rowOrThrow(context.registry, pageKey);
  const now = context.now ?? new Date();
  const { gate, hidePrice } = evaluatePageGate(
    pageKey,
    snapshot,
    params,
    context.thresholds,
    now,
    context.catalogReady !== false,
    context.listingIndexMinCount ?? 1,
  );
  const vars = context.mapVars(pageKey, params, snapshot);
  const title = fillSeoTemplate(row.title, vars, { hidePrice });
  const description = fillSeoTemplate(row.description, vars, { hidePrice });
  const h1 = fillSeoTemplate(row.h1, vars, { hidePrice });
  const ogTitle = fillSeoTemplate(row.og || row.title, vars, { hidePrice });
  const href = resolveHref(context, pageKey, params);
  const canonical = absoluteCanonical(context.siteUrl, href);
  let robots = parseRobotsDirective(row.robotsDefault);
  if (
    context.indexingMode === "private" ||
    context.indexingMode === "staging"
  ) {
    robots = { index: false, follow: false };
  } else if (context.noindexAutoPageKeys?.includes(pageKey)) {
    robots = { index: false, follow: true };
  } else if (pageKey === "property") {
    const listing = findProperty(snapshot, params.publicUrlId);
    if (!listing) {
      robots = { index: false, follow: false };
    } else if (listing.propertyType === "NEW_BUILD_UNIT") {
      robots = { index: false, follow: true };
    } else if (normalizeLifecycle(listing.lifecycle) === "ARCHIVED_VISIBLE") {
      robots = { index: false, follow: true };
    } else if (gate === "FAIL") {
      robots = { index: false, follow: robots.follow };
    }
  } else if (pageKey === "development") {
    const development = findDevelopment(snapshot, params.slug);
    if (!development) {
      robots = { index: false, follow: false };
    } else if (
      normalizeLifecycle(development.lifecycle) === "ARCHIVED_VISIBLE"
    ) {
      robots = { index: false, follow: true };
    } else if (gate === "FAIL") {
      robots = { index: false, follow: robots.follow };
    }
  } else if (gate === "FAIL") {
    robots = { index: false, follow: robots.follow };
  }
  return {
    title,
    description,
    h1,
    canonical,
    robots,
    gate,
    hidePrice,
    vars,
    href,
    ogTitle,
  };
}

export function toNextMetadata(resolved: ResolvedPageMetadata): Metadata {
  return {
    title: resolved.title,
    description: resolved.description,
    alternates: { canonical: resolved.canonical },
    robots: {
      index: resolved.robots.index,
      follow: resolved.robots.follow,
    },
    openGraph: {
      title: resolved.ogTitle,
      description: resolved.description,
      url: resolved.canonical,
      locale: "ru_RU",
      type: "website",
    },
  };
}

export function isSitemapUrl(resolved: ResolvedPageMetadata): boolean {
  return resolved.robots.index === true && resolved.gate === "PASS";
}
