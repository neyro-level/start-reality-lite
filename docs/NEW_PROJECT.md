# Новый проект на Start Reality Lite

Этот репозиторий и есть шаблон. Копировать **чистый HEAD** (`git archive` или новый remote без истории), не весь git-лог: в истории останутся старые клиентские коммиты.

Меняется только **проектный слой** и данные клиента. Не трогать платформу без отдельной причины и ADR.

`docs/SOUZ_DESIGN_SYSTEM.md` — дизайн-система шаблона с палитрой `--sr-*`. Новый клиент заполняет `docs/template/PROJECT_DESIGN_SYSTEM.md`. Цвета в `theme.css` оставлять, если бренд это допускает.

## Короткий чеклист замены

```text
site / home / ui-text
theme.css (только если другой бренд)
SEO Registry + seo.config
fixture / snapshot
leads destination
analytics
grammar geo и районы
```

## Что меняет новый клиент

| Область | Файлы |
|--------|--------|
| Site | `src/project/site.primary.config.ts`, `src/project/site.config.ts` |
| Home copy | `src/project/home.primary.config.ts`, `src/project/home.config.ts` |
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

## SEO шаблона (базовый контур)

В шаблоне уже есть рабочий SEO-контур. Новый клиент **заполняет факты**, а не собирает SEO с нуля.

Обязательно заменить под клиента:

- все строки `docs/seo/SEO_REGISTRY_SEED.csv` (title, h1, description, город, бренд);
- `site.primary.config.ts` (бренд, URL, телефон, адрес — JSON-LD RealEstateAgent берёт их отсюда);
- `grammar.config.ts` geo/districts и `redirects/legacy.ts`;
- `seo.config.ts` — `brandInTitlePageKeys` и `catalogPageKeys` не ломать без причины.

Не ломать без отдельной задачи:

- `src/app/robots.ts`, `src/app/sitemap.ts`;
- canonical / metadata resolver в runtime;
- JSON-LD `RealEstateAgent` + `BreadcrumbList`;
- `INDEXING_MODE` default `private` (public — только перед реальным релизом);
- `pnpm verify:seo-contracts` (длины title/description, уникальность, noindex starter-страниц, sitemap без дублей).

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

1. Скопировать чистый HEAD этого репозитория.
2. Заполнить конфиги, `PROJECT_DESIGN_SYSTEM`, SEO-реестр и fixture; подписать manifest (`scripts/resign-fixture-alt.ts` как образец).
3. Настроить provider settings и lead destination.
4. `pnpm verify:layers` — нет project literals / brand colors в platform и UI.
5. `pnpm verify:seo-contracts` — реестр, canonical, robots/sitemap, JSON-LD.
6. `pnpm template:check` — primary + alt без правок platform; `.next` alt без primary-бренда.
7. `pnpm verify:exit-mode` и `pnpm verify:performance`.
8. Перед Freeze: `pnpm verify:freeze` и полный `pnpm verify`.

Подробные gate-чеклисты: `docs/TEMPLATE_FREEZE_GATE.md`.
