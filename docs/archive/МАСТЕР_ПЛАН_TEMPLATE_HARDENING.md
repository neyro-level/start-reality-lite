# Мастер-план Template Hardening

```text
Plan ID: SOUZ-TEMPLATE-HARDENING
Canonical file: docs/МАСТЕР_ПЛАН_TEMPLATE_HARDENING.md
Predecessor: SOUZ-TEMPLATE-FREEZE v2 COMPLETE (tag reference-baseline-template-freeze @ ccba58d)
Version: v1
Status: APPROVED
Phase: IMPLEMENTATION
approved_by: owner
approved_at: 2026-10-07
PROJECT_CLASS: COMMERCIAL
DELIVERY_PROFILE: COMMERCIAL
AMS_PROFILE: REALTY
DATA_MODE: snapshot | local
delivery_mode: PR_ONLY
Production: out of scope until explicit owner command
Beads / Lite graph: do not touch
```

**Проект:** Союз Застройщиков  
**Цель:** закрыть контрактные нарушения SITE / REALTY / UI CORE, найденные post-freeze аудитом, упростить лишнее и получить чистую точку для копирования Realty Template.

## 0. Решения владельца

| ID | Решение |
|---|---|
| H1 | Plan ID = `SOUZ-TEMPLATE-HARDENING`. Канон = этот файл. Freeze v2 не расширять. |
| H2 | `LEADS_ROUTE=direct` только. `LEAD_TRANSPORT=none\|smtp\|webhook`. `service/dual/crm` убрать до реальной потребности. |
| H3 | `search` и `favorites` = `DISABLED` до полноценной реализации. |
| H4 | Удалить мост `src/platform/ui/**`. Импорты — `@/ui`. |
| H5 | Playwright e2e не входит в gate этого плана. Поведение — Vitest + HTTP smoke. |
| H6 | Production, `INDEXING_MODE=public`, живой Hub, живой SMTP — вне плана. |
| H7 | Git: SourceCraft, `PR_ONLY`, ветка `epic/TH<N>-<slug>` от `origin/main`, один PR на эпик, commit+push на каждую задачу. Merge — exact-head `merge-gate`. |
| H8 | Создание отдельного template-репозитория — отдельная команда после TH9. |

## 1. Delivery

```text
задача → commit TH<N>.<NN> + push
эпик → PR в main
локально: pnpm verify + tsc --noEmit на exact head
COMMERCIAL: один ручной merge-gate на exact SHA
merge → DELIVERY_STATE → следующий эпик от нового main
```

Эпики строго последовательны.

```text
TH0 → TH1 → TH2 → TH3 → TH4 → TH5 → TH6 → TH7 → TH8 → TH9
```

## 2. Source of Truth

1. `docs/standards/AMS_SITE_CORE.md`
2. `docs/standards/AMS_REALTY_CORE.md`
3. `docs/standards/AMS_UI_CORE.md`
4. `docs/SOUZ_DESIGN_SYSTEM.md`
5. `docs/adr/`
6. этот план
7. `docs/DELIVERY_STATE.yaml`
8. текущая задача

## 3. Эпики и задачи

### TH0 — Bootstrap и гигиена репозитория

- **TH0.01** Этот канон, `AGENTS.md`, `docs/README.md`, `docs/DELIVERY_STATE.yaml` (`plan_id: SOUZ-TEMPLATE-HARDENING`, `current_epic: TH0`).
- **TH0.02** `.gitattributes`: `* text=auto eol=lf` (+ binary для ico/woff2/png/woff), `git add --renormalize .`. Acceptance: `pnpm lint` зелёный на Windows с `core.autocrlf=true`.
- **TH0.03** Vitest (SITE CORE §6): `vitest` devDependency, `vitest.config.ts`, `test:unit` в `pnpm verify`, один smoke-тест.

### TH1 — Web читает настоящий snapshot (CURRENT)

