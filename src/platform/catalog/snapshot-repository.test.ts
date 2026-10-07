import { describe, expect, it } from "vitest";
import type { PublicInventoryDto } from "../hub/contract";
import { roomsOf } from "./entities";
import { SnapshotRepository } from "./snapshot-repository";

const thresholds = {
  hideAfterDays: 45,
  failAfterDays: 120,
  developmentTextFailAfterDays: 180,
};

function listing(facts: PublicInventoryDto["facts"]): PublicInventoryDto {
  return {
    uid: "uid-1",
    publicUrlId: "aaaaa2",
    propertyType: "LAND",
    transactionType: "SALE",
    addressPublic: "Public street",
    geoPrecision: "street",
    facts,
    slugHistory: [],
    media: [],
    status: "ACTIVE",
  };
}

describe("honest catalog DTO", () => {
  it("returns null rooms instead of inventing 1", () => {
    expect(roomsOf(listing({ lotAreaM2: 640 }))).toBeNull();
    expect(roomsOf(listing({ rooms: 2, totalAreaM2: 45 }))).toBe(2);
  });

  it("hides stale prices and keeps fresh minPrice", async () => {
    const cwd = process.cwd();
    const fresh = SnapshotRepository.fromRevisionDir(
      cwd,
      "fixtures/fixture-sz-rostov",
      true,
      { thresholds, now: new Date("2026-09-20T00:00:00Z") },
    );
    const cards = await fresh.listProperties();
    expect(cards.some((item) => item.hidePrice)).toBe(false);
    expect(cards[0]?.geoPrecision).toBeTruthy();

    const stale = SnapshotRepository.fromRevisionDir(
      cwd,
      "fixtures/fixture-sz-rostov",
      true,
      { thresholds, now: new Date("2027-01-01T00:00:00Z") },
    );
    const staleCards = await stale.listProperties();
    expect(staleCards.length).toBeGreaterThan(0);
    expect(staleCards.every((item) => item.hidePrice)).toBe(true);
    const development = (await stale.listDevelopments())[0];
    expect(development?.minPrice).toBeNull();
  });

  it("uses listing priceCheckedAt for public price", async () => {
    const now = new Date("2026-10-07T00:00:00Z");
    const contact = {
      phone: "+78000000000",
      email: null,
      messengers: null,
      address: null,
      hours: null,
    };
    const base = {
      ...listing({ rooms: 1, totalAreaM2: 32 }),
      uid: "inv-price",
      publicUrlId: "ccccc2",
      propertyType: "APARTMENT" as const,
      developmentUid: "dvl-1",
      price: { amount: "450000000", currency: "RUB", scale: 2 as const },
    };
    const snapshot = {
      developments: [
        {
          uid: "dvl-1",
          publicUrlId: "ddddd2",
          slug: "zhk-1",
          name: "TEST development",
          checkedAt: "2020-01-01T00:00:00Z",
        },
      ],
      developers: [],
    };
    const repo = (inventory: PublicInventoryDto[]) =>
      new SnapshotRepository(
        { ...snapshot, inventory },
        [],
        [],
        contact,
        true,
        { thresholds, now },
      );

    const fresh = await repo([
      { ...base, priceCheckedAt: "2026-09-20T00:00:00Z" },
    ]).listProperties();
    expect(fresh[0]?.hidePrice).toBe(false);
    expect(fresh[0]?.price?.amount).toBe("450000000");

    const stale = await repo([
      { ...base, priceCheckedAt: "2026-07-01T00:00:00Z" },
    ]).listProperties();
    expect(stale[0]?.hidePrice).toBe(true);
    expect(stale[0]?.price).toBeNull();

    const missing = await repo([base]).listProperties();
    expect(missing[0]?.hidePrice).toBe(true);
    expect(missing[0]?.price).toBeNull();

    const mixed = await repo([
      {
        ...base,
        uid: "fresh",
        publicUrlId: "eeeee2",
        priceCheckedAt: "2026-09-20T00:00:00Z",
      },
      {
        ...base,
        uid: "stale",
        publicUrlId: "fffff2",
        price: { amount: "100000000", currency: "RUB", scale: 2 as const },
        priceCheckedAt: "2026-07-01T00:00:00Z",
      },
    ]).listDevelopments();
    expect(mixed[0]?.minPrice?.amount).toBe("450000000");
  });

  it("does not invent a developer slug", async () => {
    const developers = await SnapshotRepository.fromRevisionDir(
      process.cwd(),
      "fixtures/fixture-sz-rostov",
      true,
      { thresholds, now: new Date("2026-09-20T00:00:00Z") },
    ).listDevelopers();
    expect(
      developers.every((item) => item.slug === null || item.slug.length > 0),
    ).toBe(true);
    expect(developers.some((item) => item.slug?.startsWith("developer-"))).toBe(
      false,
    );
  });
});
