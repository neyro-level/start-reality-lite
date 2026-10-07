# Мастер-план Neutral Template

```text
Plan ID: SRL-NEUTRAL-TEMPLATE
Canonical file: docs/МАСТЕР_ПЛАН_SRL_NEUTRAL.md
Predecessor: SOUZ-TEMPLATE-FINAL-CLEANUP v1 COMPLETE
Version: v1
Status: APPROVED
Phase: WORK
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

**Репозиторий:** `integrator-p/start-reality-lite`

## Цель

Привести текущее дерево к нейтральному стартовому шаблону агентства недвижимости: убрать живые данные «Союза» и Ростова из HEAD, сохранить синюю палитру `--sr-*` и платформу, закрывать каждый эпик через PR и один exact-head `merge-gate` в `main`.

Основа: текущий `main` (дубликат `soyuz-rostov-light-realty` на `reference-baseline-template-v3`).

Предшественники не расширять:

- `SOUZ-TEMPLATE-FREEZE` v2 COMPLETE
- `SOUZ-TEMPLATE-HARDENING` v1 COMPLETE
- `SOUZ-TEMPLATE-FINAL-CLEANUP` v1 COMPLETE

Теги не двигать: `reference-baseline-template-freeze`, `reference-baseline-template-v2`, `reference-baseline-template-v3`.

## 0. Решения владельца

| ID | Решение |
|---|---|
| N1 | Plan ID = `SRL-NEUTRAL-TEMPLATE`. Канон = этот файл. |
| N2 | История git не переписывается. Новый клиент копируется с чистого HEAD. |
| N3 | Демо-бренд: «Старт Недвижимость», ООО «Старт Недвижимость», ИНН `9900000000`, директор «Демонстрационный Директор», телефон `+7 (800) 000-00-00`, почта `hello@start-realty.example`, адрес «г. Примерск, ул. Центральная, 1», сайт `https://start-realty.example`, ежедневно 9:00–18:00. |
| N4 | Районы: Центр, Северный, Южный, Западный, Восточный, Нагорный, Речной, Парковый, Солнечный, Заречный. |
| N5 | `fixture-alt` («Кубань Дом») остаётся dual-build проверкой. |
| N6 | Фикстура `fixture-sz-rostov` → `fixture-demo`. Подпись — тестовый ключ фикстуры. |
| N7 | Цвета `src/project/theme.css` не менять. |
| N8 | Платформа, БД, Payload, Prisma, production, indexing, живые заявки, `.beads` — вне плана. |
| N9 | Git: SourceCraft, `PR_ONLY`. Эпик = ветка + PR + один `merge-gate` на exact SHA + merge. |

## 1. Delivery

```text
эпик → ветка epic/E<n>-... от origin/main
commit + push
PR в main (publish)
локально: проверки эпика на exact head
COMMERCIAL: один ручной merge-gate на exact SHA
merge force: false, delete_branch: true
следующая ветка только от обновлённого origin/main
```

## 2. Source of Truth

1. `docs/standards/AMS_SITE_CORE.md`
2. `docs/standards/AMS_REALTY_CORE.md`
3. `docs/standards/AMS_UI_CORE.md`
4. `docs/SOUZ_DESIGN_SYSTEM.md` (палитра шаблона)
5. `docs/adr/`
6. этот план
7. `docs/DELIVERY_STATE.yaml`
8. текущая задача

---

# E0 — Канон и имя репозитория

Ветка: `epic/E0-neutral-canon`

- Этот файл, `AGENTS.md`, `docs/README.md`, `docs/DELIVERY_STATE.yaml`
- `package.json` name и корневой `README.md` → `start-reality-lite`
- Контент «Союза» в этом эпике не вычищать

# E1 — Демо-личность

Ветка: `epic/E1-demo-identity`

- `site.souz.config.ts` → `site.primary.config.ts`
- `home.souz.config.ts` → `home.primary.config.ts`
- Демо-идентичность в site, home, SEO, contacts, grammar geo `primersk`
- Denylist старых литералов в `template-check` и `verify-layers`
- Комментарий бренда в `theme.css` нейтральный, значения цветов без изменений
- SEO шаблона (не production-index): реестр всех pageKey; длины title/description; бренд в title только на служебных страницах; JSON-LD RealEstateAgent и BreadcrumbList; robots/sitemap от `INDEXING_MODE` (default `private`); canonical/resolver; legacy 308/410; price freshness. `pnpm verify:seo-contracts` остаётся gate.
- Перед merge: `pnpm verify`

# E2 — Фикстура и география

Ветка: `epic/E2-fixture-demo`

- `fixtures/fixture-sz-rostov` → `fixtures/fixture-demo`
- `PROJECT_FIXTURE` по умолчанию `fixture-demo`
- Нейтральные районы, переподпись manifest тестовым ключом
- Перед merge: `pnpm verify`

# E3 — Документы без клиента

Ветка: `epic/E3-docs-redaction`

- ПДн и контакты «Союза» убрать из отслеживаемых файлов HEAD
- Дизайн-система шаблона с теми же цветами
- ADR: проектный слой — `fixture-demo`

# E4 — Контракт копирования

Ветка: `epic/E4-copy-contract`

- `NEW_PROJECT.md` и `TEMPLATE_EXCLUDE.md`: этот репозиторий — шаблон; копировать чистый HEAD
- Чеклист замены проектного слоя
- Закрыть план в `DELIVERY_STATE.yaml`
- Новый freeze-тег не ставить
