import type { Metadata } from "next";
import { headers } from "next/headers";
import { OptInAnalytics } from "@/platform/analytics";
import { buildHref, isFeatureEnabled } from "@/platform/grammar";
import { resolveNavGroup } from "@/platform/nav";
import { buildRealEstateAgentJsonLd } from "@/platform/seo";
import { JsonLdScript } from "@/platform/seo/json-ld-script";
import { analytics } from "@/project/analytics.config";
import { features } from "@/project/features.config";
import { grammar } from "@/project/grammar.config";
import { navigation } from "@/project/navigation.config";
import { loadRegistry } from "@/project/runtime";
import { site } from "@/project/site.config";
import { copyrightLine, legalLine, uiText } from "@/project/ui-text.config";
import { Footer, Header } from "@/ui";
import { manrope } from "@/ui/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const agentJsonLd = buildRealEstateAgentJsonLd({
    name: site.brand,
    url: site.siteUrl,
    telephone: site.phoneTel,
    email: site.email,
    address: site.address,
    openingHours: site.hoursSchema,
  });
  const registry = loadRegistry();
  const headerGroups = navigation.header
    .map((group) =>
      resolveNavGroup(group, grammar, features, registry, navigation.labels),
    )
    .filter((group) => group.items.length > 0);
  const footerColumns = navigation.footer
    .map((group) =>
      resolveNavGroup(group, grammar, features, registry, navigation.labels),
    )
    .filter((group) => group.items.length > 0);
  const homeHref = buildHref(grammar, features, "home") ?? "/";
  const consentHref = buildHref(grammar, features, "consent") ?? homeHref;
  const thanksUrl = buildHref(grammar, features, "thanks") ?? homeHref;
  const searchHref = isFeatureEnabled(features, "search")
    ? buildHref(grammar, features, "search")
    : undefined;
  const favoritesHref = isFeatureEnabled(features, "favorites")
    ? buildHref(grammar, features, "favorites")
    : undefined;
  return (
    <html lang="ru" className={`${manrope.variable} h-full antialiased`}>
      <body className={`${manrope.className} min-h-full flex flex-col`}>
        <JsonLdScript data={agentJsonLd} nonce={nonce} />
        <Header
          brand={site.brand}
          ctaLabel={navigation.ctaLabel}
          favoritesHref={favoritesHref ?? undefined}
          groups={headerGroups}
          homeHref={homeHref}
          leadForm={{
            actionUrl: "/api/public/leads/",
            consentHref,
            consentLabel: uiText.form.consentLabel,
            consentLinkLabel: uiText.form.consentLinkLabel,
            nameLabel: uiText.form.nameLabel,
            pageKey: "header-cta",
            phoneLabel: uiText.form.phoneLabel,
            requiredMessage: uiText.form.requiredMessage,
            retryMessage: uiText.form.retryMessage,
            sendingLabel: uiText.form.sendingLabel,
            submitLabel: uiText.form.submitLabel,
            thanksUrl,
            transportDisabledMessage: uiText.form.transportDisabledMessage,
          }}
          phoneDisplay={site.phoneDisplay}
          phoneTel={site.phoneTel}
          favoritesLabel={navigation.labels.favorites}
          searchHref={searchHref ?? undefined}
          searchLabel={navigation.labels.search}
          menuLabel={uiText.chrome.menuLabel}
        />
        {children}
        <Footer
          address={site.address}
          brand={site.brand}
          columns={footerColumns}
          copyright={copyrightLine(new Date().getFullYear())}
          email={site.email}
          homeHref={homeHref}
          hoursDisplay={site.hoursDisplay}
          phoneDisplay={site.phoneDisplay}
          phoneTel={site.phoneTel}
          requisites={legalLine()}
        />
        <OptInAnalytics
          acceptLabel={uiText.analytics.acceptLabel}
          counterId={analytics.counterId}
          declineLabel={uiText.analytics.declineLabel}
          prompt={uiText.analytics.prompt}
        />
      </body>
    </html>
  );
}
