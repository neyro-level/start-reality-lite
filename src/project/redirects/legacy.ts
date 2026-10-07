import type { LegacyRule } from "@/platform/seo";
import { legacyRules as altLegacyRules } from "../../../fixtures/fixture-alt/project/legacy.rules";
import { isAltFixture } from "../data.config";

const primaryLegacyRules: LegacyRule[] = [
  {
    from: "/novostroyki-city/",
    status: 308,
    toPageKey: "catNovostroyki",
  },
  {
    from: "/kvartiry-city/",
    status: 308,
    toPageKey: "catKvartiry",
  },
  { from: "/blog/", status: 410, match: "prefix" },
  { from: "/stroitelstvo-domov/", status: 410, match: "exact" },
  { from: "/otzyvy/", status: 410, match: "exact" },
];

export const legacyRules = isAltFixture() ? altLegacyRules : primaryLegacyRules;
