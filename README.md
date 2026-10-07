# Start Reality Lite

Коммерческий AMS Realty Lite шаблон на Next.js 16 без БД: snapshot / local, Repository, дизайн-система с палитрой `--sr-*`.

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

Меняется только `src/project/**`, `docs/seo/**` и fixture. Порядок замен — `docs/NEW_PROJECT.md`. Что не копировать — `docs/TEMPLATE_EXCLUDE.md`.

Проверка двух брендов: `PROJECT_FIXTURE=fixture-alt` и `pnpm template:check`.
