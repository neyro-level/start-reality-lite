import { z } from "zod";

export const HUB_CONTRACT_VERSION = "3.1.2";
export const SUPPORTED_SCHEMA_MAJOR = 3;
export const SUPPORTED_SCHEMA_MINOR = 1;

export const propertyTypes = [
  "APARTMENT",
  "ROOM",
  "HOUSE",
  "HOUSE_PART",
  "COTTAGE",
  "TOWNHOUSE",
  "GARAGE_BOX",
  "LAND",
  "COMMERCIAL",
  "NEW_BUILD_UNIT",
  "OTHER",
] as const;

export const transactionTypes = [
  "SALE",
  "RENT_LONG",
  "RENT_SHORT",
  "UNKNOWN",
] as const;

export const dealKinds = [
  "SECONDARY_SALE",
  "PRIMARY_SALE",
  "ASSIGNMENT",
  "UNKNOWN",
] as const;

export const locationPrecisions = ["DISTRICT", "STREET", "EXACT"] as const;
export const geoPrecisions = ["exact", "street", "district", "city"] as const;

export const PropertyTypeSchema = z.enum(propertyTypes);
export const TransactionTypeSchema = z.enum(transactionTypes);
export const DealKindSchema = z.enum(dealKinds);
export const LocationPrecisionSchema = z.enum(locationPrecisions);
export const GeoPrecisionSchema = z.enum(geoPrecisions);
export const EntityLifecycleSchema = z.enum([
  "active",
  "hidden",
  "departed",
  "redirected",
]);

export const publicUrlIdSchema = z
  .string()
  .regex(/^[a-z2-7]{5,8}$/, "publicUrlId must match ^[a-z2-7]{5,8}$");

export const MoneyValueSchema = z.object({
  amount: z
    .string()
    .regex(/^-?\d+$/, "MoneyValue.amount is integer minor units"),
  currency: z.string().length(3),
  scale: z.literal(2),
});

export type MoneyValue = z.infer<typeof MoneyValueSchema>;

export function serializeMoneyValue(value: MoneyValue): string {
  return JSON.stringify(MoneyValueSchema.parse(value));
}

export function parseMoneyValue(raw: string): MoneyValue {
  return MoneyValueSchema.parse(JSON.parse(raw));
}

const areaFacts = {
  totalAreaM2: z.number().nonnegative().optional(),
  livingAreaM2: z.number().nonnegative().optional(),
  kitchenAreaM2: z.number().nonnegative().optional(),
  lotAreaM2: z.number().nonnegative().optional(),
};

export const ApartmentFactsSchema = z.object({
  rooms: z.number().nonnegative().optional(),
  floor: z.number().int().optional(),
  floorsTotal: z.number().int().optional(),
  ...areaFacts,
});

export const RoomFactsSchema = ApartmentFactsSchema;

export const HouseFactsSchema = z.object({
  rooms: z.number().nonnegative().optional(),
  floorsTotal: z.number().int().optional(),
  ...areaFacts,
});

export const HousePartFactsSchema = HouseFactsSchema;
export const CottageFactsSchema = HouseFactsSchema;
export const TownhouseFactsSchema = HouseFactsSchema;

export const LandFactsSchema = z.object({
  lotAreaM2: z.number().nonnegative().optional(),
});

export const GarageBoxFactsSchema = z.object({
  lotAreaM2: z.number().nonnegative().optional(),
});

export const CommercialFactsSchema = z.object({
  rooms: z.number().nonnegative().optional(),
  floorsTotal: z.number().int().optional(),
  ...areaFacts,
});

export const NewBuildUnitFactsSchema = ApartmentFactsSchema;
export const OtherFactsSchema = CommercialFactsSchema;

export const InventoryFactsSchema = z.union([
  ApartmentFactsSchema,
  RoomFactsSchema,
  HouseFactsSchema,
  HousePartFactsSchema,
  LandFactsSchema,
  CottageFactsSchema,
  TownhouseFactsSchema,
  GarageBoxFactsSchema,
  CommercialFactsSchema,
  NewBuildUnitFactsSchema,
  OtherFactsSchema,
]);

export const MediaRefSchema = z.object({
  uid: z.string().min(1),
  url: z.string().min(1).optional(),
  sort: z.number().int().nonnegative().optional(),
});

export const GeoPublicSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const FORBIDDEN_PUBLIC_FIELDS = [
  "apartmentNumberPrivate",
  "sourceAddressRaw",
  "sourceId",
  "sourceObjectCode",
  "DATABASE_URL",
  "personalPhone",
  "personalEmail",
  "internalNotes",
  "consentDocument",
  "hiddenCoordinates",
] as const;

function rejectForbiddenPublicFields(
  value: Record<string, unknown>,
  ctx: z.RefinementCtx,
) {
  for (const field of FORBIDDEN_PUBLIC_FIELDS) {
    if (field in value) {
      ctx.addIssue({
        code: "custom",
        message: `public DTO must not contain ${field}`,
        path: [field],
      });
    }
  }
}

