# TEMPLATE DESIGN SYSTEM

**Проект:** Start Reality Lite (нейтральный шаблон агентства)  
**Назначение:** дизайн-система шаблона сайта недвижимости на Next.js  
**Базовая UI-конституция:** AMS UI CORE  
**Стек интерфейса:** Next.js App Router · React · TypeScript strict · Tailwind CSS 4 · shadcn/ui · Lucide · pnpm  
**Палитра:** стартовые токены `--sr-*` в `src/project/theme.css`, primary `#014eba` — не менять без задачи на бренд клиента

---

## 0. Роль дизайн-системы

Эта дизайн-система конкретизирует AMS UI CORE для нейтрального шаблона агентства недвижимости.

Она определяет:

- палитру;
- типографику;
- радиусы;
- spacing;
- поверхности;
- контейнеры;
- кнопки;
- формы;
- карточки;
- Header / Footer;
- catalog UI;
- detail pages;
- responsive;
- motion;
- visual review.

Архитектура компонентов, правила переиспользования и client/server boundaries берутся из AMS UI CORE.

Главный принцип:

```text
спокойный коммерческий интерфейс недвижимости
+
каталожная ясность
+
сервисная подача
+
минимум декоративного шума
```

Сайт должен восприниматься как серьёзный инструмент выбора недвижимости, а не как рекламный лендинг и не как доска объявлений.

---

## 1. Визуальная концепция

### 1.1. Характер

Ключевые качества:

- надёжный;
- структурный;
- современный;
- спокойный;
- понятный;
- сервисный;
- визуально лёгкий;
- без luxury-пафоса;
- без «агентского шаблона».

### 1.2. Presentation style

Базовый стиль:

```text
Service Catalog Premium
```

Смысл:

- крупная, но спокойная типографика;
- один экран — один смысл;
- визуально сильный каталог;
- сервисные инструменты между товарными блоками;
- доверие через структуру, факты и воздух;
- минимум декоративных эффектов.

### 1.3. Основной UX-принцип

```text
Сначала ясность → затем доверие → затем действие.
```

Декор не должен конкурировать с предложением, каталогом, ценой, характеристиками, CTA и навигацией.

---

## 2. Источники визуальных решений

Приоритет:

1. эта проектная дизайн-система;
2. AMS UI CORE;
3. утверждённый макет страницы;
4. существующие проверенные компоненты проекта;
5. референс;
6. решение AI.

Если новый макет требует значения, которого здесь нет:

- сначала использовать существующий token;
- затем variant;
- затем проектное решение;
- не создавать случайный новый визуальный язык.

---

## 3. Цветовая система

### 3.1. Brand

| Role | HEX | Назначение |
|---|---|---|
| `primary` | `#014EBA` | основной CTA, активные ссылки, focus, ключевой акцент |
| `primary-hover` | `#003B8D` | hover / pressed |
| `primary-active` | `#002E75` | active |
| `primary-soft` | `#EAF2FF` | мягкая подложка акцента |
| `primary-pale` | `#F4F7FD` | объясняющие и trust-секции |

### 3.2. Text

| Role | HEX | Назначение |
|---|---|---|
| `foreground` | `#1F2937` | основной текст |
| `muted-foreground` | `#5B6472` | вторичный текст |
| `subtle-foreground` | `#8A93A3` | подписи и вспомогательная информация |
| `foreground-on-dark` | `#FFFFFF` | основной текст на тёмной поверхности |
| `muted-on-dark` | `rgba(255,255,255,.70)` | вторичный текст на тёмной поверхности |

Чистый `#000000` не используется.

### 3.3. Background / Surfaces

| Role | HEX | Назначение |
|---|---|---|
| `background` | `#FFFFFF` | основной фон |
| `surface-base` | `#F8FAFC` | нейтральная секция |
| `surface-soft` | `#F2F5F8` | мягкая секция / panel |
| `surface-primary` | `#F4F7FD` | брендовая светлая поверхность |
| `surface-primary-strong` | `#EAF2FF` | иконки / compact highlights |
| `surface-dark` | `#0F1F3A` | footer, stats, dark CTA |
| `card` | `#FFFFFF` | карточки и формы |

### 3.4. Borders

| Role | HEX / RGBA | Назначение |
|---|---|---|
| `border` | `#E5EAF1` | базовая граница |
| `border-strong` | `#D8E3F3` | secondary controls |
| `border-focus` | `#B7CAE8` | hover / focus secondary |
| `border-dark` | `rgba(255,255,255,.08)` | разделители на dark surface |

