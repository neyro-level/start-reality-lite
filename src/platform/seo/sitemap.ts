import type { MetadataRoute } from "next";
import type { CatalogSnapshot } from "../catalog/entities";
import {
  developmentUrlSlug,
  findDeveloper,
  findDevelopment,
  findProperty,
  listingPriceCheckedAt,
  propertyUrlParams,
} from "../catalog/entities";
import { buildHref, isFeatureEnabled } from "../grammar";
import { isPubliclyListed } from "../lifecycle";
import {
  isSitemapUrl,
  type PageMetadataContext,
  resolvePageMetadata,
} from "./resolve-page-metadata";
import { sitemapAllowed } from "./robots";

function factualLastModified(
  pageKey: string,
  params: Record<string, string>,
  snapshot: CatalogSnapshot,
): Date | undefined {
  if (pageKey === "property") {
    const listing = findProperty(snapshot, params.publicUrlId);
    if (!listing) {
      return undefined;
    }
    const checkedAt = listingPriceCheckedAt(listing);
    if (!checkedAt) {
      return undefined;
    }
    const date = new Date(checkedAt);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  if (pageKey === "development") {
    const development = findDevelopment(snapshot, params.slug);
    const checkedAt = development?.checkedAt;
    if (!checkedAt) {
      return undefined;
    }
    const date = new Date(checkedAt);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  const inventoryGated =
    pageKey === "facetVtorichka" || pageKey.startsWith("dist");
  if (!inventoryGated) {
    return undefined;
  }
  const dates = snapshot.inventory
    .map((item) => listingPriceCheckedAt(item))
    .filter((value): value is string => Boolean(value));
  if (dates.length === 0) {
    return undefined;
  }
  const latest = dates.reduce((left, right) => (left > right ? left : right));
  const date = new Date(latest);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function buildSitemapEntries(
  snapshot: CatalogSnapshot,
  context: PageMetadataContext,
): MetadataRoute.Sitemap {
  if (!sitemapAllowed(context.indexingMode)) {
    return [];
  }
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();
  const push = (pageKey: string, params: Record<string, string> = {}) => {
    const href = buildHref(context.grammar, context.features, pageKey, params);
    if (!href) {
      return;
    }
    const resolved = resolvePageMetadata(pageKey, params, snapshot, context);
    if (!isSitemapUrl(resolved)) {
      return;
    }
    if (seen.has(resolved.canonical)) {
      return;
    }
    seen.add(resolved.canonical);
    const lastModified = factualLastModified(pageKey, params, snapshot);
    entries.push(
      lastModified
        ? { url: resolved.canonical, lastModified }
        : { url: resolved.canonical },
    );
  };

  for (const route of context.grammar.routes) {
    if (!isFeatureEnabled(context.features, route.feature)) {
      continue;
    }
    if (route.pageKey === "developer") {
      for (const developer of snapshot.developers) {
        if (developer.slug && findDeveloper(snapshot, developer.slug)) {
          push("developer", { slug: developer.slug });
        }
      }
      continue;
    }
    if (route.pageKey === "development") {
      for (const development of snapshot.developments) {
        if (
          development.publicUrlId &&
          isPubliclyListed(development.lifecycle)
        ) {
          push("development", { slug: developmentUrlSlug(development) });
        }
      }
      continue;
    }
    if (route.pageKey === "property") {
      for (const listing of snapshot.inventory) {
        if (
          findProperty(snapshot, listing.publicUrlId) &&
          isPubliclyListed(listing.lifecycle)
        ) {
          push("property", propertyUrlParams(listing));
        }
      }
      continue;
    }
    if (route.pageKey === "agent") {
      continue;
    }
    push(route.pageKey);
  }
  return entries;
}
