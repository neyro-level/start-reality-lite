import type { NavGroup } from "@/platform/nav";
import { HeaderInteractive } from "@/ui/layout/header-interactive";
import { Container } from "@/ui/shared/container";

export type { NavGroup, NavItem } from "@/platform/nav";

export type LeadFormConfig = {
  actionUrl: string;
  consentHref: string;
  thanksUrl: string;
  nameLabel: string;
  phoneLabel: string;
  consentLabel: string;
  consentLinkLabel: string;
  submitLabel: string;
  sendingLabel: string;
  requiredMessage: string;
  retryMessage: string;
  transportDisabledMessage: string;
  pageKey: string;
};

export function Header({
  brand,
  homeHref,
  phoneDisplay,
  phoneTel,
  groups,
  ctaLabel,
  searchHref,
  favoritesHref,
  searchLabel,
  favoritesLabel,
  leadForm,
  menuLabel,
}: {
  brand: string;
  homeHref: string;
  phoneDisplay?: string;
  phoneTel?: string;
  groups: NavGroup[];
  ctaLabel: string;
  searchHref?: string;
  favoritesHref?: string;
  searchLabel?: string;
  favoritesLabel?: string;
  leadForm: LeadFormConfig;
  menuLabel: string;
}) {
  return (
    <header className="border-b border-border bg-background">
      <Container>
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-md py-sm">
          <a
            className="inline-flex min-h-11 items-center font-semibold text-foreground focus-visible:outline-none focus-visible:shadow-focus"
            href={homeHref}
          >
            {brand}
          </a>
          <HeaderInteractive
            brand={brand}
            ctaLabel={ctaLabel}
            favoritesHref={favoritesHref}
            favoritesLabel={favoritesLabel}
            groups={groups}
            leadForm={leadForm}
            menuLabel={menuLabel}
            phoneDisplay={phoneDisplay}
            phoneTel={phoneTel}
            searchHref={searchHref}
            searchLabel={searchLabel}
          />
        </div>
      </Container>
    </header>
  );
}
