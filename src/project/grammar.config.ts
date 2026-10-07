import { assertNoCollisions, type GrammarConfig } from "@/platform/grammar";
import { grammar as altGrammar } from "../../fixtures/fixture-alt/project/grammar.config";
import { isAltFixture } from "./data.config";

const primaryGrammar = {
  geoMode: "SINGLE_GEO",
  geo: "primersk",
  categories: ["novostroyki", "kvartiry"],
  facets: {
    kvartiry: ["vtorichka"],
  },
  districts: ["leninskiy", "voroshilovskiy", "severnyy", "tsentr"],
  developersSegment: "zastroyshchiki",
  developmentSegment: "novostroyki",
  propertySegment: "kvartiry",
  objectNamespace: "kvartiry",
  teamSegment: "komanda",
  routes: [
    { pageKey: "home", template: "/" },
    { pageKey: "geoHub", template: "/{geo}/" },
    { pageKey: "catNovostroyki", template: "/{geo}/novostroyki/" },
    { pageKey: "catKvartiry", template: "/{geo}/kvartiry/" },
    {
      pageKey: "facetVtorichka",
      template: "/{geo}/kvartiry/vtorichka/",
      feature: "vtorichka",
    },
    { pageKey: "distLeninskiy", template: "/{geo}/novostroyki/leninskiy/" },
    {
      pageKey: "distVoroshilovskiy",
      template: "/{geo}/novostroyki/voroshilovskiy/",
    },
    { pageKey: "distSevernyy", template: "/{geo}/novostroyki/severnyy/" },
    { pageKey: "distTsentr", template: "/{geo}/novostroyki/tsentr/" },
    { pageKey: "developers", template: "/{developersSegment}/" },
    { pageKey: "developer", template: "/{developersSegment}/{slug}/" },
    { pageKey: "development", template: "/{developmentSegment}/zhk-{slug}/" },
    {
      pageKey: "property",
      template: "/{objectNamespace}/{slug}-{publicUrlId}/",
    },
    { pageKey: "team", template: "/{teamSegment}/", feature: "team" },
    { pageKey: "agent", template: "/{teamSegment}/{slug}/", feature: "team" },
    { pageKey: "ipoteka", template: "/ipoteka/" },
    {
      pageKey: "yurist",
      template: "/yurist-po-nedvizhimosti/",
      feature: "yurist",
    },
    { pageKey: "about", template: "/o-kompanii/" },
    { pageKey: "contacts", template: "/kontakty/" },
    { pageKey: "vacancies", template: "/vakansii/", feature: "vacancies" },
    { pageKey: "privacy", template: "/politika-konfidencialnosti/" },
    {
      pageKey: "consent",
      template: "/soglasie-na-obrabotku-personalnyh-dannyh/",
    },
    { pageKey: "thanks", template: "/spasibo/" },
    { pageKey: "favorites", template: "/izbrannoe/", feature: "favorites" },
    { pageKey: "search", template: "/poisk/", feature: "search" },
  ],
} as const satisfies GrammarConfig;

export const grammar = isAltFixture() ? altGrammar : primaryGrammar;

assertNoCollisions(grammar);
