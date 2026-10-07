import type { PublicInventoryDto } from "../hub/contract";
import { isPubliclyListed, normalizeLifecycle } from "../lifecycle";
import type { PriceGateThresholds } from "../seo/content-gate";
import type {
  AgentCardDTO,
  AgentDetailsDTO,
  DeveloperDTO,
  DevelopmentCardDTO,
  DevelopmentDetailsDTO,
  GeoDTO,
  MediaRefDTO,
  MoneyDTO,
  ProjectContactDTO,
  PropertyCardDTO,
  PropertyDetailsDTO,
} from "./dto";
import {
  type CatalogSnapshot,
  developerOf,
  developmentUrlSlug,
  hideListingPrice,
  loadCatalogSnapshot,
  roomsOf,
} from "./entities";
import { loadFixtureJson } from "./local";
import type {
  DevelopmentListQuery,
  PropertyListQuery,
  RealtyRepository,
} from "./repository";

type GeoRecord = { uid: string; name: string; slug?: string };
type AgentRecord = {
  uid: string;
  slug?: string;
  displayName: string;
  lifecycle?: string;
};
type ContactRecord = {
  phone: string;
  email?: string;
  messengers?: string[];
  addressPublic?: string;
  hours?: string;
};

function money(price?: {
  amount: string;
  currency: string;
  scale: number;
}): MoneyDTO | null {
  if (!price) {
    return null;
  }
  return {
    amount: price.amount,
    currency: price.currency,
    scale: price.scale,
  };
}

function areaOf(listing: PublicInventoryDto): number | null {
  return "totalAreaM2" in listing.facts &&
    typeof listing.facts.totalAreaM2 === "number"
    ? listing.facts.totalAreaM2
    : null;
}

function floorOf(listing: PublicInventoryDto): number | null {
  return "floor" in listing.facts && typeof listing.facts.floor === "number"
    ? listing.facts.floor
    : null;
}

function floorsTotalOf(listing: PublicInventoryDto): number | null {
  return "floorsTotal" in listing.facts &&
    typeof listing.facts.floorsTotal === "number"
    ? listing.facts.floorsTotal
    : null;
}

function mediaOf(listing: PublicInventoryDto): MediaRefDTO[] {
  return listing.media
    .filter((item) => Boolean(item.url))
    .map((item) => ({ src: item.url as string, alt: null }));
}

export class SnapshotRepository implements RealtyRepository {
  private readonly byUid = new Map<string, PublicInventoryDto>();
  private readonly byPublicUrlId = new Map<string, PublicInventoryDto>();
  private readonly bySlug = new Map<string, PublicInventoryDto>();
  private readonly byDevelopmentUid = new Map<string, PublicInventoryDto[]>();
  private readonly geoBySlug = new Map<string, GeoDTO>();
  private readonly developmentByUid = new Map<
    string,
    CatalogSnapshot["developments"][number]
  >();
  private readonly developmentBySlug = new Map<
    string,
    CatalogSnapshot["developments"][number]
  >();
  private readonly developerBySlug = new Map<
    string,
    CatalogSnapshot["developers"][number]
  >();
  private readonly agentByUid = new Map<string, AgentRecord>();

  constructor(
    private readonly snapshot: CatalogSnapshot,
    private readonly geos: GeoDTO[],
    private readonly agents: AgentRecord[],
    private readonly contact: ProjectContactDTO | null,
    private readonly catalogReady = true,
    private readonly priceGate?: {
      thresholds: PriceGateThresholds;
      now?: Date;
    },
  ) {
    this.buildIndexes();
  }

  hasCatalog(): boolean {
    return this.catalogReady;
  }

  /** Catalog view for SEO, lifecycle, and sitemap (same revision as repository reads). */
  catalogSnapshot(): CatalogSnapshot {
    return this.snapshot;
  }

  static empty(): SnapshotRepository {
    return new SnapshotRepository(
      { inventory: [], developments: [], developers: [] },
      [],
      [],
      null,
      false,
    );
  }

  static fromRevisionDir(
    root: string,
    revisionDir: string,
    catalogReady = true,
    priceGate?: { thresholds: PriceGateThresholds; now?: Date },
  ): SnapshotRepository {
    const snapshot = loadCatalogSnapshot(root, revisionDir);
    const geos = loadFixtureJson<GeoRecord[]>(
      root,
      revisionDir,
      "geo.json",
    ).map((item) => ({
      uid: item.uid,
      slug: item.slug ?? item.uid,
      name: item.name,
    }));
    const agents = loadFixtureJson<AgentRecord[]>(
      root,
      revisionDir,
      "agents.json",
    );
    const contacts = loadFixtureJson<ContactRecord[]>(
      root,
      revisionDir,
      "contacts.json",
    );
    const raw = contacts[0];
    const contact: ProjectContactDTO | null = raw
      ? {
          phone: raw.phone,
          email: raw.email ?? null,
          messengers: raw.messengers ?? null,
          address: raw.addressPublic ?? null,
          hours: raw.hours ?? null,
        }
      : null;
    return new SnapshotRepository(
      snapshot,
      geos,
      agents,
      contact,
      catalogReady,
      priceGate,
    );
  }

