# Новый проект на Start Reality Lite

Этот репозиторий и есть шаблон. Копировать **чистый HEAD** (`git archive` или новый remote без истории), не весь git-лог.

Порядок работы AI после копирования задаёт [`docs/NEW_SITE_SETUP.md`](NEW_SITE_SETUP.md). Этот файл — короткий чеклист файлов, не второй сценарий планов или анкет.

Демо-бренд «Старт Недвижимость», `fixture-demo`, телефон, адрес, ИНН и `.example` — тестовые данные. Не выпускать их как факты клиента.

`docs/TEMPLATE_DESIGN_SYSTEM.md` — базовая дизайн-система шаблона (палитра `--sr-*`, primary `#014eba`). Клиентская заготовка — `docs/template/PROJECT_DESIGN_SYSTEM.md`; при отличиях бренда создать `docs/PROJECT_DESIGN_SYSTEM.md`. Цвета в `theme.css` оставлять, если бренд это допускает.

## Короткий чеклист замены

```text
site / home / ui-text
theme.css (только если другой бренд)
SEO Registry + seo.config
fixture / snapshot
leads destination
analytics
grammar geo и районы
навигация и секции
```

## Что можно менять

| Область | Файлы |
|--------|--------|
| Site | `src/project/site.primary.config.ts`, `src/project/site.config.ts` |
| Home copy | `src/project/home.primary.config.ts`, `src/project/home.config.ts` |
| Home model | `src/project/build-home-model.ts`, `src/project/home-href.ts` |
| UI copy | `src/project/ui-text.config.ts` |
| Theme | `src/project/theme.css` |
| Design system | `docs/template/PROJECT_DESIGN_SYSTEM.md` → при необходимости `docs/PROJECT_DESIGN_SYSTEM.md` |
| Grammar / URL | `src/project/grammar.config.ts` |
| Features | `src/project/features.config.ts` |
| Navigation | `src/project/navigation.config.ts` |
| SEO | `src/project/seo.config.ts`, `src/project/seo-vars.ts`, `docs/seo/SEO_REGISTRY_SEED.csv` |
| Pages | `src/project/utility-pages.config.ts`, `src/project/starter-pages.config.ts`, `src/project/entity-pages.config.ts`, `src/project/catalog-entry.config.ts`, `src/project/entity-detail-model.ts` |
| Page composition | `src/app/site-page.tsx` |
| Sections | `src/ui/sections/**` |
| Domain UI | `src/ui/domain/**` при реальной необходимости |
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
- `pnpm verify:seo-contracts`.

`LEAD_TRANSPORT=none` только для local/dev. В staging/production при включённых формах нужен `smtp` или `webhook`.

Search, Favorites и Journal остаются `DISABLED` до отдельной реализации.

Для dual-build используйте `PROJECT_FIXTURE=fixture-alt`. `template:check` собирает primary и alt и сканирует `.next` на литералы primary-бренда.

## Что защищено

```text
src/platform/**
src/ui/primitives/**
Repository / snapshot / identity / lifecycle
encrypted lead spool
security mechanisms
docs/standards/AMS_*_CORE.md
```

Изменения защищённых контрактов — только по отдельному решению владельца, не ради удобства кастомизации.

Нет PostgreSQL, Payload, Prisma, CMS. Runtime UI импортируется только через `@/ui`.

См. также `docs/TEMPLATE_EXCLUDE.md` и `docs/NEW_SITE_SETUP.md`.
