# Merge-wave: SOUZ-TEMPLATE-FREEZE v2 (#33–#43)

**PR_ONLY.** Production не входит. Merge только по команде владельца.

## Быстрый путь (один PR)

**[#44](https://sourcecraft.dev/integrator-p/soyuz-rostov-light-realty/pr/44)** — `epic/K1-freeze` → `main` (весь стек H5–K1 одним merge-gate).

## Порядок (строго по цепочке)

| # | Эпик | Ветка | Base (на момент открытия PR) |
|---|------|--------|------------------------------|
| 33 | H5 | `epic/H5-utility` | `main` |
| 34 | I1 | `epic/I1-architecture` | `main` |
| 35 | I2 | `epic/I2-ui-core` | `epic/H5-utility` |
| 36 | I3 | `epic/I3-snapshot` | `epic/I2-ui-core` |
| 37 | I4 | `epic/I4-leads` | `epic/I3-snapshot` |
| 38 | I5 | `epic/I5-seo` | `epic/I4-leads` |
| 39 | I6 | `epic/I6-e2e` | `epic/I5-seo` |
| 40 | J1 | `epic/J1-fixtures` | `epic/I6-e2e` |
| 41 | J2 | `epic/J2-leakage` | `epic/J1-fixtures` |
| 42 | J3 | `epic/J3-new-project` | `epic/J2-leakage` |
| 43 | K1 | `epic/K1-freeze` | `epic/J3-new-project` |

После каждого merge в `main` (или в базовую ветку следующего PR): **rebase** следующей ветки на актуальный `main`, обновить PR.

Финальный код Freeze после merge **#43** должен оказаться в `main` (при необходимости — отдельный PR `epic/K1-freeze` → `main` с squash всего стека).

## Gate на head `epic/K1-freeze` (локально, без production)

```text
pnpm verify:freeze
pnpm verify:layers && pnpm verify:contracts && pnpm verify:snapshot
pnpm verify:seo-contracts && pnpm verify:ui-core && pnpm verify:routes
pnpm verify:leads && pnpm verify:exit-mode && pnpm verify:env
pnpm template:check
pnpm test:e2e
```

`pnpm lint` — известный долг (как на `main`); merge-gate ранее допускал `force` по решению владельца.

## После merge K1 в `main`

1. Зафиксировать exact SHA merge commit.
2. Annotated tag: `REFERENCE BASELINE — TEMPLATE FREEZE`.
3. Обновить `docs/DELIVERY_STATE.yaml`: `status: COMPLETE`, `last_merged` epic K1, pr **44** (one-shot) или **43** (пошагово).

См. также `docs/TEMPLATE_FREEZE_GATE.md`.