  private buildIndexes(): void {
    for (const geo of this.geos) {
      this.geoBySlug.set(geo.slug, geo);
    }
    for (const developer of this.snapshot.developers) {
      if (developer.slug) {
        this.developerBySlug.set(developer.slug, developer);
      }
    }
    for (const development of this.snapshot.developments) {
      this.developmentByUid.set(development.uid, development);
      this.developmentBySlug.set(developmentUrlSlug(development), development);
      if (development.slug) {
        this.developmentBySlug.set(development.slug, development);
      }
      if (development.publicUrlId) {
        this.developmentBySlug.set(development.publicUrlId, development);
      }
    }
    for (const agent of this.agents) {
      this.agentByUid.set(agent.uid, agent);
    }
    for (const item of this.snapshot.inventory) {
      this.byUid.set(item.uid, item);
      this.byPublicUrlId.set(item.publicUrlId, item);
      if (item.slug) {
        this.bySlug.set(item.slug, item);
      }
      if (item.developmentUid) {
        const bucket = this.byDevelopmentUid.get(item.developmentUid) ?? [];
        bucket.push(item);
        this.byDevelopmentUid.set(item.developmentUid, bucket);
      }
    }
  }

  async getProjectContact(): Promise<ProjectContactDTO | null> {
    return this.contact;
  }

  async getGeo(slug: string): Promise<GeoDTO | null> {
    return this.geoBySlug.get(slug) ?? null;
  }

  async listProperties(query?: PropertyListQuery): Promise<PropertyCardDTO[]> {
    return this.snapshot.inventory
      .filter((item) => {
        if (query?.dealKind && item.dealKind !== query.dealKind) {
          return false;
        }
        if (
          query?.developmentUid &&
          item.developmentUid !== query.developmentUid
        ) {
          return false;
        }
        const development = item.developmentUid
          ? this.developmentByUid.get(item.developmentUid)
          : undefined;
        if (
          query?.developerUid &&
          development?.developerUid !== query.developerUid
        ) {
          return false;
        }
        return isPubliclyListed(item.lifecycle);
      })
      .map((item) => this.toPropertyCard(item));
  }

  async getProperty(publicUrlId: string): Promise<PropertyDetailsDTO | null> {
    const listing = this.byPublicUrlId.get(publicUrlId);
    if (!listing) {
      return null;
    }
    const development = listing.developmentUid
      ? this.developmentByUid.get(listing.developmentUid)
      : undefined;
    const developer = developerOf(this.snapshot, development);
    const agent = listing.agentUid
      ? this.agentByUid.get(listing.agentUid)
      : undefined;
    const contact = this.contact;
    if (!contact) {
      return null;
    }
    return {
      uid: listing.uid,
      publicUrlId: listing.publicUrlId,
      slug: listing.slug || listing.publicUrlId,
      title: this.propertyTitle(listing),
      rooms: roomsOf(listing),
      area: areaOf(listing),
      floor: floorOf(listing),
      floorsTotal: floorsTotalOf(listing),
      price: this.publicPriceOf(listing),
      hidePrice: this.hidePriceOf(listing),
      description:
        listing.descriptionText ?? listing.descriptionHtmlSafe ?? null,
      geo: this.geoForPrecision(listing.geoPrecision),
      geoPrecision: listing.geoPrecision,
      development: development ? this.toDevelopmentCard(development) : null,
      developer: developer ? this.toDeveloper(developer) : null,
      agent: agent ? this.toAgentCard(agent) : null,
      contact,
      media: mediaOf(listing),
      lifecycle: normalizeLifecycle(listing.lifecycle),
    };
  }

  async listDevelopments(
    query?: DevelopmentListQuery,
  ): Promise<DevelopmentCardDTO[]> {
    return this.snapshot.developments
      .filter((item) => {
        if (query?.developerUid && item.developerUid !== query.developerUid) {
          return false;
        }
        return Boolean(item.publicUrlId) && isPubliclyListed(item.lifecycle);
      })
      .map((item) => this.toDevelopmentCard(item));
  }

