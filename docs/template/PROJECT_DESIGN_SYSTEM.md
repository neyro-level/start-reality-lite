# Project Design System

Нейтральная заготовка дизайн-системы для нового коммерческого клиента на AMS Realty Template.

`docs/SOUZ_DESIGN_SYSTEM.md` — канон этого шаблона. Стартовая палитра уже задана в `src/project/theme.css` (`--sr-primary: #014eba` и остальные `--sr-*`). Новый клиент меняет тексты; палитру в `theme.css` меняет только если бренд другой.

При создании нового проекта заполните разделы ниже фактами бренда клиента и подключите их к `src/project/theme.css` и `src/project/ui-text.config.ts`.

---

## Brand

- Название:
- Тон голоса:
- Что нельзя:

## Colors

- Primary:
- Surface:
- Text:
- Border:
- Accent:
- Destructive:

Стартовые цвета шаблона оставлять, если бренд клиента это допускает. Иначе заменить палитру в `theme.css`.

## Typography

- Family:
- Weights:
- Body size / line-height:
- Heading scale:

## Radius

- Control:
- Card:
- Sheet:

## Spacing

- Scale:
- Section gaps:
- Form gaps:

## Containers

- Max width:
- Page padding mobile / desktop:

## Surfaces

- Page background:
- Card:
- Header / Footer:
- Overlay:

## Buttons

- Primary:
- Secondary:
- Ghost / header CTA:

## Forms

- Input height:
- Label:
- Error:
- Consent:

## Cards

- Catalog card:
- Developer / agent card:
- Home selection card:

## Header / Footer

- Header height and nav:
- Phone / CTA:
- Footer columns:
- Legal line:

Search, Favorites и Journal в шаблоне выключены до отдельной реализации.

## Catalog UI

- Grid:
- Filters / toolbar:
- Price display (скрывать stale price):
- Empty / gate-fail states:

## Responsive

- Mobile:
- Tablet:
- Desktop:

## Accessibility

- Focus:
- Contrast:
- Form errors (`aria-invalid`):
- Hit area:

---

Новый клиент заполняет этот файл. Не подменять его `SOUZ_DESIGN_SYSTEM.md`.
