import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import type { MoneyDTO } from "@/platform/catalog";
import { buildHref } from "@/platform/grammar";
import { buildBreadcrumbListJsonLd } from "@/platform/seo";
import { JsonLdScript } from "@/platform/seo/json-ld-script";
import { buildHomeModel } from "@/project/build-home-model";
import {
  isDevelopmentCatalogEntry,
  isH3CatalogEntryPageKey,
} from "@/project/catalog-entry.config";
import { loadEntityDetailModel } from "@/project/entity-detail-model";
import { isH4EntityPageKey } from "@/project/entity-pages.config";
import { features } from "@/project/features.config";
import { grammar } from "@/project/grammar.config";
import { homeContent } from "@/project/home.config";
import { navigation } from "@/project/navigation.config";
import {
  getRealtyRepository,
  loadRegistry,
  resolveAppMetadata,
} from "@/project/runtime";
import { site } from "@/project/site.config";
import {
  type H2StaticPageKey,
  h2StarterBodies,
  isH2StaticPageKey,
} from "@/project/starter-pages.config";
import { uiText } from "@/project/ui-text.config";
import {
  type H5UtilityPageKey,
  h5UtilityBodies,
  isH5UtilityPageKey,
} from "@/project/utility-pages.config";
import {
  CatalogGrid,
  DevelopmentCard,
  LeadForm,
  PropertyCard,
  StarterPageShell,
} from "@/ui";
import type { LeadFormConfig } from "@/ui/layout/header";
import { EntityDetailSlot } from "@/ui/sections/entity-detail-slot";
import { HomePage } from "@/ui/sections/home-page";
import { EmptyState } from "@/ui/shared/empty-state";
import { LeadDialog } from "@/ui/shared/lead-dialog";

function formatPrice(price: MoneyDTO | null): string | undefined {
  if (!price) {
    return undefined;
  }
  const major = Number(price.amount) / 10 ** price.scale;
  if (!Number.isFinite(major)) {
    return undefined;
  }
  return String(Math.round(major));
}

function propertyHrefParams(listing: { slug: string; publicUrlId: string }) {
  return { slug: listing.slug, publicUrlId: listing.publicUrlId };
}

