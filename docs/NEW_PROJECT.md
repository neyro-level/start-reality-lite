# Новый проект на AMS Realty Template

Меняется только **проектный слой** и данные клиента. Не трогать платформу без отдельной причины и ADR.

`docs/SOUZ_DESIGN_SYSTEM.md` — дизайн-система текущего проекта Союза. Новому клиенту она не передаётся. Заполняется `docs/template/PROJECT_DESIGN_SYSTEM.md`.

## Что меняет новый клиент

```text
site.config
home.config
ui-text.config
theme.css
PROJECT_DESIGN_SYSTEM
grammar.config
features.config
navigation.config
SEO Registry
project media
fixture / snapshot
provider settings
lead destination
```

| Область | Файлы |
|--------|--------|
| Site | `src/project/site.config.ts` |
| Home copy | `src/project/home.config.ts` |
| Home model | `src/project/build-home-model.ts`, `src/project/home-href.ts` |
| UI copy | `src/project/ui-text.config.ts` |
| Theme | `src/project/theme.css` |
| Design system | `docs/template/PROJECT_DESIGN_SYSTEM.md` |
| Grammar | `src/project/grammar.config.ts` |
| Features | `src/project/features.config.ts` |
| Navigation | `src/project/navigation.config.ts` |
| SEO | `src/project/seo.config.ts`, `src/project/seo-vars.ts`, `docs/seo/SEO_REGISTRY_SEED.csv` |
| Pages | `src/project/utility-pages.config.ts`, `src/project/starter-pages.config.ts`, `src/project/entity-pages.config.ts`, `src/project/catalog-entry.config.ts`, `src/project/entity-detail-model.ts` |
| Legacy | `src/project/redirects/legacy.ts` |
| Data | `src/project/data.config.ts`, `src/project/runtime.ts` |
| Media | `src/project/media.config.ts`, `src/project/image-loader.ts` |
| Leads | `src/project/lead.config.ts` — destination; `LEADS_ROUTE=direct`, `LEAD_TRANSPORT=none\|smtp\|webhook` |
| Analytics | `src/project/analytics.config.ts` |
| Performance | `src/project/performance.config.ts` |
| Env | `.env.example` — `DATA_MODE`, `LEAD_TRANSPORT`, SMTP, spool (без `DATABASE_URL`) |
| Fixture / snapshot | `fixtures/<your-project>/` — signed snapshot, `trust.json`, keys |
| Provider | `PROVIDER_ORIGIN`, trust, `DATA_MODE=snapshot` |

`LEAD_TRANSPORT=none` только для local/dev. В staging/production при включённых формах нужен `smtp` или `webhook`.

Search, Favorites и Journal остаются `DISABLED` до отдельной реализации.

Для dual-build используйте `PROJECT_FIXTURE=fixture-alt`. `template:check` собирает primary и alt и сканирует `.next` на литералы primary-бренда.

## Что не менять без отдельной причины

```text
src/platform/**
src/ui/primitives/**
Repository contracts
snapshot machinery
lead spool
URL machinery
verification scripts
```

- Нет PostgreSQL, Payload, Prisma, CMS
- Runtime UI импортируется только через `@/ui`. Слоя `src/platform/ui/` нет.

См. также `docs/TEMPLATE_EXCLUDE.md`.

## Порядок запуска

1. Заполнить конфиги, `PROJECT_DESIGN_SYSTEM` и fixture; подписать manifest (`scripts/resign-fixture-alt.ts` как образец).
2. Настроить provider settings и lead destination.
3. `pnpm verify:layers` — нет project literals / brand colors в platform и UI.
4. `pnpm template:check` — primary + alt без правок platform; `.next` alt без primary-бренда.
5. `pnpm verify:exit-mode` и `pnpm verify:performance`.
6. Перед Freeze: `pnpm verify:freeze` и полный `pnpm verify`.

Подробные gate-чеклисты: `docs/TEMPLATE_FREEZE_GATE.md`.
