# Мастер-план Template Final Cleanup

```text
Plan ID: SOUZ-TEMPLATE-FINAL-CLEANUP
Canonical file: docs/МАСТЕР_ПЛАН_TEMPLATE_FINAL_CLEANUP.md
Predecessor: SOUZ-TEMPLATE-HARDENING v1 COMPLETE (tag reference-baseline-template-v2 @ 63360437)
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

## Цель

Быстро закрыть последние архитектурные замечания текущего `soyuz-rostov-light-realty`, после чего зафиксировать baseline и использовать его как основу нового коммерческого Realty Template.

Основа:

- текущий `main`;
- `SOUZ-TEMPLATE-HARDENING v1` завершён;
- предыдущие freeze-теги не изменять.

Новый Plan ID:

```text
SOUZ-TEMPLATE-FINAL-CLEANUP
```

Один эпик:

```text
TF1 — Final Template Cleanup
```

Ветка:

```text
epic/TF1-final-template-cleanup
```

## 0. Решения владельца

| ID | Решение |
|---|---|
| F1 | Plan ID = `SOUZ-TEMPLATE-FINAL-CLEANUP`. Канон = этот файл. Freeze v2 и Hardening v1 не расширять. |
| F2 | Теги `reference-baseline-template-freeze` и `reference-baseline-template-v2` не изменять. |
| F3 | Performance-полировка, расширенные broken-fixtures, Playwright и большой accessibility-рефакторинг вне плана. |
| F4 | Production, `INDEXING_MODE=public`, живой Hub, живой SMTP — вне плана. |
| F5 | Git: SourceCraft, `PR_ONLY`, ветка `epic/TF1-final-template-cleanup` от `origin/main`, commit+push на каждую задачу. Merge — exact-head `merge-gate`. После merge — тег `reference-baseline-template-v3`. |

## 1. Delivery

```text
задача → commit TF1.<NN> + push
эпик → PR в main
локально: pnpm verify + tsc --noEmit на exact head
COMMERCIAL: один ручной merge-gate на exact SHA
merge → тег reference-baseline-template-v3
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

---

# TF1.01 — Bootstrap

Создать новый план:

```text
docs/МАСТЕР_ПЛАН_TEMPLATE_FINAL_CLEANUP.md
```

Обновить:

```text
AGENTS.md
docs/README.md
docs/DELIVERY_STATE.yaml
```

Состояние:

```yaml
plan_id: SOUZ-TEMPLATE-FINAL-CLEANUP
plan_version: v1
status: IN_PROGRESS
current_epic: TF1
```

Старые планы и freeze-теги оставить неизменными.

Commit:

```text
TF1.01: bootstrap final template cleanup
```

---

# TF1.02 — Исправить freshness цены

## Проблема

Сейчас свежесть цены объекта может определяться через `development.checkedAt`.

Это неверно: дата проверки ЖК не означает дату проверки цены конкретного объекта.

## Сделать

### 1. Snapshot contract

В публичный объект добавить:

```ts
priceCheckedAt?: string
```

Дата должна быть валидной ISO datetime.

### 2. Правило цены

Использовать только:

```text
price
+
priceCheckedAt
```

Логика:

```text
цены нет
→ ничего не показывать

цена есть, priceCheckedAt нет
→ цену скрыть

priceCheckedAt <= 45 дней
→ цену можно показывать

priceCheckedAt > 45 дней
→ цену скрыть

priceCheckedAt > 120 дней
→ price gate FAIL там, где он нужен
```

### 3. Удалить fallback

Не использовать для freshness цены:

```text
development.checkedAt
manifest.publishedAt
snapshot.generatedAt
```

`development.checkedAt` оставить только для данных самого ЖК.

### 4. Repository

В `SnapshotRepository`:

- рассчитывать `hidePrice`;
- не отдавать stale price как публичную;
- `minPrice` ЖК считать только из свежих цен.

### 5. Fixtures

Добавить `priceCheckedAt` в основные TEST fixtures.

После изменения:

- обновить manifest;
- обновить hashes/bytes;
- переподписать snapshot.

### Минимальная проверка

Проверить три случая:

```text
fresh price → видна
stale price → скрыта
нет priceCheckedAt → скрыта
```

Commit:

```text
TF1.02: use explicit priceCheckedAt
```

---

# TF1.03 — Отвязать retry заявок от snapshot mode

## Проблема

Retry заявок сейчас живёт внутри sync-worker.

В Exit Mode:

```text
DATA_MODE=local
```

snapshot sync не нужен, но pending заявки всё равно должны повторно доставляться.

## Сделать

Создать общий worker:

```text
scripts/worker.ts
```

Логика:

```text
worker
│
├── lead retry — всегда
│
└── snapshot jobs — только DATA_MODE=snapshot
```

### В любом режиме

Периодически:

```text
flushLeadSpool()
```

если:

```text
LEAD_TRANSPORT=smtp
```

или:

```text
LEAD_TRANSPORT=webhook
```

### Только при DATA_MODE=snapshot

Выполнять:

```text
provider polling
sync signal
snapshot download
snapshot apply
pending ACK retry
```

### При DATA_MODE=local

Не требовать:

```text
SNAPSHOT_STORE_DIR
PROVIDER_ORIGIN
SYNC_SIGNAL_SECRET
SNAPSHOT_TRUST_FILE
```

Но lead worker продолжает работать.

### Важно

Ошибка Provider не должна останавливать lead retry.

Ошибка SMTP/webhook не должна останавливать snapshot sync.

### Compose

Сервис:

```text
sync
```

переименовать логически в:

```text
worker
```

Используется тот же application image.

