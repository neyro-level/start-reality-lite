# Документы

Карта канона Start Reality Lite.

## Действующие

| Файл | Роль |
|---|---|
| [`../AGENTS.md`](../AGENTS.md) | Вход AI: слои, порядок чтения, границы platform / project |
| `standards/AMS_SITE_CORE.md` | Конституция сайтов AMS |
| `standards/AMS_REALTY_CORE.md` | Профиль недвижимости |
| `standards/AMS_UI_CORE.md` | UI-конституция |
| `NEW_SITE_SETUP.md` | Единственная AI-инструкция адаптации копии шаблона |
| `TEMPLATE_DESIGN_SYSTEM.md` | Дизайн-система шаблона (палитра `--sr-*`, primary `#014eba`) |
| `template/PROJECT_DESIGN_SYSTEM.md` | Заготовка клиентской дизайн-системы |
| `NEW_PROJECT.md` | Короткий чеклист копирования HEAD и замены файлов |
| `TEMPLATE_EXCLUDE.md` | Что не копировать и не читать как канон |
| `adr/0001-platform-project-layers.md` | Принятый ADR слоёв platform / project |
| `seo/` | SEO Registry и поисковые интенты шаблона |
| `DELIVERY_STATE.yaml` | Delivery state: **COMPLETE**, активного плана нет |
| `OPEN_QUESTIONS.md` | Открытые вопросы владельца (не блокируют шаблон) |
| `EXIT_BUNDLE.md` | Операционный список handoff; **не** клиентский канон и **не** мастер-план |

Title, Description и H1 задаются через `docs/seo/SEO_REGISTRY_SEED.csv` и `src/project/seo.config.ts`. Демо-бренд «Старт Недвижимость», Примерск, `fixture-demo` и `.example` — тестовые данные шаблона.

## Архив

[`archive/`](archive/) — закрытые программы Freeze / Hardening / Cleanup / Neutral. **Не Source of Truth.** Не читать как действующие требования и не расширять.
