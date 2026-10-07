import { site as altSite } from "../../fixtures/fixture-alt/project/site.config";
import { isAltFixture } from "./data.config";
import { site as primarySite } from "./site.primary.config";

export const site = isAltFixture() ? altSite : primarySite;