- **TH1.01** env: `SNAPSHOT_STORE_DIR` обязателен при `DATA_MODE=snapshot`; `LOCAL_SNAPSHOT_DIR` обязателен при `DATA_MODE=local`. `PROJECT_FIXTURE` только для dev/test. Fail-fast в `src/platform/env.ts`.
- **TH1.02** `src/project/runtime.ts`: `snapshot` → `resolveCurrentRevisionDir`; `local` → verified local dir; dev → fixture. Кэш repository по `publishSequence`.
- **TH1.03** Snapshot ещё не получен: каталог EmptyState, catalog pages `noindex`, остальной сайт работает.
- **TH1.04** Repository — единственная точка чтения. Убрать `loadSnapshot()/catalogSnapshot()` из app/lifecycle/SEO. Индексы Map: uid, publicUrlId, slug, developmentUid, geo.
- **TH1.05** `sitemap.ts` / `robots.ts`: `export const dynamic = "force-dynamic"`.
- **TH1.06** Vitest: switch CURRENT меняет выдачу; пустой store → degraded/noindex.

### TH2 — Sync, provider, health

- **TH2.01** Worker: подпись до ACK при already-current; lock exclusive create (`wx`).
- **TH2.02** Хранить current + previous; удалять остальное и tmp.
- **TH2.03** Приём по REALTY §11: Zod contacts/media/urls/redirects/lifecycle/developers; пустой контакт = отказ; расширенный Privacy Gate; reserved roots vs slug; кросс-типовая уникальность publicUrlId; relations; minor `<= SUPPORTED` или additive-allowlist; identity-collision без значений в логе.
- **TH2.04** HTTP provider: allowlist origin, HTTPS, запрет private IP, без redirect на чужой host, timeout, size limit, имя файла не из ответа.
- **TH2.05** `scripts/sync-worker.ts` (polling + signal), compose `sync` из того же image, общий volume. ACK + lead retry (TH4) здесь.
- **TH2.06** `/api/internal/sync`: HMAC `SYNC_SIGNAL_SECRET`, timestamp skew ≤ 5 мин, POST, rate limit, signal marker; `DATA_MODE=local` → 404.
- **TH2.07** healthz: `ok|degraded`, sequence, snapshotAge, lastSuccessfulSync, pendingAck, leadSpoolPending; без ПД.
- **TH2.08** Vitest: crash before/after switch, partial download, lost ACK, ACK без подписи, SSRF, auth sync.

### TH3 — Честные DTO и свежесть цены

- **TH3.01** `roomsOf` → `null`; не выдумывать developer slug; phone fallback — публичный контакт проекта.
- **TH3.02** `hidePrice` по порогам `seo.config.ts` (45/120) от даты проверки цены; `minPrice` ЖК только из свежих цен. Если `priceCheckedAt` нет в hub contract — ADR + временно `development.checkedAt`.
- **TH3.03** `geoPrecision`/публичное geo в DTO; UI скрывает отсутствующие факты.
- **TH3.04** Vitest: null-факты; stale price скрыта.

### TH4 — Заявки (только direct)

- **TH4.01** `LEADS_ROUTE=direct`, `LEAD_TRANSPORT=none|smtp|webhook`. Удалить service/dual/crm.
- **TH4.02** Fail-fast: при leads ON и `APP_ENV!=local` обязательны `LEAD_SPOOL_KEY` (32 байта base64) и `LEAD_SPOOL_DIR`. Убрать randomBytes/tmpdir. Один spool на процесс. Volume в compose.
- **TH4.03** SMTP содержит имя, телефон, страницу, публичные id. Webhook в route. `none` → `lead_transport_disabled`. ПД не в логах.
- **TH4.04** Retry в sync-worker: backoff, идемпотентность `leadId` (Idempotency-Key webhook, Message-ID SMTP).
- **TH4.05** Vitest: стабильный ключ переживает рестарт; SMTP fail → spool → retry → remove.

### TH5 — SEO, URL, lifecycle, безопасность