### Проверить

Два сценария:

```text
DATA_MODE=local
pending lead
→ worker доставляет его
```

и:

```text
DATA_MODE=snapshot
→ работают и leads, и snapshot sync
```

Commit:

```text
TF1.03: make worker independent from snapshot mode
```

---

# TF1.04 — Финальная template hygiene

## 1. Leads

Оставить только:

```text
LEADS_ROUTE=direct
```

и:

```text
LEAD_TRANSPORT=none|smtp|webhook
```

Проверить, что в runtime-коде больше нет:

```text
service
dual
crm
```

### `none`

Разрешён для local/dev.

В staging/production при включённых формах должен использоваться реальный:

```text
smtp
```

или:

```text
webhook
```

---

## 2. Search / Favorites

Оставить:

```text
search = DISABLED
favorites = DISABLED
```

До реальной реализации.

Проверить:

- нет в Header;
- нет в Footer;
- нет в sitemap;
- нет публичных ссылок.

---

## 3. Journal

Оставить:

```text
journal = DISABLED
```

Журнал будет отдельным этапом.

---

## 4. UI

Проверить отсутствие старого слоя:

```text
src/platform/ui/
```

Все runtime imports должны идти через:

```text
@/ui
```

Не создавать второй UI layer.

---

## 5. Проектная дизайн-система шаблона

Текущий:

```text
SOUZ_DESIGN_SYSTEM.md
```

остаётся дизайн-системой текущего проекта Союза.

Для будущего шаблона создать:

```text
docs/template/PROJECT_DESIGN_SYSTEM.md
```

Это нейтральная заготовка для нового клиента.

Структура:

```text
Brand
Colors
Typography
Radius
Spacing
Containers
Surfaces
Buttons
Forms
Cards
Header / Footer
Catalog UI
Responsive
Accessibility
```

При создании нового клиента:

```text
SOUZ_DESIGN_SYSTEM
→ не становится его дизайн-системой

PROJECT_DESIGN_SYSTEM
→ заполняется под нового клиента
```

---

## 6. NEW_PROJECT.md

Обновить инструкцию нового проекта.

Явно указать, что новый клиент меняет:

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

Не менять без отдельной причины:

```text
src/platform/**
src/ui/primitives/**
Repository contracts
snapshot machinery
lead spool
URL machinery
verification scripts
```

Commit:

```text
TF1.04: finalize template project boundaries
```

---

# TF1.05 — Небольшая правка формы

Не делать большой accessibility-рефакторинг.

Исправить только очевидное.

## Сделать

LeadForm должен иметь:

```text
loading state
disabled submit while sending
понятную ошибку
данные формы не очищаются при ошибке
```

Для обязательных полей:

```text
name
phone
consent
```

добавить:

```text
aria-invalid
```

при ошибке.

Проектные тексты ошибок хранить в:

```text
src/project/ui-text.config.ts
```

Не добавлять новые UI/testing библиотеки.

Commit:

```text
TF1.05: tighten lead form states
```

---

# TF1.06 — Финальная проверка

Не запускать отдельный огромный тестовый этап.

На exact head выполнить только обязательное:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test:unit
pnpm exec tsc --noEmit
pnpm verify
pnpm build
```

Также проверить:

```bash
pnpm audit --prod
```

Если есть известная transitive dependency без доступного исправления — зафиксировать её в документации, но не устраивать отдельный эпик.

Исправлять только:

```text
critical
high
```

если существует рабочее обновление без разрушения проекта.

---

# TF1.07 — Freeze

Обновить:

```text
docs/TEMPLATE_FREEZE_GATE.md
docs/DELIVERY_STATE.yaml
```

Зафиксировать:

```yaml
plan_id: SOUZ-TEMPLATE-FINAL-CLEANUP
plan_version: v1
status: COMPLETE
current_epic: none
pending_epics: []
```

Commit:

```text
TF1.07: close final template cleanup
```

---

# TF1.08 — PR и новый baseline

Создать PR:

```text
epic/TF1-final-template-cleanup
→ main
```

Перед merge:

```bash
pnpm verify
pnpm exec tsc --noEmit
```

Запустить SourceCraft merge-gate на exact SHA.

После merge создать новый immutable tag:

```text
reference-baseline-template-v3
```

Старые tags:

```text
reference-baseline-template-freeze
reference-baseline-template-v2
```

не изменять.

---

# Definition of Done

Работа закончена, если:

- [ ] web читает snapshot через Repository;
- [ ] цена использует настоящий `priceCheckedAt`;
- [ ] stale/missing price скрывается;
- [ ] minPrice ЖК не использует stale цены;
- [ ] lead retry работает и при `DATA_MODE=local`;
- [ ] snapshot sync работает только при `DATA_MODE=snapshot`;
- [ ] Leads остаются `direct + smtp/webhook`;
- [ ] Search отключён;
- [ ] Favorites отключены;
- [ ] Journal отключён;
- [ ] старого `src/platform/ui` нет;
- [ ] SOUZ UI остаётся project-specific;
- [ ] подготовлен `PROJECT_DESIGN_SYSTEM` для будущего шаблона;
- [ ] `pnpm lint` PASS;
- [ ] `pnpm test:unit` PASS;
- [ ] `tsc --noEmit` PASS;
- [ ] `pnpm verify` PASS;
- [ ] `pnpm build` PASS;
- [ ] создан `reference-baseline-template-v3`.

После этого больше не дорабатывать текущий baseline ради шаблона.

Следующий шаг:

```text
reference-baseline-template-v3
→ новый repository
→ AMS Realty Template
→ первый коммерческий проект
```