### 3.5. Status

| Role | HEX | Назначение |
|---|---|---|
| `success` | `#1F8A4C` | подтверждение |
| `warning` | `#B7791F` | предупреждение |
| `destructive` | `#C0392B` | ошибки |

Status-цвета не используются как декоративные brand colors.

---

## 4. Цветовой ритм страницы

Предпочтительный ритм:

```text
Hero / intro        → cool neutral
Catalog / routes    → soft neutral
Service tool        → white
Trust / explanation → pale blue / soft neutral
Lead section        → white
Footer / stats      → dark
```

Не использовать:

- десять одинаковых белых секций подряд;
- хаотическую шахматную смену фонов;
- яркие цветные поверхности без функции.

Главная глубина создаётся сменой surfaces, а не тенями.

---

## 5. Radius

Для проекта используется единая спокойная геометрия.

Базовое значение:

```text
5px
```

### 5.1. Tokens

```text
radius-sm      = 4px
radius-md      = 5px
radius-lg      = 5px
radius-xl      = 5px
radius-control = 5px
radius-card    = 5px
radius-input   = 5px
radius-modal   = 5px
```

Главное правило:

```text
обычные UI-контейнеры ≈ 5px
```

Не создавать визуальную смесь из 4 / 8 / 12 / 16 / 24 px.

### 5.2. `rounded-full`

Разрешён только там, где форма по смыслу круглая:

- avatar;
- status dot;
- radio;
- switch thumb;
- круглая icon-only control;
- маркер карты.

Обычные Button, Input, Card, Dialog, Sheet panel, Badge, Filter control, PropertyCard и DevelopmentCard не превращаются в pill.

---

## 6. Typography

### 6.1. Font family

Основной шрифт:

```text
Manrope
```

Правила:

- одна основная family;
- кириллица обязательна;
- используется `next/font`;
- загружаются только необходимые weights;
- fallback — system sans-serif;
- декоративный второй шрифт не используется.

Рекомендуемые weights:

```text
400 Regular
500 Medium
600 Semibold
700 Bold
800 ExtraBold — только для редких display/stat ролей
```

В обычном UI избегать неоправданного 700/800.

---

## 7. Typography roles

### 7.1. Display / Headings

| Role | Mobile | Tablet | Desktop | Weight | Line-height |
|---|---:|---:|---:|---:|---:|
| `display` | 36px | 44px | 52px | 600–700 | 1.10–1.12 |
| `h1` | 32px | 38px | 46px | 600–700 | 1.12 |
| `h2` | 24px | 28px | 30px | 600 | 1.20 |
| `h3` | 20px | 21px | 22px | 600 | 1.25 |
| `h4` | 17px | 18px | 18px | 600 | 1.30 |

Ключевой проектный стандарт:

```text
публичный секционный H2:
24 mobile
28 tablet
30 desktop
weight 600
line-height 1.2
letter-spacing 0
```

Это основной масштаб H2 для сайта.

### 7.2. Body / UI

| Role | Size | Weight | Line-height |
|---|---:|---:|---:|
| `body-lg` | 16px | 400–500 | 1.60 |
| `body` | 15px | 400 | 1.60 |
| `body-sm` | 14px | 400 | 1.50 |
| `ui` | 14px | 500 | 1.35 |
| `label` | 12px | 600–700 | 1.35 |
| `caption` | 12px | 400–500 | 1.45 |

Минимальный размер публичного смыслового текста:

```text
14px
```

### 7.3. Special roles

| Role | Size | Назначение |
|---|---|---|
| `stat` | `clamp(28px, 3vw, 40px)` | проверенные метрики |
| `hero-eyebrow` | 12px | короткий label |
| `card-title` | 18–22px | карточка |
| `price-lg` | 24–30px | цена на detail/sidebar |
| `catalog-h1` | `clamp(24px,2vw,30px)` | detail/catalog compact H1 |

---

## 8. Typography rules

- один H1 на страницу;
- Hero-scale используется только там, где действительно нужен Hero;
- H2 вне специальных инструментов использует одну секционную шкалу;
- заголовки по умолчанию выравниваются по левому краю;
- центрирование допустимо только для явной conversion-композиции;
- не использовать отрицательный letter-spacing по умолчанию;
- заголовки используют `text-wrap: balance`;
- параграфы используют `text-wrap: pretty`;
- длинный body-текст ограничивается комфортной длиной строки;
- `input` имеет минимум 16px на mobile для предотвращения Safari zoom.

