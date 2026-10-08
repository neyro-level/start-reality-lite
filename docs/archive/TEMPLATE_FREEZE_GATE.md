# Template Freeze Gate

Статус:

- `SOUZ-TEMPLATE-FREEZE` v2 **COMPLETE** — тег `reference-baseline-template-freeze` @ `ccba58d929dc342ce0baa2f40796d7057fb4de1c` (не изменять)
- `SOUZ-TEMPLATE-HARDENING` v1 **COMPLETE** — тег `reference-baseline-template-v2` @ `63360437e4b59399ede2b64c0b893a8d66eef95a` (не изменять)
- `SOUZ-TEMPLATE-FINAL-CLEANUP` v1 **COMPLETE** — после merge TF1 тег `reference-baseline-template-v3`
- Production не делался.

## Audit TF1.06

`pnpm audit --prod` на exact head: high `braces` через transitive `shadcn` → `fast-glob` → `micromatch`. Patched versions: none. Отдельный эпик не открывался. `critical` обновлений нет.

Ниже — исторический чеклист Freeze (K1) и DoD Hardening (TH9). Теги уже проставлены; раздел K1 не описывает будущую работу.

## K1 — Freeze checklist (исторический)

Точка готовности шаблона **без production**. Тег `REFERENCE BASELINE — TEMPLATE FREEZE` ставится только после merge PR K1 в `main` на exact SHA (команда владельца). Это уже выполнено: см. статус выше.

## Merge-wave

**Быстрый путь:** [PR #44](https://sourcecraft.dev/integrator-p/soyuz-rostov-light-realty/pr/44) `epic/K1-freeze` → `main` (стек H5–K1 одним merge-gate).

Пошагово PR **#33–#43**: `docs/MERGE_WAVE_TEMPLATE_FREEZE.md`.

## Автоматизация

`pnpm verify:freeze` — статические проверки Gate 6 и привязка к существующим verifiers. Полное доказательство Freeze:

```text
pnpm lint
pnpm build
pnpm verify
pnpm test:e2e
pnpm template:check
pnpm verify:exit-mode
```

## Gate 1 — Architecture

| Критерий | Доказательство |
|----------|----------------|
| Core docs | `docs/ФИНАЛЬНЫЙ_МАСТЕР_ПЛАН.md`, `docs/standards/*`, `AGENTS.md` |
| Repository boundary | `pnpm verify:repository`, `verify:contracts` |
| Runtime ≠ прямое чтение fixture | `verify:layers`, `app-no-snapshot-files` |
| Snapshot provider-neutral | `pnpm verify:snapshot` |
| last-good / ACK / lifecycle | `verify:snapshot`, `verify:lifecycle` |

## Gate 2 — Leads

| Критерий | Доказательство |
|----------|----------------|
| Encrypted spool, retry, direct | `pnpm verify:leads` |
| Accepted lead не теряется | cases in `scripts/verify-leads.ts` |

## Gate 3 — SEO

| Критерий | Доказательство |
|----------|----------------|
| URL grammar, canonical, Content Gate | `pnpm verify:seo-contracts`, `verify:grammar` |
| Sitemap, robots, 404/410/redirect | `verify:seo-contracts`, `verify:routes`, e2e `freeze-smoke` |

## Gate 4 — UI

| Критерий | Доказательство |
|----------|----------------|
| shadcn + Lucide | `pnpm verify:ui-core` |
| SOUZ tokens, layout shell | `docs/SOUZ_DESIGN_SYSTEM.md`, `src/project/theme.css` |
| Header / mobile / footer / home | e2e `header.spec.ts`, `home.spec.ts`, H2–H5 specs |
| Starter + responsive + a11y | utility pages e2e, manual spot-check |

## Gate 5 — Quality

| Критерий | Доказательство |
|----------|----------------|
| lint, build, verify | CI / local `pnpm verify` |
| e2e | `pnpm test:e2e` |
| Dual fixture | `pnpm template:check` |
| Exit mode | `pnpm verify:exit-mode` |

## Gate 6 — Cleanliness

| Критерий | Доказательство |
|----------|----------------|
| No DB / CMS | `pnpm verify:freeze` |
| No unused UI kit | `verify:ui-core` |
| No secrets in repo | `verify:env`, `verify:security` |
| No fake facts in generic layers | `verify:layers` project-literal guards |

## TH9 — DoD mapping (SITE §32 / REALTY §67 / UI §50)

Тег `reference-baseline-template-v2` — baseline шаблона **без production**. Playwright не gate.

### SITE CORE §32

| Пункт | Доказательство |
|-------|----------------|
| production build | merge-gate `verify-and-build`, `next build` в `template:check` / HTTP smoke |
| обязательные проверки | `pnpm verify` + `tsc --noEmit` |
| URL централизованы | `verify:routes`, `verify:grammar` |
| SEO Registry / canonical / robots / sitemap | `verify:seo-contracts` |
| Content Gate | `verify:seo-contracts` d4 / listing-gate |
| 404/410/redirect | `verify:lifecycle`, HTTP smoke 404/410/308 |
| заявка не теряется / spool без ПД в лог | `verify:leads` |
| legal / нет секретов | `verify:env`, `verify:security` |
| UI конституция | `verify:ui-core`, `docs/SOUZ_DESIGN_SYSTEM.md` |
| нет выдуманных фактов | `verify:layers`, honest DTO tests |
| развёртывание без скрытых зависимостей | `verify:exit-mode`, `docs/EXIT_BUNDLE.md` |

### REALTY CORE §67

| Пункт | Доказательство |
|-------|----------------|
| без live Hub на рендере | `DATA_MODE=local\|snapshot`, `verify:snapshot` |
| SnapshotRepository единственная точка чтения | `verify:repository` |
| подпись / last-good / ACK | `verify:snapshot` |
| slug → 308, privacy, price freshness | `verify:lifecycle`, `verify:snapshot`, catalog tests |
| sitemap = активный snapshot | `verify:seo-contracts` |
| media заменяем | `verify:media` |
| durable spool затем доставка | `verify:leads` |
| Exit Mode без AMS credentials | HTTP smoke `DATA_MODE=local` |
| UI без raw snapshot | `verify:ui-core`, depcruise `ui -/-> project` |

### UI CORE §50

| Пункт | Доказательство |
|-------|----------------|
| одна DS, tokens, primitives | `verify:ui-core`, `src/project/theme.css` |
| Container/Section, server + islands | TH6 Header/layout, `verify:ui-core` |
| DTO props, одна форма | `LeadForm`, `verify:leads` |
| a11y / responsive | TH6 visual 375–1440, LeadForm ids/alerts |
| нет fake facts / dark patterns | honest DTO, `INDEXING_MODE=private` |
| production build | merge-gate |

### TH9.01 security evidence

- Next.js **16.3.8** — September 2026 Active LTS security line (`nextjs.org/blog/upcoming-nextjs-security-release-september-2026`).
- `pnpm audit --prod`: nodemailer поднят до **10.x** (GHSA spool/parser/TLS). Transitive `braces` через `shadcn` без патча — зафиксировано, не блокирует template freeze.