export async function SitePage({
  pageKey,
  params = {},
}: {
  pageKey: string;
  params?: Record<string, string>;
}) {
  const repo = getRealtyRepository();
  const contextResolved = resolveAppMetadata(pageKey, params);
  if (pageKey === "property") {
    const listing = await repo.getProperty(params.publicUrlId ?? "");
    if (!listing) {
      notFound();
    }
    if (params.slug !== listing.slug) {
      const href = buildHref(
        grammar,
        features,
        "property",
        propertyHrefParams(listing),
      );
      if (href) {
        permanentRedirect(href);
      }
      notFound();
    }
  }
  if (
    pageKey === "development" &&
    !(await repo.getDevelopment(params.slug ?? ""))
  ) {
    notFound();
  }
  if (
    pageKey === "developer" &&
    !(await repo.getDeveloper(params.slug ?? ""))
  ) {
    notFound();
  }
  if (pageKey === "agent" && !(await repo.getAgent(params.slug ?? ""))) {
    notFound();
  }
  const hasRoute = (key: string) =>
    grammar.routes.some((route) => route.pageKey === key);
  const consentHref = hasRoute("consent")
    ? (buildHref(grammar, features, "consent") ?? "/")
    : "/";
  const thanksUrl = hasRoute("thanks")
    ? (buildHref(grammar, features, "thanks") ?? "/")
    : "/";
  const leadForm = {
    actionUrl: "/api/public/leads/",
    consentHref,
    consentLabel: uiText.form.consentLabel,
    consentLinkLabel: uiText.form.consentLinkLabel,
    nameLabel: uiText.form.nameLabel,
    pageKey,
    phoneLabel: uiText.form.phoneLabel,
    requiredMessage: uiText.form.requiredMessage,
    retryMessage: uiText.form.retryMessage,
    sendingLabel: uiText.form.sendingLabel,
    submitLabel: uiText.form.submitLabel,
    thanksUrl,
    transportDisabledMessage: uiText.form.transportDisabledMessage,
  };
  if (pageKey === "home") {
    const model = await buildHomeModel(grammar, features, loadRegistry());
    return (
      <HomePage
        copy={{
          brand: site.brand,
          catalogAllLabel: uiText.home.catalogAllLabel,
          dealSupportCaption: uiText.home.dealSupportCaption,
          directorName: site.director,
          hero: homeContent.hero,
          leadExpert: homeContent.leadExpert,
          popularSearchesTitle: homeContent.popularSearches.title,
          service: homeContent.service,
          trust: homeContent.trust,
        }}
        leadForm={leadForm}
        leadFormPageKey="home"
        model={model}
      />
    );
  }
  const homeHref = buildHref(grammar, features, "home") ?? "/";
  const breadcrumbs = [
    { label: site.brand, href: homeHref },
    { label: contextResolved.h1 },
  ];
  let entityDetailModel = null;
  if (isH4EntityPageKey(pageKey)) {
    entityDetailModel = await loadEntityDetailModel(pageKey, params);
    if (!entityDetailModel) {
      notFound();
    }
  }
  const starterContent = isH2StaticPageKey(pageKey) ? (
    <StaticStarterSlot leadForm={leadForm} pageKey={pageKey} />
  ) : isH4EntityPageKey(pageKey) && entityDetailModel ? (
    <EntityDetailSlot
      ctaLabel={navigation.ctaLabel}
      hidePrice={contextResolved.hidePrice}
      leadForm={leadForm}
      minPriceLabel={uiText.entity.minPriceLabel}
      model={entityDetailModel}
    />
  ) : isH5UtilityPageKey(pageKey) ? (
    <UtilityStarterSlot
      pageKey={pageKey}
      registryLead={contextResolved.description}
    />
  ) : (
    <CatalogSlot
      gate={contextResolved.gate}
      hidePrice={contextResolved.hidePrice}
      pageKey={pageKey}
    />
  );
  const hasStarterContent =
    isH2StaticPageKey(pageKey) ||
    isH4EntityPageKey(pageKey) ||
    isH5UtilityPageKey(pageKey) ||
    isH3CatalogEntryPageKey(pageKey) ||
    pageKey === "developers" ||
    pageKey === "team";

  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd(
    breadcrumbs.map((crumb) => ({
      name: crumb.label,
      item:
        "href" in crumb && crumb.href
          ? new URL(crumb.href, site.siteUrl).toString()
          : contextResolved.canonical,
    })),
  );
  return (
    <StarterPageShell
      breadcrumbs={breadcrumbs}
      lead={contextResolved.description}
      title={contextResolved.h1}
    >
      <JsonLdScript data={breadcrumbJsonLd} nonce={nonce} />
      {hasStarterContent ? starterContent : null}
    </StarterPageShell>
  );
}

function UtilityStarterSlot({
  pageKey,
  registryLead,
}: {
  pageKey: H5UtilityPageKey;
  registryLead: string;
}) {
  return (
    <div
      className="flex max-w-2xl flex-col gap-lg"
      data-testid="utility-content"
    >
      <p className="text-body leading-relaxed text-muted-foreground">
        {h5UtilityBodies[pageKey]}
      </p>
      {pageKey === "privacy" || pageKey === "consent" ? (
        <p className="text-sm text-muted-foreground">{registryLead}</p>
      ) : null}
    </div>
  );
}

function StaticStarterSlot({
  pageKey,
  leadForm,
}: {
  pageKey: H2StaticPageKey;
  leadForm: LeadFormConfig;
}) {
  if (pageKey === "contacts") {
    return <LeadForm {...leadForm} />;
  }
  const body = h2StarterBodies[pageKey];
  return (
    <div className="flex max-w-2xl flex-col gap-lg">
      <p className="text-body leading-relaxed text-muted-foreground">{body}</p>
      <LeadDialog
        ctaLabel={navigation.ctaLabel}
        leadForm={leadForm}
        className="w-fit"
      />
    </div>
  );
}