---

## 9. Micro label

Для eyebrow / category label:

```text
font-size: 12px
font-weight: 700
text-transform: uppercase
letter-spacing: .08em
color: primary
```

Используется дозированно.

Не ставить eyebrow автоматически перед каждым H2.

---

## 10. Spacing system

Базовая единица:

```text
4px
```

Разрешённая шкала:

```text
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 72 / 96
```

Случайные значения между ними не вводятся без причины.

---

## 11. Section rhythm

| Role | Desktop | Mobile |
|---|---:|---:|
| `section-sm` | 48px | 32px |
| `section-md` | 72px | 48px |
| `section-lg` | 96px | 64px |
| `section-hero` | 72–96px | 48–64px |

`section-md` — базовый.

Не суммировать большой `padding-bottom` предыдущей секции и большой `padding-top` следующей.

---

## 12. Containers

### 12.1. Site

```text
max-width: 1360px
desktop padding: 48px
tablet padding: 32px
mobile padding: 20px
```

### 12.2. Narrow

Для документов, длинного текста, небольших форм и editorial content.

Рекомендуемая readable width:

```text
680–760px
```

### 12.3. Wide

Используется только для крупного каталога, comparison и сложной media/detail composition.

---

## 13. Grid

Desktop:

```text
12 columns
gap 32px
```

Типовые композиции:

```text
12
6 / 6
4 / 8
5 / 7
7 / 5
3 / 9
```

Catalog cards:

```text
wide desktop → 4
tablet       → 2
mobile       → 1
```

Карточка не меняет ширину из-за малого количества элементов.

---

## 14. Shadows

Система преимущественно плоская.

```text
shadow-soft
0 6px 18px rgba(15,31,58,.06)

shadow-card
0 12px 32px rgba(15,31,58,.08)

shadow-hover
0 16px 36px rgba(15,31,58,.10)

shadow-overlay
0 20px 50px rgba(15,31,58,.16)

shadow-focus
0 0 0 4px rgba(1,78,186,.10)
```

Правила:

- обычная карточка может жить без тени;
- тень не заменяет border/surface hierarchy;
- сильная Material-style тень запрещена;
- hover shadow используется умеренно.

---

## 15. Motion

Базово:

```text
150–300 ms
```

Разрешено:

- background transition;
- border transition;
- opacity;
- transform;
- лёгкий card lift;
- image scale внутри media;
- dialog/sheet transition.

Не использовать:

- GSAP;
- Framer Motion только ради fade-in;
- parallax;
- glassmorphism;
- постоянные decorative animation loops.

`prefers-reduced-motion` обязателен.

---

## 16. shadcn/ui mapping

В проекте используется shadcn/ui как primitive layer.

### 16.1. Базовые primitives

Нужны по мере использования:

- Button;
- Input;
- Textarea;
- Label;
- Checkbox;
- RadioGroup;
- Select;
- Badge;
- Card;
- Dialog;
- Sheet;
- Accordion;
- Tabs;
- DropdownMenu;
- NavigationMenu;
- Popover;
- Tooltip;
- Breadcrumb;
- Skeleton;
- Separator;
- Pagination;
- Sonner.

Не устанавливать всё заранее.

### 16.2. Primitive base

```text
Radix
```

по умолчанию для проекта.

Не смешивать параллельные primitive bases для одинаковых задач.

---

## 17. Button

### Primary

```text
background: primary
foreground: white
radius: 5px
height: 48px default
horizontal padding: 20–24px
font-size: 14–15px
font-weight: 600
```

Hover:

```text
primary-hover
```

Допускается `translateY(-1px)` без обязательной тени.

### Secondary

```text
background: white
foreground: primary
border: border-strong
radius: 5px
```

Hover:

```text
background: primary-pale
border: border-focus
```

### Ghost

```text
background: transparent
foreground: primary
```

Hover:

```text
background: primary-soft
```

### Button rules

- один primary CTA на смысловой экран;
- outline не используется как главный CTA;
- одинаковая button-height внутри одной формы/панели;
- текст не тяжелее 600;
- icon optional, но не декоративная по умолчанию;
- loading state обязателен для async action.

