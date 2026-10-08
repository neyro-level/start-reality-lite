# Start Reality Lite

Коммерческий AMS Realty Lite шаблон на Next.js 16 без БД: snapshot / local, Repository, дизайн-система `docs/TEMPLATE_DESIGN_SYSTEM.md`.

## Стек

- Next.js 16.3.x, React 19, pnpm, Node 24
- `DATA_MODE=snapshot|local`, `LEADS_ROUTE=direct`
- SourceCraft primary, `PR_ONLY`, один merge-gate перед main

## Локально

```text
corepack pnpm install
corepack pnpm dev
corepack pnpm verify
```

`pnpm verify` включает lifecycle/repository, template:check и HTTP smoke exit-mode (`next start`). Playwright не входит в gate.

## Новый проект

После копирования чистого HEAD AI читает корневой `AGENTS.md`, три `docs/standards/AMS_*_CORE.md` и `docs/NEW_SITE_SETUP.md`. Чеклист файлов — `docs/NEW_PROJECT.md`. Что не копировать как канон — `docs/TEMPLATE_EXCLUDE.md`.

Демо-реквизиты и `fixture-demo` — тестовые данные.

Проверка двух брендов: `PROJECT_FIXTURE=fixture-alt` и `pnpm template:check`.
