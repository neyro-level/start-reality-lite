import type { MoneyValue, PublicInventoryDto } from "../hub/contract";
import {
  evaluatePriceFreshness,
  type PriceGateThresholds,
} from "../seo/content-gate";
import { loadFixtureInventory, loadFixtureJson } from "./local";

export type DeveloperRecord = {
  uid: string;
  slug?: string;
  name: string;
};

export type DevelopmentRecord = {
  uid: string;
  publicUrlId?: string;
  slug?: string;
  slugHistory?: string[];
  lifecycle?: string;
  name: string;
  developerUid?: string;
  checkedAt?: string;
};

export type CatalogSnapshot = {
  inventory: PublicInventoryDto[];
  developments: DevelopmentRecord[];
  developers: DeveloperRecord[];
};

export function loadCatalogSnapshot(
  root: string,
  fixtureDir: string,
): CatalogSnapshot {
  const developers = loadFixtureJson<DeveloperRecord[]>(
    root,
    fixtureDir,
    "developers.json",
  );
  const developments = loadFixtureJson<DevelopmentRecord[]>(
    root,
    fixtureDir,
    "developments.json",
  );
  return {
    inventory: loadFixtureInventory(root, fixtureDir),
    developments,
    developers,
  };
}

export function roomsOf(listing: PublicInventoryDto): number | null {
  return "rooms" in listing.facts && typeof listing.facts.rooms === "number"
    ? listing.facts.rooms
    : null;
}

export function propertySemantic(listing: PublicInventoryDto): string | null {
  const rooms = roomsOf(listing);
  return rooms === null ? null : `${rooms}k`;
}

export function propertyUrlParams(listing: {
  slug?: string;
  publicUrlId: string;
}): { slug: string; publicUrlId: string } {
  return {
    slug: listing.slug || listing.publicUrlId,
    publicUrlId: listing.publicUrlId,
  };
}

export function developmentUrlSlug(item: DevelopmentRecord): string {
  if (item.slug?.startsWith("zhk-")) {
    return item.slug.slice(4);
  }
  return item.slug || item.publicUrlId || item.uid;
}

export function formatMoney(price?: MoneyValue): string | undefined {
  if (!price) {
    return undefined;
  }
  const major = Number(price.amount) / 10 ** price.scale;
  if (!Number.isFinite(major)) {
    return undefined;
  }
  return String(Math.round(major));
}

export function findProperty(
  snapshot: CatalogSnapshot,
  id: string | undefined,
): PublicInventoryDto | undefined {
  if (!id) {
    return undefined;
  }
  return snapshot.inventory.find((item) => item.publicUrlId === id);
}

export function findDevelopment(
  snapshot: CatalogSnapshot,
  slug: string | undefined,
): DevelopmentRecord | undefined {
  if (!slug) {
    return undefined;
  }
  return snapshot.developments.find((item) => {
    if (
      developmentUrlSlug(item) === slug ||
      item.slug === slug ||
      item.publicUrlId === slug
    ) {
      return true;
    }
    return (item.slugHistory ?? []).some(
      (historic) =>
        historic === slug ||
        historic === `zhk-${slug}` ||
        developmentUrlSlug({ ...item, slug: historic }) === slug,
    );
  });
}

export function findDeveloper(
  snapshot: CatalogSnapshot,
  slug: string | undefined,
): DeveloperRecord | undefined {
  if (!slug) {
    return undefined;
  }
  return snapshot.developers.find(
    (item) => Boolean(item.slug) && item.slug === slug,
  );
}

export function developmentOf(
  snapshot: CatalogSnapshot,
  listing: PublicInventoryDto,
): DevelopmentRecord | undefined {
  if (!listing.developmentUid) {
    return undefined;
  }
  return snapshot.developments.find(
    (item) => item.uid === listing.developmentUid,
  );
}

export function developerOf(
  snapshot: CatalogSnapshot,
  development: DevelopmentRecord | undefined,
): DeveloperRecord | undefined {
  if (!development?.developerUid) {
    return undefined;
  }
  return snapshot.developers.find(
    (item) => item.uid === development.developerUid,
  );
}

export function listingPriceCheckedAt(
  listing: PublicInventoryDto,
): string | undefined {
  return listing.priceCheckedAt;
}

export function hideListingPrice(
  listing: PublicInventoryDto,
  now: Date,
  thresholds?: PriceGateThresholds,
): boolean {
  if (!listing.price) {
    return true;
  }
  if (!thresholds) {
    return !listingPriceCheckedAt(listing);
  }
  return evaluatePriceFreshness(listingPriceCheckedAt(listing), now, thresholds)
    .hidePrice;
}

export function minPriceForDevelopment(
  snapshot: CatalogSnapshot,
  developmentUid: string,
  now: Date = new Date(),
  thresholds?: PriceGateThresholds,
): string | undefined {
  const prices = snapshot.inventory
    .filter(
      (item) =>
        item.developmentUid === developmentUid &&
        !hideListingPrice(item, now, thresholds),
    )
    .map((item) => formatMoney(item.price))
    .filter((value): value is string => Boolean(value))
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  if (prices.length === 0) {
    return undefined;
  }
  return String(Math.min(...prices));
}