---

## 18. Input / Textarea

Default Input:

```text
height: 52–56px
background: white
border: 1px solid border
radius: 5px
padding-inline: 16px
font-size: 16px mobile
foreground: foreground
```

Focus:

```text
border: primary
shadow: focus
```

Error:

```text
border: destructive
error text: destructive
```

Disabled:

```text
background: surface-base
foreground: subtle-foreground
```

Textarea:

```text
min-height: 120px
padding: 16px
resize: vertical
```

---

## 19. Lead Form

LeadForm — единый shared/domain pattern.

UI states:

```text
default
focus
validation error
submitting
delivery pending
success
server error
```

Форма визуально не знает, используется ли direct/service/dual delivery.

Базовый form shell:

```text
background: card
border: 1px solid border
radius: 5px
padding: 24–32px
```

Поля на первом экране минимальны.

Consent:

- видимый;
- читаемый;
- без prechecked;
- ссылка на правовой документ рядом.

---

## 20. Card

Base Card:

```text
background: card
border: 1px solid border
radius: 5px
padding: 20–24px
```

Hover для кликабельной карточки:

```text
border → rgba(primary, .15)
transform → translateY(-2px)
shadow → shadow-hover optional
```

На touch нельзя строить понимание состояния только на hover.

---

## 21. Badge / Chip

Базовая форма:

```text
radius: 5px
font-size: 12px
font-weight: 600
padding: 4px 8–12px
```

Не использовать полную pill-геометрию по умолчанию.

Variants:

- primary;
- neutral;
- success;
- dark;
- exclusive;
- ID.

---

## 22. Icons

Библиотека:

```text
Lucide
```

Размеры:

```text
16px compact
20px UI
24px standard
32px section
```

Stroke:

```text
1.5–2
```

Иконки:

- line-based;
- без filled cartoon style;
- без emoji вместо icon;
- icon-only action имеет accessible name.

Icon surface:

```text
40–48px
background: primary-soft
radius: 5px
color: primary
```

---

## 23. Header

### Desktop

Высота:

```text
72–80px
```

Состав:

- logo;
- primary navigation;
- phone;
- utility actions при необходимости;
- primary CTA.

Header:

```text
background: white
border-bottom: 1px solid border
```

Sticky допускается.

Не использовать тяжёлую glass-панель, декоративную большую тень или вторую navigation system.

### Mobile

Используется shadcn `Sheet`.

Внутри:

- logo;
- close;
- navigation groups;
- phone/contact;
- primary CTA.

Touch targets:

```text
≥ 44px
```

---

## 24. Footer

Surface:

```text
surface-dark
```

Структура:

- brand;
- основные navigation groups;
- contact;
- legal links;
- requisites;
- copyright.

Текст:

```text
primary → white
secondary → rgba(255,255,255,.70)
label → rgba(255,255,255,.40)
divider → rgba(255,255,255,.08)
```

Footer не создаёт второй visual language.

---

## 25. Breadcrumbs

Единый component.

Визуально:

```text
14px
muted text
ChevronRight
current item darker
primary hover
```

На mobile breadcrumb не ломает layout и допускает внутренний horizontal scroll.

---

## 26. Hero

### 26.1. Главная

Предпочтительный pattern:

```text
split hero
```

Левая часть:

- optional eyebrow;
- H1;
- короткое supporting proposition;
- proof/trust line;
- primary CTA;
- secondary action optional.

Правая:

- содержательное изображение;
- либо featured property/development;
- либо сервисный visual.

### 26.2. Первый экран — правила

H1:

- максимум 2–3 визуальные строки;
- не превращать в декоративный лозунг;
- сначала коммерческий смысл.

Один главный CTA.

Не использовать несколько одинаково сильных кнопок, длинную форму, стоковую семью с ключами и абстрактную 3D-графику без задачи.

---

## 27. Второй экран

Второй экран обязан продолжать решение пользователя.

Подходящие варианты:

- quick actions;
- service routes;
- каталог;
- подборки;
- конкретное отличие;
- доказательство;
- инструмент.

Для главной проекта предпочтителен compact service navigation block.

---

## 28. Section Heading

Используется единый `SectionHeader`.

Основной публичный H2:

```text
24 / 28 / 30px
weight 600
line-height 1.2
left aligned
```

Опционально:

- eyebrow;
- supporting text;
- action/link.

Не создавать новый размер H2 на каждой странице.

