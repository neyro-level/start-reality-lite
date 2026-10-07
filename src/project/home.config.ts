import { homeContent as altHomeContent } from "../../fixtures/fixture-alt/project/home.config";
import { isAltFixture } from "./data.config";
import { homeContent as primaryHomeContent } from "./home.primary.config";

export const homeContent = isAltFixture() ? altHomeContent : primaryHomeContent;
