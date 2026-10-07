# Start Reality Lite

Локальный router. Глобальный канон — `~/.codex/AGENTS.md`.

## Plan

- Активный: `SRL-NEUTRAL-TEMPLATE` v1 — `docs/МАСТЕР_ПЛАН_SRL_NEUTRAL.md`
- Predecessor: `SOUZ-TEMPLATE-FINAL-CLEANUP` v1 COMPLETE — `docs/МАСТЕР_ПЛАН_TEMPLATE_FINAL_CLEANUP.md` (не расширять)
- Hardening: `SOUZ-TEMPLATE-HARDENING` v1 **COMPLETE** — `docs/МАСТЕР_ПЛАН_TEMPLATE_HARDENING.md` (не расширять)
- Freeze: `SOUZ-TEMPLATE-FREEZE` v2 COMPLETE — `docs/ФИНАЛЬНЫЙ_МАСТЕР_ПЛАН.md` (не расширять)
- Freeze tags: `reference-baseline-template-freeze`, `reference-baseline-template-v2`, `reference-baseline-template-v3` (не изменять)
- Standards: `docs/standards/`
- Design system: `docs/SOUZ_DESIGN_SYSTEM.md` (палитра шаблона)
- Predecessor archive: `docs/archive/` (не Source of Truth; Beads Lite не трогать)

Порядок чтения:

```text
AMS SITE CORE
→ AMS REALTY CORE
→ AMS UI CORE
→ SOUZ DESIGN SYSTEM
→ Project / ADR
→ Delivery State
→ Task
```

Приоритет при конфликте: явное решение владельца → ADR проекта → фактический код/lockfile → SITE CORE → REALTY CORE → UI CORE → дизайн-система → чат.

## Invariants

- `AMS_PROFILE=REALTY`, `PROJECT_CLASS=COMMERCIAL`, `DELIVERY_PROFILE=COMMERCIAL`
- `DATA_MODE=snapshot | local`; БД нет: запрещены PostgreSQL, Payload, Prisma, CMS и `DATABASE_URL`
- Git: SourceCraft primary, `PR_ONLY`, лёгкая проверка на PR, один ручной `merge-gate` перед merge
- Production этим планом не делается
- Платформа: `src/platform/**`. Проектный слой: `src/project/**` и `docs/seo/**`
- Единственная проектная дизайн-система: `docs/SOUZ_DESIGN_SYSTEM.md`

## Delivery state

Текущее состояние — `docs/DELIVERY_STATE.yaml`.