---

## 29. Catalog Hero

Для основных catalog entry pages используется один reusable pattern.

Содержит:

- H1;
- короткий subtitle;
- один CTA;
- содержательный visual / image.

На mobile:

- меньше высота;
- subtitle может сокращаться;
- H1 не становится display-scale.

---

## 30. Catalog Toolbar

Desktop:

- result count;
- filters;
- sort;
- optional view switch.

Mobile:

- result count;
- compact filter trigger;
- selected filter chips;
- sort;
- full filter Sheet.

Controls используют radius 5px.

---

## 31. Property Card

PropertyCard — единый domain component.

Базовая структура:

1. media;
2. status / ID badges;
3. price;
4. title;
5. location;
6. 2–4 ключевых facts;
7. optional session actions.

Card chrome:

```text
background: white
border: border
radius: 5px
```

Media верхние углы следуют тем же 5px.

Price визуально сильнее secondary facts.

Не показывать неподтверждённые рейтинги, случайные marketing badges, длинное описание и много CTA.

---

## 32. Development Card

DevelopmentCard использует тот же базовый visual language каталога.

Состав:

- image;
- name;
- geo;
- developer;
- сдача / status при наличии;
- min price только если свежая;
- optional CTA.

Не создавать отдельную карточную дизайн-систему для ЖК.

---

## 33. Agent Card

AgentCard:

- portrait;
- full name;
- role;
- specialization optional;
- public work contact optional;
- link to profile, если разрешено.

Не использовать fake rating, fake review count, личные контакты и внутренние статусы.

---

## 34. Detail Page

Объект и ЖК используют общий object-detail pattern.

Desktop:

```text
main content
+
sticky decision sidebar
```

Main:

- breadcrumbs;
- H1;
- media shell;
- facts;
- description;
- related content.

Sidebar:

- price;
- core facts;
- CTA;
- agent/project contact.

Radius всех UI containers:

```text
5px
```

---

## 35. Gallery

Gallery — один стабильный media shell.

Допустимые tabs:

- Фото;
- Видео;
- На карте.

Переключение tab не должно резко менять внешнюю высоту shell.

Не загружать все full-size assets сразу.

Controls используют shadcn primitives, radius 5px и keyboard accessibility.

---

## 36. Decision Sidebar

Sidebar:

```text
background: white
border: border
radius: 5px
```

При наличии места — sticky.

Внутри:

- price;
- important facts;
- primary CTA;
- secondary CTA optional;
- public agent / project contact.

Не перегружать sidebar большим FAQ, десятком chips, маркетинговым текстом и несколькими равноценными CTA.

---

## 37. Service Tool

Калькулятор, ипотечный блок, квиз или подбор:

- воспринимается как инструмент;
- имеет понятный результат;
- не маскируется под контентный блок.

Desktop:

```text
2 columns
```

Mobile:

```text
stacked
```

UI controls полностью из primitives.

---

## 38. Trust Section

Доверительный экран может содержать:

- руководителя;
- проверенные показатели;
- процесс;
- документы;
- конкретное отличие.

Не создавать fake metrics.

Любая цифра должна приходить из утверждённого project content/data source.

---

## 39. Stats

Stats используются только для проверенных значений.

Style:

```text
dark surface
large stat number
small muted label
```

Desktop: 4 columns.  
Mobile: 2 columns.  
Radius container: 5px.

---

## 40. FAQ

Используется shadcn Accordion.

FAQ:

- один вопрос — одна строка/короткий title;
- ответ readable;
- без card nesting;
- radius 5px;
- понятный focus;
- не создаётся самостоятельная UI-система accordion.

---

## 41. Dialog / Request Modal

Используется shadcn Dialog.

Основная request modal:

- понятный H2;
- короткий контекст;
- имя;
- телефон;
- consent;
- submit.

Radius:

```text
5px
```

Overlay читаемый, без агрессивного black opacity.

Success остаётся в текущем контексте через отдельный success state / overlay.

---

## 42. Cookie UI

Cookie notice:

- не блокирует весь интерфейс без необходимости;
- использует compact card;
- radius 5px;
- основной текст readable;
- CTA минимум 44px на mobile.

Privacy options определяются legal/analytics policy проекта, не дизайн-системой.

---

## 43. Error / Empty / Loading

### Loading

Skeleton только при реальном ожидании.

### Empty