async function CatalogSlot({
  pageKey,
  hidePrice,
  gate,
}: {
  pageKey: string;
  hidePrice: boolean;
  gate: "PASS" | "FAIL";
}) {
  if (isH3CatalogEntryPageKey(pageKey) && gate === "FAIL") {
    return (
      <EmptyState
        message={uiText.catalog.gateFailMessage}
        title={uiText.catalog.gateFailTitle}
      />
    );
  }
  const repo = getRealtyRepository();
  if (!repo.hasCatalog()) {
    return (
      <EmptyState
        message={uiText.catalog.emptyListingsMessage}
        title={uiText.catalog.emptyListingsTitle}
      />
    );
  }
  if (pageKey === "developers") {
    const developers = await repo.listDevelopers();
    return (
      <CatalogGrid>
        {developers.map((item) => {
          if (!item.slug) {
            return null;
          }
          const href = buildHref(grammar, features, "developer", {
            slug: item.slug,
          });
          return href ? (
            <DevelopmentCard
              href={href}
              key={item.uid}
              meta={item.slug}
              title={item.name}
            />
          ) : null;
        })}
      </CatalogGrid>
    );
  }
  if (pageKey === "team") {
    const agents = await repo.listAgents();
    return (
      <CatalogGrid>
        {agents.map((item) => {
          const href = buildHref(grammar, features, "agent", {
            slug: item.slug,
          });
          return href ? (
            <DevelopmentCard
              href={href}
              key={item.uid}
              meta={item.slug}
              title={item.name}
            />
          ) : null;
        })}
      </CatalogGrid>
    );
  }
  if (isDevelopmentCatalogEntry(pageKey)) {
    const developments = await repo.listDevelopments();
    if (developments.length === 0) {
      return (
        <div data-testid="catalog-grid">
          <EmptyState
            message={uiText.catalog.emptyDevelopmentsMessage}
            title={uiText.catalog.emptyDevelopmentsTitle}
          />
        </div>
      );
    }
    return (
      <div data-testid="catalog-grid">
        <CatalogGrid>
          {developments.map((item) => {
            const href = buildHref(grammar, features, "development", {
              slug: item.slug,
            });
            return href ? (
              <DevelopmentCard
                href={href}
                key={item.uid}
                meta={item.slug}
                title={item.name}
              />
            ) : null;
          })}
        </CatalogGrid>
      </div>
    );
  }
  if (
    !isH3CatalogEntryPageKey(pageKey) ||
    (pageKey !== "catKvartiry" && pageKey !== "facetVtorichka")
  ) {
    return null;
  }
  const listings = await repo.listProperties(
    pageKey === "facetVtorichka" ? { dealKind: "SECONDARY_SALE" } : undefined,
  );
  if (listings.length === 0) {
    return (
      <div data-testid="catalog-grid">
        <EmptyState
          message={uiText.catalog.emptyListingsMessage}
          title={uiText.catalog.emptyListingsTitle}
        />
      </div>
    );
  }
  return (
    <div data-testid="catalog-grid">
      <CatalogGrid>
        {listings.map((item) => {
          const href = buildHref(
            grammar,
            features,
            "property",
            propertyHrefParams(item),
          );
          const price =
            hidePrice || item.hidePrice ? undefined : formatPrice(item.price);
          const metaParts = [
            item.title,
            item.rooms === null ? undefined : String(item.rooms),
            price,
          ].filter(Boolean);
          return href ? (
            <PropertyCard
              href={href}
              key={item.uid}
              meta={metaParts.join(" · ")}
              title={item.title}
            />
          ) : null;
        })}
      </CatalogGrid>
    </div>
  );
}