export const PublicInventoryDtoSchema = z
  .strictObject({
    uid: z.string().min(1),
    publicUrlId: publicUrlIdSchema,
    slug: z.string().min(1).optional(),
    slugHistory: z.array(z.string()).default([]),
    lifecycle: EntityLifecycleSchema.optional(),
    propertyType: PropertyTypeSchema,
    transactionType: TransactionTypeSchema,
    dealKind: DealKindSchema.optional(),
    price: MoneyValueSchema.optional(),
    priceCheckedAt: z
      .string()
      .refine((value) => {
        if (
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
            value,
          )
        ) {
          return false;
        }
        return !Number.isNaN(new Date(value).getTime());
      }, "priceCheckedAt must be ISO datetime")
      .optional(),
    currency: z.string().length(3).optional(),
    addressPublic: z.string().min(1),
    geoPublic: GeoPublicSchema.optional(),
    geoPrecision: GeoPrecisionSchema,
    facts: InventoryFactsSchema,
    agentUid: z.string().min(1).optional(),
    media: z.array(MediaRefSchema).default([]),
    descriptionHtmlSafe: z.string().optional(),
    descriptionText: z.string().optional(),
    status: z.string().min(1),
    developmentUid: z.string().min(1).optional(),
  })
  .superRefine(rejectForbiddenPublicFields);

export const AgentPageDtoSchema = z
  .strictObject({
    uid: z.string().min(1),
    slug: z.string().min(1).optional(),
    slugHistory: z.array(z.string()).default([]),
    lifecycle: EntityLifecycleSchema.optional(),
    displayName: z.string().min(1),
    listingPresenceStatus: z.enum([
      "HAS_ACTIVE_LISTINGS",
      "NO_ACTIVE_LISTINGS",
    ]),
  })
  .superRefine(rejectForbiddenPublicFields);

export const ProjectContactDtoSchema = z
  .strictObject({
    projectId: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional(),
    addressPublic: z.string().optional(),
    messengers: z.array(z.string()).optional(),
    hours: z.string().optional(),
    updatedAt: z.string().min(1),
  })
  .superRefine(rejectForbiddenPublicFields);

export const DevelopmentDtoSchema = z
  .strictObject({
    uid: z.string().min(1),
    publicUrlId: publicUrlIdSchema.optional(),
    slug: z.string().min(1).optional(),
    slugHistory: z.array(z.string()).default([]),
    lifecycle: EntityLifecycleSchema.optional(),
    name: z.string().min(1),
    developerUid: z.string().min(1).optional(),
    checkedAt: z.string().optional(),
  })
  .superRefine(rejectForbiddenPublicFields);

export const GeoDtoSchema = z
  .strictObject({
    uid: z.string().min(1),
    slug: z.string().min(1).optional(),
    slugHistory: z.array(z.string()).default([]),
    name: z.string().min(1),
  })
  .superRefine(rejectForbiddenPublicFields);

export const SnapshotFileSchema = z.object({
  kind: z.string().min(1),
  key: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  bytes: z.number().int().nonnegative(),
  count: z.number().int().nonnegative(),
});

export const SnapshotManifestSchema = z.object({
  schemaMajor: z.number().int().nonnegative(),
  schemaMinor: z.number().int().nonnegative(),
  schemaPatch: z.number().int().nonnegative().optional(),
  projectId: z.string().min(1),
  publishSequence: z.number().int().nonnegative(),
  generatedAt: z.string().min(1),
  publishedAt: z.string().min(1),
  catalogRevision: z.string().min(1),
  sourceRevisions: z.array(z.string()).default([]),
  files: z.array(SnapshotFileSchema),
  keyId: z.string().min(1),
});

export type PublicInventoryDto = z.infer<typeof PublicInventoryDtoSchema>;
export type AgentPageDto = z.infer<typeof AgentPageDtoSchema>;
export type ProjectContactDto = z.infer<typeof ProjectContactDtoSchema>;
export type DevelopmentDto = z.infer<typeof DevelopmentDtoSchema>;
export type SnapshotManifest = z.infer<typeof SnapshotManifestSchema>;

export const DeveloperDtoSchema = z
  .strictObject({
    uid: z.string().min(1),
    slug: z.string().min(1).optional(),
    name: z.string().min(1),
  })
  .superRefine(rejectForbiddenPublicFields);

export const MediaManifestItemSchema = z
  .object({
    uid: z.string().min(1).optional(),
    key: z.string().min(1).optional(),
    url: z.string().min(1).optional(),
  })
  .passthrough()
  .superRefine(rejectForbiddenPublicFields);

export const UrlRecordSchema = z
  .object({
    uid: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    publicUrlId: z.string().min(1).optional(),
  })
  .passthrough()
  .superRefine(rejectForbiddenPublicFields);

export const RedirectRecordSchema = z
  .object({
    from: z.string().min(1).optional(),
    to: z.string().min(1).optional(),
  })
  .passthrough()
  .superRefine(rejectForbiddenPublicFields);

export const LifecycleRecordSchema = z
  .object({
    uid: z.string().min(1).optional(),
    lifecycle: EntityLifecycleSchema.optional(),
  })
  .passthrough()
  .superRefine(rejectForbiddenPublicFields);

export function isSupportedSchema(major: number, minor: number): boolean {
  if (major !== SUPPORTED_SCHEMA_MAJOR) {
    return false;
  }
  return minor >= 0 && minor <= SUPPORTED_SCHEMA_MINOR;
}

export function parsePublicInventoryDto(input: unknown): PublicInventoryDto {
  return PublicInventoryDtoSchema.parse(input);
}

export function parseSnapshotManifest(input: unknown): SnapshotManifest {
  const manifest = SnapshotManifestSchema.parse(input);
  if (!isSupportedSchema(manifest.schemaMajor, manifest.schemaMinor)) {
    throw new Error(
      `unsupported Hub schema ${manifest.schemaMajor}.${manifest.schemaMinor}`,
    );
  }
  return manifest;
}