Нейтральное объяснение и следующий шаг.

### Error

Контролируемый текст + retry/navigation.

### 404

Editorial layout:

- H1;
- короткое объяснение;
- 1–2 действия.

Не использовать технический текст.

---

## 44. Responsive

Подход:

```text
mobile first
```

Проверочные размеры:

```text
375
768
1024
1440
```

Обязательно проверять:

- header;
- hero;
- long H1;
- catalog grid;
- filter;
- cards;
- gallery;
- sticky sidebar;
- form;
- modal;
- footer;
- breadcrumbs;
- overflow.

---

## 45. Accessibility

Цель:

```text
WCAG 2.2 AA
```

Минимум:

- visible focus;
- keyboard;
- labels;
- aria states;
- semantic headings;
- contrast;
- reduced motion;
- meaningful alt;
- decorative `alt=""`;
- target 44×44px.

Цвет не является единственным способом передачи состояния.

---

## 46. Commercial hierarchy

Первый экран должен отвечать:

1. кто это;
2. что предлагается;
3. кому;
4. в чём практическая польза;
5. почему доверять;
6. что сделать дальше.

Второй экран должен продолжать решение через каталог, маршруты, доказательство, конкретную услугу или инструмент.

Дизайн не компенсирует слабый оффер.

---

## 47. Anti-patterns

Запрещены:

- второй UI kit;
- второй icon set;
- hardcoded colors в JSX;
- случайные radii;
- pill на всём подряд;
- full-page client rendering без причины;
- Material-heavy shadows;
- glassmorphism;
- parallax;
- rainbow / neon;
- тёплая gold/beige luxury-палитра;
- fake urgency;
- fake scarcity;
- fake ratings;
- fake reviews;
- fake stats;
- 3 равнозначных primary CTA;
- длинные формы на первом экране;
- стоковые «ключи / рукопожатия / luxury family»;
- новый тип карточки для каждой страницы;
- новый heading scale для каждой секции.

---

## 48. Tailwind / shadcn token contract

Проект использует semantic shadcn-compatible tokens.

```css
:root {
  --background: #ffffff;
  --foreground: #1f2937;

  --card: #ffffff;
  --card-foreground: #1f2937;

  --popover: #ffffff;
  --popover-foreground: #1f2937;

  --primary: #014eba;
  --primary-foreground: #ffffff;

  --secondary: #f4f7fd;
  --secondary-foreground: #014eba;

  --muted: #f2f5f8;
  --muted-foreground: #5b6472;

  --accent: #eaf2ff;
  --accent-foreground: #014eba;

  --destructive: #c0392b;

  --border: #e5eaf1;
  --input: #e5eaf1;
  --ring: #014eba;

  --radius: 0.3125rem;

  --surface-base: #f8fafc;
  --surface-soft: #f2f5f8;
  --surface-primary: #f4f7fd;
  --surface-primary-strong: #eaf2ff;
  --surface-dark: #0f1f3a;

  --primary-hover: #003b8d;
  --primary-active: #002e75;

  --success: #1f8a4c;
  --warning: #b7791f;

  --shadow-soft: 0 6px 18px rgb(15 31 58 / 0.06);
  --shadow-card: 0 12px 32px rgb(15 31 58 / 0.08);
  --shadow-hover: 0 16px 36px rgb(15 31 58 / 0.10);
  --shadow-focus: 0 0 0 4px rgb(1 78 186 / 0.10);
}
```

`0.3125rem` = 5px при стандартном root font size 16px.

---

## 49. Typography token contract

```css
:root {
  --text-display: clamp(2.25rem, 4vw, 3.25rem);
  --text-h1: clamp(2rem, 3.4vw, 2.875rem);
  --text-h2: clamp(1.5rem, 2vw, 1.875rem);
  --text-h3: clamp(1.25rem, 1.7vw, 1.375rem);
  --text-h4: 1.125rem;

  --text-body-lg: 1rem;
  --text-body: 0.9375rem;
  --text-body-sm: 0.875rem;
  --text-label: 0.75rem;
  --text-caption: 0.75rem;

  --leading-heading: 1.12;
  --leading-title: 1.2;
  --leading-body: 1.6;
  --leading-ui: 1.35;
}
```

На mobile секционный H2 не должен становиться меньше 24px.

---

## 50. Layout token contract