  async getDevelopment(
    publicUrlId: string,
  ): Promise<DevelopmentDetailsDTO | null> {
    const development = this.developmentBySlug.get(publicUrlId);
    if (!development?.publicUrlId) {
      return null;
    }
    const developer = developerOf(this.snapshot, development);
    const contact = this.contact;
    if (!contact) {
      return null;
    }
    const properties = (this.byDevelopmentUid.get(development.uid) ?? []).map(
      (item) => this.toPropertyCard(item),
    );
    return {
      uid: development.uid,
      publicUrlId: development.publicUrlId,
      slug: developmentUrlSlug(development),
      name: development.name,
      description: null,
      developer: developer ? this.toDeveloper(developer) : null,
      geo: this.geoForPrecision(undefined),
      contact,
      media: [],
      properties,
      minPrice: this.toDevelopmentCard(development).minPrice,
      lifecycle: normalizeLifecycle(development.lifecycle),
    };
  }

  async listDevelopers(): Promise<DeveloperDTO[]> {
    return this.snapshot.developers.map((item) => this.toDeveloper(item));
  }

  async getDeveloper(slug: string): Promise<DeveloperDTO | null> {
    const developer = this.developerBySlug.get(slug);
    return developer ? this.toDeveloper(developer) : null;
  }

  async listAgents(): Promise<AgentCardDTO[]> {
    return this.agents.map((item) => this.toAgentCard(item));
  }

  async getAgent(slug: string): Promise<AgentDetailsDTO | null> {
    const agent =
      this.agents.find((item) => (item.slug ?? item.uid) === slug) ??
      this.agentByUid.get(slug);
    if (!agent) {
      return null;
    }
    return {
      uid: agent.uid,
      slug: agent.slug ?? agent.uid,
      name: agent.displayName,
      role: null,
      title: null,
      bio: null,
      specializations: null,
      photo: null,
      workPhone: this.contact?.phone ?? null,
      workEmail: null,
      lifecycle: normalizeLifecycle(agent.lifecycle),
    };
  }

  private propertyTitle(listing: PublicInventoryDto): string {
    const development = listing.developmentUid
      ? this.developmentByUid.get(listing.developmentUid)
      : undefined;
    return development?.name ?? listing.addressPublic;
  }

  private toPropertyCard(listing: PublicInventoryDto): PropertyCardDTO {
    const development = listing.developmentUid
      ? this.developmentByUid.get(listing.developmentUid)
      : undefined;
    return {
      uid: listing.uid,
      publicUrlId: listing.publicUrlId,
      slug: listing.slug || listing.publicUrlId,
      title: this.propertyTitle(listing),
      rooms: roomsOf(listing),
      area: areaOf(listing),
      price: this.publicPriceOf(listing),
      hidePrice: this.hidePriceOf(listing),
      geoSlug: this.geos[0]?.slug ?? null,
      geoPrecision: listing.geoPrecision,
      developmentPublicUrlId: development?.publicUrlId ?? null,
    };
  }

  private toDevelopmentCard(
    development: CatalogSnapshot["developments"][number],
  ): DevelopmentCardDTO {
    const prices = (this.byDevelopmentUid.get(development.uid) ?? [])
      .map((item) => this.publicPriceOf(item))
      .filter((item): item is MoneyDTO => Boolean(item));
    const minPrice =
      prices.length === 0
        ? null
        : prices.reduce((lowest, item) =>
            Number(item.amount) < Number(lowest.amount) ? item : lowest,
          );
    return {
      uid: development.uid,
      publicUrlId: development.publicUrlId ?? development.uid,
      slug: developmentUrlSlug(development),
      name: development.name,
      developerUid: development.developerUid ?? null,
      minPrice,
    };
  }

  private toDeveloper(
    developer: CatalogSnapshot["developers"][number],
  ): DeveloperDTO {
    return {
      uid: developer.uid,
      slug: developer.slug ?? null,
      name: developer.name,
    };
  }

  private hidePriceOf(listing: PublicInventoryDto): boolean {
    return hideListingPrice(
      listing,
      this.priceGate?.now ?? new Date(),
      this.priceGate?.thresholds,
    );
  }

  private publicPriceOf(listing: PublicInventoryDto): MoneyDTO | null {
    return this.hidePriceOf(listing) ? null : money(listing.price);
  }

  private geoForPrecision(precision: GeoDTO["precision"]): GeoDTO | null {
    const geo = this.geos[0];
    if (!geo) {
      return null;
    }
    return precision ? { ...geo, precision } : geo;
  }

  private toAgentCard(agent: AgentRecord): AgentCardDTO {
    return {
      uid: agent.uid,
      slug: agent.slug ?? agent.uid,
      name: agent.displayName,
      role: null,
      photo: null,
    };
  }
}