- **TH5.01** `INDEXING_MODE=private|staging` → HTML `noindex,nofollow`; default env = `private`.
- **TH5.02** `NEW_BUILD_UNIT` → 200 noindex,follow. Listing gate: порог объектов из project config.
- **TH5.03** ЖК slugHistory → 308; lifecycle redirect не на home; 410 в RSC; lowercase 308; цепочки lifecycle+legacy.
- **TH5.04** SEO Registry: колонка OG; BreadcrumbList JSON-LD.
- **TH5.05** `search`/`favorites` DISABLED; убрать сырой поиск из `site-page.tsx`.
- **TH5.06** HSTS при production; CSP nonce через proxy; Docker HEALTHCHECK; `LEADS_ROUTE` в Dockerfile; `global-error.tsx`.
- **TH5.07** `OQ-LEGAL-TEXT` в OPEN_QUESTIONS (блокер только production).
- **TH5.08** Vitest/скрипты: private noindex, NEW_BUILD_UNIT, slugHistory ЖК, 410 RSC, security headers.

### TH6 — UI по SOUZ Design System

- **TH6.01** Typography roles, shadow-card, focus 4px, `--secondary` mapping, отсутствующие CSS vars, `@theme` utilities.
- **TH6.02** Замена `[var(--sr-...)]` на utilities.
- **TH6.03** Button 48px / Input 52px, primary-hover, Badge, без `dark:`; удалить неиспользуемые primitives/stubs.
- **TH6.04** Container site|narrow|wide; Section sm|md|lg|hero; SectionHeader eyebrow/action; H1 шкалы H1.
- **TH6.05** LeadForm a11y; error.tsx через ErrorState + Button.
- **TH6.06** Header server + client islands; карточки без `"use client"`.
- **TH6.07** Home ViewModel пропсами; RU-строки из UI → `ui-text.config.ts`; depcruise `ui -/-> project`.
- **TH6.08** Удалить `src/platform/ui/**`.
- **TH6.09** Визуальная проверка 375/768/1024/1440 (dev + скриншоты), без e2e.

### TH7 — Честные проверки и fixtures

- **TH7.01** `fixtures/fixture-broken/*` и генератор representative (5000 / 100 ЖК), TEST.
- **TH7.02** Поведенческие verify-repository, verify-security, verify-performance, verify-ui-core (включая `src/app`).
- **TH7.03** `verify:lifecycle`, `verify:repository`, `test:unit` в `pnpm verify`.
- **TH7.04** Exit-mode: `next build` + `next start` с `DATA_MODE=local`, HTTP smoke (home, listing, property, ЖК, agent, 404, 410, 308, healthz, POST lead).

### TH8 — Готовность к шаблону

- **TH8.01** `NEW_PROJECT.md` — полный список замен.
- **TH8.02** `template:check`: overlay home.config / ui-text / theme; скан `.next` alt на литералы primary-бренда.
- **TH8.03** Убрать проектные литералы вне project.
- **TH8.04** README; `docs/TEMPLATE_EXCLUDE.md`.

### TH9 — Финальный gate

- **TH9.01** На exact `main`: frozen install, `pnpm verify`, tsc, `pnpm audit --prod`, security-support Next 16.3.x.
- **TH9.02** DoD SITE §32 / REALTY §67 / UI §50 в `docs/TEMPLATE_FREEZE_GATE.md`.
- **TH9.03** Tag `reference-baseline-template-v2`, `DELIVERY_STATE` COMPLETE, `AGENTS.md` без активного плана.

## 4. Definition of Done плана

- Web читает CURRENT / local verified snapshot, не fixture в production-режимах.
- Sync auth + HTTP provider + health.
- Заявка: стабильный ключ, persistent dir, ПД в письме, retry.
- Price freshness в DTO.
- SEO/security пункты TH5.
- UI tokens/primitives/a11y/слои.
- Честные verifiers + exit smoke.
- Template docs и dual-build без утечки бренда.
- Freeze tag на exact SHA.

## 5. Вне scope

- Production deploy
- INDEXING_MODE=public
- Живой AMS Hub / production SMTP
- Journal content
- Search / Favorites реализация
- service/dual/crm leads
- Отдельный template repository (Phase L)
- Playwright как merge-gate