```css
:root {
  --container-site: 85rem;
  --container-narrow: 46rem;

  --page-padding-mobile: 1.25rem;
  --page-padding-tablet: 2rem;
  --page-padding-desktop: 3rem;

  --section-sm-mobile: 2rem;
  --section-sm-desktop: 3rem;

  --section-md-mobile: 3rem;
  --section-md-desktop: 4.5rem;

  --section-lg-mobile: 4rem;
  --section-lg-desktop: 6rem;

  --grid-gap: 2rem;
}
```

---

## 51. UI layer

Логическая структура:

```text
ui/
├── primitives/
├── shared/
├── layout/
├── domain/
└── sections/
```

### primitives

shadcn/ui.

### shared

- Container;
- Section;
- SectionHeader;
- ImageFrame;
- EmptyState;
- ErrorState;
- CTA block.

### layout

- Header;
- Footer;
- MobileNavigation;
- PageShell.

### domain

- PropertyCard;
- DevelopmentCard;
- AgentCard;
- PriceDisplay;
- CatalogToolbar;
- FilterBar;
- ResultCount;
- Gallery;
- DecisionSidebar.

### sections

- HeroSection;
- ServiceRoutesSection;
- CatalogPreviewSection;
- TrustSection;
- MortgageSection;
- LeadSection;
- FAQSection;
- PopularSearchesSection.

---

## 52. Component creation rule

Всегда:

```text
REUSE
→ VARIANT
→ COMPOSE
→ CREATE
```

Нельзя создавать `BlueButton`, `HeroButton`, `CatalogButton`, если это только другой variant обычного Button.

Нельзя создавать второй PropertyCard для каждой страницы, если меняется только набор данных или variant.

---

## 53. Server / Client

Server Components:

- layout;
- sections;
- cards;
- SEO-visible content;
- catalog markup.

Client islands:

- mobile menu;
- filters;
- favorite/compare;
- Dialog;
- Accordion;
- form interaction;
- gallery;
- map;
- local browser state.

Не превращать страницу целиком в `"use client"`.

---

## 54. Visual review checklist

Перед завершением экрана:

- [ ] Использована только эта палитра.
- [ ] Основной radius около 5px.
- [ ] Нет случайных `rounded-xl` / `rounded-2xl`.
- [ ] H2 соответствует 24 / 28 / 30.
- [ ] Manrope используется везде.
- [ ] Нет второго шрифта.
- [ ] Первый экран имеет один главный CTA.
- [ ] Второй экран логично продолжает первый.
- [ ] Section spacing системный.
- [ ] Container padding не дублируется секцией.
- [ ] Cards используют один chrome.
- [ ] Property / Development cards не имеют независимых дизайн-языков.
- [ ] Shadcn primitives не дублируются сырым интерактивным HTML.
- [ ] Focus виден.
- [ ] Mobile 375 проверен.
- [ ] Tablet 768 проверен.
- [ ] Desktop 1440 проверен.
- [ ] Длинные русские заголовки не ломают layout.
- [ ] Input на mobile не меньше 16px.
- [ ] Touch targets около 44px.
- [ ] Нет fake facts.
- [ ] Нет тёплой luxury-палитры.
- [ ] Нет тяжёлых декоративных animation frameworks.
- [ ] reduced motion учтён.

---

## 55. Definition of Done

Дизайн-система считается применённой корректно, когда:

- shadcn/ui является primitive layer;
- Lucide является единым icon set;
- semantic tokens реализованы;
- брендовая палитра не хардкодится в JSX;
- radius ≈ 5px применяется системно;
- typography roles едины;
- публичный H2 использует проектную секционную шкалу;
- Container и Section работают централизованно;
- PropertyCard / DevelopmentCard / AgentCard являются domain components;
- LeadForm использует общий UI pattern;
- Header и Footer находятся в одной дизайн-системе;
- каталоги и detail pages используют один visual language;
- client islands минимальны;
- responsive проверен;
- accessibility проверена;
- visual review выполнен.

---

## 56. Финальный принцип

```text
Шаблон агентства — это не рекламный лендинг
и не доска объявлений.

Это спокойный сервисный интерфейс недвижимости.

Синий брендовый акцент,
Manrope,
чистые светлые surfaces,
тёмно-синий глубокий слой,
компактная типографика,
единый радиус около 5px,
понятный каталог,
минимум декоративного шума.

Любой новый экран должен выглядеть
как продолжение одной системы,
а не как отдельный дизайн.
```
