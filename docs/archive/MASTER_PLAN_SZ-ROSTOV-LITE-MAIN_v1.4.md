# **Мастер-план SZ-ROSTOV-LITE-MAIN**

```text
Plan ID: SZ-ROSTOV-LITE-MAIN
Canonical file: docs/MASTER_PLAN.md
SourceCraft: integrator-p/soyuz-rostov-light-realty
Version: v1.4
Status: APPROVED
Phase: F1_TEMPLATE_HARDENING
approved_by: owner
approved_at: 2026-10-04T13:00:00+03:00
PROJECT_CLASS: COMMERCIAL
DELIVERY_PROFILE: COMMERCIAL
AMS_PROFILE: REALTY_LITE
delivery_mode: PR_ONLY
```

**Проект:** «Союз Застройщиков», Ростов-на-Дону 

**Домен:** [[удалено]]([удалено]) (работаем на текущем домене, перенос будет отдельным шагом) **Профиль:** `AMS_PROFILE=REALTY_LITE` 

**Нормативы:** AMS REALTY LITE Core Standard 1.1.0, AMS Data Hub contract 3.1.2, AMS UI Core 5.0 

**Цель:** довести `main` до состояния, в котором его можно скопировать как шаблон. Каждая заявленная функция должна реально работать, а не только проходить проверку. Дизайна, production и CMS в плане нет.

Что изменилось относительно v1:

* L0–L5 закрыты в `main`. Текущий эпик — F1 «Дочистка перед шаблоном». После merge статус `TEMPLATE_READY`.
* Канон плана только здесь: `docs/MASTER_PLAN.md`. Стандарты только в `docs/standards/`.
* Title/Description/robots резолвятся из SEO-реестра; заглушка «Realty Lite» запрещена.
* `LEAD_TRANSPORT=none|smtp`, MemoryLeadSink только в тестах.
* Next 16 `src/proxy.ts`, локальный Manrope, `pnpm verify`, лёгкая проверка на PR и ручной `merge-gate`.

---

## **0\. Что лежит в репозитории до старта**

Copy  
/docs/standards/AMS\_REALTY\_LITE\_CORE\_STANDARD.md   (1.1.0)  
/docs/standards/AMS\_DATA\_HUB\_CONTRACT.md           (3.1.2)  
/docs/standards/AMS\_UI\_CORE\_v5.0\_FINAL.md  
/docs/MASTER\_PLAN.md                               (этот документ)

Title, Description и H1 берутся только из `docs/seo/SEO_REGISTRY_SEED.csv` и `src/project/seo.config.ts`. Менять их можно только через PR.

## **1\. Правила для ИИ (AGENTS.md)**

Документы читаются в таком порядке: AGENTS → MASTER\_PLAN → DELIVERY\_STATE → standards → PROJECT.md → задача. Если они противоречат друг другу, приоритет такой: ADR владельца → Lite Standard → Hub contract → MASTER\_PLAN → UI Core → код → чат.

**Запрещено:**

* БД, CMS, Payload, Prisma, Redis, брокеры, поисковые движки;  
* ISR на каталожных маршрутах и wildcard-хосты для изображений;  
* изменение grammar и `publicUrlId`;  
* придуманные enum, поля Hub, тексты и пороги.

**Как поступать при пробелах:**

* Поля нет в контракте → пометка `REQUIRES HUB CONTRACT`.  
* Нет решения → страница получает `noindex` или `disabled`, а вопрос записывается в `docs/OPEN_QUESTIONS.md`.

**Правило слоёв:**

* Всё, что относится к «Союзу» (названия, города, URL-сегменты, тексты, контакты, цвета), лежит только в `src/project/*` и `docs/seo/*`.  
* Платформенный код читает это из конфигов и сам ничего такого не содержит.

## **2\. Архитектура: платформа и проектный слой**

| Слой | Где лежит | Что внутри | Меняется в следующем проекте |
| :---- | :---- | :---- | :---- |
| Платформа | `src/platform/**`, `src/app/**` (тонкие маршруты), `scripts/**` | Движок URL grammar, снапшот и контракты Hub, content gate, metadata resolver, robots и sitemap, JSON-LD, Lead API, медиа, безопасность, рендер каждого типа страницы, нейтральные UI-компоненты | Нет |
| Проектный слой | `src/project/**`, `docs/seo/**`, `fixtures/fixture-sz-rostov/**` | Бренд, реквизиты, гео, категории, районы, навигация, флаги, SEO-реестр, редиректы, тема | Да, полностью |

Состав проектного слоя:

Copy  
src/project/site.config.ts        бренд, реквизиты, контакты, режим работы  
src/project/grammar.config.ts     geoMode, гео, категории, фасеты, районы  
src/project/features.config.ts    флаги опциональных разделов  
src/project/navigation.config.ts  шапка, подвал, PreFooter  
src/project/seo.config.ts         правила бренда в Title, шаблоны переменных  
src/project/static-pages.config.ts список статических страниц и их тип  
src/project/redirects/legacy.ts   старые URL → 301 / 410  
src/project/theme.css             токены темы (цвета, шрифты, радиусы, отступы, логотип)  
docs/seo/SEO\_REGISTRY\_SEED.csv    Title / Description / H1 / robots по pageKey

Разделение защищают guards:

* `platform-no-project-literals` запрещает в платформенном коде строки вроде «Ростов», «Союз», `souz-home` и проектные slug;  
* `no-literal-hrefs` запрещает ссылки строкой, ссылки строятся только через grammar;  
* dependency-cruiser запрещает импорт из `src/platform` в `src/project` в обратную сторону.

Если guards зелёные, следующий проект сводится к замене файлов проектного слоя.

## **3\. Git-протокол**

Канон: SourceCraft primary, `delivery_mode=PR_ONLY`. Direct push в `main` запрещён.

* F1 делается в ветке `epic/F1-template-hardening` от свежего `origin/main`. Весь эпик — один PR.  
* Коммиты оформляются как `F1.<k>: <описание>`.  
* Перед PR локально: `pnpm install --frozen-lockfile && pnpm verify && pnpm build`.  
* На PR автоматически идёт лёгкая проверка: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm verify:layers`.  
* На push CI не запускается.  
* Перед merge — один ручной exact-head `merge-gate`: `pnpm install --frozen-lockfile && pnpm verify && pnpm build`.  
* Production этим планом не делается и отдельной командой не подменяется.  
* После merge source-ветка удаляется.  
* Эпики L0→L5 идут по HARD-зависимостям контракта, а не потому что «так удобнее CI».

## **4\. Стек**

Все версии фиксируются в lockfile:

* **Основа:** Node.js 24 LTS, corepack, pnpm, Next ≥ 16.3.8, React ≥ 19.2.4, TypeScript strict.  
* **UI:** Tailwind 4.x, shadcn/ui, lucide-react.  
* **Валидация и качество кода:** Zod, Biome, dependency-cruiser.  
* **Тесты:** Vitest, Playwright.  
* **Прочее:** tsx, `node:crypto` (Ed25519, sha256), libphonenumber-js, unified/remark \+ rehype-sanitize.

Набор проверок соответствует Lite Standard: `verify:lite`, `verify:snapshot`, `verify:contracts`, `verify:seo-contracts`, `verify:ui-core`, `verify:journal`, `verify:security`, `verify:performance`, `verify:exit-mode`, а сводная `verify` запускает их все. Собственные проверки проекта (`verify:layers`, `template:check`) живут отдельно и в стандартный набор не подмешиваются.

## **5\. Реквизиты и контакты (`src/project/site.config.ts`)**

| Поле | Значение |
| :---- | :---- |
| Бренд | «Союз Застройщиков» |
| Юр. лицо | клиентские данные удалены из шаблона |
| ИНН | [удалено] |
| Директор и основатель | клиентские данные удалены из шаблона |
| Телефон | \[удалено] (`tel:[удалено]`) |
| E-mail | [удалено] |
| Адрес офиса | г. Ростов-на-Дону, [удалено] |
| Режим работы | Ежедневно 9:00–18:00 (в разметке Schema `Mo-Su 09:00-18:00`) |
| Сайт | [[удалено]]([удалено]) |

Эти данные используют шапка, подвал, контакты, юридические страницы, JSON-LD и получатель заявок. Дублировать их в коде нельзя.

## **6\. Зафиксированные решения**

| ID | Решение |
| :---- | :---- |
| D1 | `geoMode=SINGLE_GEO`, гео-slug `rostov-na-donu`. Задаётся в `grammar.config.ts` |
| D2 | Активные категории: `novostroyki`, `kvartiry`. Фасет `vtorichka` есть только у `kvartiry` |
| D3 | Рынок `NEWBUILD` ставится только при `dealKind ∈ {PRIMARY_SALE, ASSIGNMENT}`. Привязка к ЖК (`developmentUid`) хранится отдельным атрибутом |
| D4 | Цена старше 45 дней скрывается. При 120 днях content gate не проходит (FAIL). Тексты ЖК не проходят gate, если `checkedAt` старше 180 дней |
| D5 | `publicUrlId` соответствует `^[a-z2-7]{5,8}$` |
| D6 | `trailingSlash=true`, нормализация через 308\. Старые URL переводятся одним 301-переходом. Удалённые разделы отдают 410 |
| D7 | В `main` стоит `INDEXING_MODE=staging`: все страницы `noindex`, в robots `Disallow: /` |
| D8 | GEO\_HUB `/rostov-na-donu/` получает `noindex,follow`, чтобы не конкурировать с главной |
| D9 | `LEADS_MODE=direct`. Транспорт: `LEAD_TRANSPORT=none` (по умолчанию, API 503) или `smtp`. MemoryLeadSink только в тестах |
| D10 | Используется свой image loader и `MEDIA_ORIGIN`, без `remotePatterns` |
| D11 | У каталожных и объектных страниц бренда в Title нет. У главной, услуг и страниц компании бренд в Title есть. Правило задаётся в `seo.config.ts` |
| D12 | JSON-LD: `RealEstateAgent` с реквизитами из §5 плюс `BreadcrumbList`. `AggregateRating` и `Review` запрещены |
| D13 | Флаги в `features.config.ts`: `journal: DISABLED`, `vtorichka: ON`, `yurist: ON`, `vacancies: ON`, `favorites: ON`, `search: ON`. Выключенный раздел отдаёт 404, не попадает в sitemap, меню и перелинковку. `verify:journal` проверяет именно состояние `DISABLED` |
| D14 | Страниц «Строительство домов» и «Отзывы» нет: ни маршрутов, ни строк в реестре |
| D15 | Групповые пункты меню («Недвижимость», «Услуги», «О компании») — это заголовки выпадающих списков, а не ссылки |
| D16 | Компоненты берут цвета, шрифты, радиусы и отступы только из токенов `theme.css`. Произвольные цвета и значения в компонентах запрещены, это проверяет `verify:ui-core` |
| D17 | UI-тексты лежат в `src/project/ui-text.config.ts`. В `src/app` и `src/platform` кириллицы в строках и JSX нет |
| D18 | `PROJECT_CLASS=COMMERCIAL`, `DELIVERY_PROFILE=COMMERCIAL`: клиентский сайт, заявки, публичный домен |
| D19 | Git: `PR_ONLY`, zero-CI на push, лёгкая проверка на PR, один ручной `merge-gate` перед merge |
| D21 | Шрифт платформы по умолчанию — локальный Manrope (latin+cyrillic, 200–800), без Google Fonts |
| D22 | Next 16: `src/proxy.ts` вместо `middleware.ts`; matcher не хардкодится, правила из `legacy.ts` |
| D20 | Базы данных в проекте нет и не будет. Запрещены PostgreSQL, Payload, Prisma, CMS и `DATABASE_URL`. Оставшиеся Payload-секреты в Secret Master не читать и не подключать |

## **7\. Карта страниц и SEO-реестр**

Ограничения для реестра:

* Title — 30–65 символов, Description — 70–170 символов, все значения уникальны.  
* Переменные в `{}` подставляются из снапшота Hub. Если поля нет, используется вариант без него.  
* Скрытая цена (D4) в Title и Description не выводится.

### **7.1. Главная и каталог**

| pageKey | URL | robots | Title | H1 | Description |
| :---- | :---- | :---- | :---- | :---- | :---- |
| home | `/` | index | Новостройки и квартиры в Ростове-на-Дону — Союз Застройщиков | Новостройки и квартиры в Ростове-на-Дону | Каталог новостроек и квартир Ростова-на-Дону: цены от застройщиков, планировки, сроки сдачи. Помощь с ипотекой и юридическая проверка сделки. |
| geoHub | `/rostov-na-donu/` | noindex,follow | Недвижимость в Ростове-на-Дону: новостройки и квартиры | Недвижимость в Ростове-на-Дону | Новостройки и квартиры в Ростове-на-Дону: актуальные предложения от застройщиков и собственников, цены и планировки. |
| catNovostroyki | `/rostov-na-donu/novostroyki/` | index | Новостройки Ростова-на-Дону — цены от застройщиков | Новостройки в Ростове-на-Дону | Новостройки Ростова-на-Дону от застройщиков: цены, планировки, сроки сдачи и расположение ЖК. Подбор квартиры и помощь с ипотекой. |
| catKvartiry | `/rostov-na-donu/kvartiry/` | index | Купить квартиру в Ростове-на-Дону — цены и планировки | Квартиры в Ростове-на-Дону | Квартиры в Ростове-на-Дону в новостройках и на вторичном рынке: цены, площадь, этаж и планировки. Фильтры по району, комнатности и бюджету. |
| facetVtorichka | `/rostov-na-donu/kvartiry/vtorichka/` | index (gate) | Вторичное жильё в Ростове-на-Дону — квартиры с ценами | Вторичные квартиры в Ростове-на-Дону | Квартиры на вторичном рынке Ростова-на-Дону: актуальные предложения с ценами, фото и планировками. Юридическая проверка объекта перед покупкой. |
| distLeninskiy | `/rostov-na-donu/novostroyki/leninskiy/` | index (gate) | Новостройки Ленинского района Ростова-на-Дону — цены | Новостройки Ленинского района | Новостройки Ленинского района Ростова-на-Дону: ЖК от застройщиков, цены, планировки и сроки сдачи. Подбор квартиры и ипотека. |
| distVoroshilovskiy | `/rostov-na-donu/novostroyki/voroshilovskiy/` | index (gate) | Новостройки Ворошиловского района Ростова — цены | Новостройки Ворошиловского района | Новостройки Ворошиловского района Ростова-на-Дону: жилые комплексы, цены от застройщиков, планировки и сроки сдачи домов. |
| distSevernyy | `/rostov-na-donu/novostroyki/severnyy/` | index (gate) | Новостройки Северного микрорайона Ростова-на-Дону | Новостройки в Северном микрорайоне | Новостройки Северного микрорайона Ростова-на-Дону: ЖК, цены на квартиры, планировки и сроки сдачи. Помощь с ипотекой. |
| distTsentr | `/rostov-na-donu/novostroyki/tsentr/` | index (gate) | Новостройки в центре Ростова-на-Дону — цены, ЖК | Новостройки в центре Ростова-на-Дону | Новостройки в центре Ростова-на-Дону: жилые комплексы бизнес- и комфорт-класса, цены, планировки и сроки сдачи. |
| developers | `/zastroyshchiki/` | index | Застройщики Ростова-на-Дону — список и новостройки | Застройщики Ростова-на-Дону | Застройщики Ростова-на-Дону: список компаний, их жилые комплексы, сданные и строящиеся дома, актуальные предложения квартир. |
| developer | `/zastroyshchiki/{slug}/` | index (gate) | {Застройщик} — новостройки в Ростове-на-Дону, цены | Застройщик {Застройщик} | Новостройки застройщика {Застройщик} в Ростове-на-Дону: жилые комплексы, цены на квартиры, планировки и сроки сдачи. |
| development | `/novostroyki/zhk-{slug}/` | index (gate) | ЖК {Название} в Ростове-на-Дону — цены, планировки | ЖК {Название} | ЖК {Название} от {Застройщик}: квартиры от {minPrice} ₽, планировки, срок сдачи {deadline}, район {district}. Ипотека и проверка сделки. |
| property | `/kvartiry/{semantic}-{id}/` | index (gate) | {N}-комнатная квартира {S} м² в {ЖК|район} — {price} ₽ | {N}-комнатная квартира, {S} м² | {N}-комнатная квартира {S} м², этаж {floor}/{floors}, {ЖК|адрес}, Ростов-на-Дону. Цена {price} ₽, планировка и фото. |

Новые районы добавляются строкой в `grammar.config.ts` и в реестре по шаблону `distX`, через PR и только после того, как пройдут content gate.

### **7.2. Услуги и компания**

| pageKey | URL | robots | Title | H1 | Description |
| :---- | :---- | :---- | :---- | :---- | :---- |
| ipoteka | `/ipoteka/` | index | Ипотека на квартиру в Ростове-на-Дону — Союз Застройщиков | Ипотека на квартиру в Ростове-на-Дону | Помощь с ипотекой на новостройку и вторичное жильё в Ростове-на-Дону: подбор программы, подготовка документов и сопровождение до сделки. |
| yurist | `/yurist-po-nedvizhimosti/` | index | Юрист по недвижимости в Ростове-на-Дону — Союз Застройщиков | Юрист по недвижимости в Ростове-на-Дону | Юридическое сопровождение сделок с недвижимостью в Ростове-на-Дону: проверка объекта и документов, ДДУ и договор купли-продажи, регистрация. |
| about | `/o-kompanii/` | index | О компании «Союз Застройщиков» — недвижимость в Ростове | О компании «Союз Застройщиков» | «Союз Застройщиков» — подбор новостроек и квартир в Ростове-на-Дону, ипотека и юридическое сопровождение. Основатель и директор — клиентские данные удалены из шаблона. |
| contacts | `/kontakty/` | index | Контакты «Союз Застройщиков» — офис в Ростове-на-Дону | Контакты | Офис «Союз Застройщиков»: Ростов-на-Дону, [удалено]\. Телефон \[удалено], ежедневно с 9:00 до 18:00. |
| vacancies | `/vakansii/` | index | Вакансии «Союз Застройщиков» — работа в Ростове-на-Дону | Вакансии | Работа в сфере недвижимости в Ростове-на-Дону: актуальные вакансии «Союз Застройщиков», условия и контакты для отклика. |

На странице ипотеки ставки и условия без названия банка не указываются.

### **7.3. Служебные и юридические страницы**

| pageKey | URL | robots | Title | H1 |
| :---- | :---- | :---- | :---- | :---- |
| privacy | `/politika-konfidencialnosti/` | noindex,follow | Политика обработки персональных данных — Союз Застройщиков | Политика обработки персональных данных |
| consent | `/soglasie-na-obrabotku-personalnyh-dannyh/` | noindex,follow | Согласие на обработку персональных данных — Союз Застройщиков | Согласие на обработку персональных данных |
| thanks | `/spasibo/` | noindex,nofollow | Заявка отправлена — Союз Застройщиков | Спасибо, заявка отправлена |
| favorites | `/izbrannoe/` | noindex,nofollow | Избранное — Союз Застройщиков | Избранное |
| search | `/poisk/` | noindex,follow | Поиск по каталогу — Союз Застройщиков | Поиск |
| notFound | 404 | noindex | Страница не найдена — Союз Застройщиков | Страница не найдена |

Оператором персональных данных указывается клиентские данные удалены из шаблона с реквизитами из §5.

### **7.4. Старые URL (`src/project/redirects/legacy.ts`)**

| Старый URL | Что происходит |
| :---- | :---- |
| `/novostroyki-rostova/` | 301 на `/rostov-na-donu/novostroyki/` |
| `/kvartiry-rostova/` | 301 на `/rostov-na-donu/kvartiry/` |
| `/blog/**`, строительство домов, отзывы | 410 |

Когда журнал включат, правило для `/blog/**` пересмотрят через ADR. Соответствие старых объектов новым `publicUrlId` строится через `externalId` и помечено `REQUIRES HUB CONTRACT`.

## **8\. Навигация (`src/project/navigation.config.ts`)**

Ссылки в навигации строятся через grammar. Страницы с `noindex` и выключенные флагом разделы в меню не попадают автоматически.

**Шапка:** логотип, три выпадающих раздела, телефон и CTA «Оставить заявку».

| Раздел | Пункты |
| :---- | :---- |
| Недвижимость | Новостройки, Квартиры |
| Услуги | Ипотека, Юрист |
| О компании | О компании, Контакты, Вакансии |

В мобильной версии структура та же, разделы раскрываются аккордеоном.

**Подвал:**

| Колонка или блок | Содержимое |
| :---- | :---- |
| Недвижимость | Новостройки, Квартиры, Вторичное жильё, Застройщики |
| Услуги | Ипотека, Юрист |
| Компания | О компании, Контакты, Вакансии |
| Документы | Политика ПДн, Согласие на обработку ПДн |
| Реквизиты | ИП клиентские данные удалены из шаблона, ИНН [удалено], адрес, телефон, e-mail, режим работы |
| Нижняя строка | «© {текущий год} Союз Застройщиков» |

**Содержимое страниц:** H1 и один нейтральный контентный блок.

## **9\. Эпики**

| Эпик | Ветка | Что входит | Критерий приёмки |
| :---- | :---- | :---- | :---- |
| L0 Фундамент | `epic/L0-foundation` | Установка стека в репозиторий SourceCraft, Next App Router, структура слоёв по §2, AGENTS.md, DELIVERY\_STATE.yaml, docs/ADR, Zod `env.ts` без DATABASE_URL, `next.config.ts`, guards слоёв, `.sourcecraft/ci.yaml` только с ручными gate (без push/PR) | Локально зелёные `pnpm verify` и `pnpm build`; в зависимостях нет PostgreSQL/Payload/Prisma |
| L1 Данные и снапшот | `epic/L1-data` | Hub-контракты 3.1.2, проверка подписи и хеша, хранилище, карантин, sync-воркер, DTO, `DATA_MODE=local`, фикстура `fixture-sz-rostov` (около 10 районов, 20 застройщиков, 300 квартир), тесты | Зелёные `verify:snapshot` и `verify:contracts` |
| L2 Grammar и SEO | `epic/L2-grammar-seo` | Движок grammar, который читает `grammar.config.ts`, флаги из `features.config.ts` (D13), guards коллизий, legacy-редиректы и 410, SEO\_REGISTRY\_SEED.csv со всеми строками §7, metadata resolver с правилами из `seo.config.ts`, content gate (D4), robots.txt, sitemap, JSON-LD (D12), `site.config.ts` | Зелёные `verify:seo-contracts` и `verify:journal`, у каждой страницы корректные Title, Description и H1 |
| L3 Каркас UI | `epic/L3-skeleton` | `theme.css` с токенами (D16), нейтральные компоненты (шапка, подвал, хлебные крошки, карточки квартиры и ЖК, сетка каталога, фильтры, пагинация, галерея, форма заявки), меню из `navigation.config.ts`, страницы по карте §7 (H1 и один блок), серверный рендер каталогов, Playwright smoke | Зелёный `verify:ui-core`, в коде компонентов нет произвольных цветов, в навигации нет выключенных разделов |
| L4 Заявки, медиа, безопасность | `epic/L4-leads-media-security` | Lead API (direct) на e-mail из §5, формы с согласием на ПДн, Метрика только после согласия (opt-in), image loader, CSP и security headers, health endpoint | Зелёный `verify:security`, тестовая заявка доходит |
| L5 Готовность к шаблону | `epic/L5-template-ready` | Минимальные Dockerfile и compose, exit bundle и exit-mode, бюджеты производительности (LCP ≤ 2,5 с, CLS ≤ 0,1), вторая фикстура `fixture-alt` с другим набором гео, категорий и флагов в рамках Lite Standard, `template:check` (сборка и `verify` на обеих фикстурах без правок платформы), черновик `docs/NEW_PROJECT.md` (какие файлы проектного слоя заменить и в каком порядке), тег `v1.0.0-skeleton` | Зелёные `verify:performance`, `verify:exit-mode`, `template:check` и полный `pnpm verify` |

Порядок выполнения: L0 → L1 → L2 → L3 → L4 → L5. Это HARD-цепочка контрактов, не CI-очередь. Production в цепочку не входит.

### 9.1. Контракты эпиков

Общее для всех эпиков: Source of Truth — этот план + стандарты из §0; `delivery_mode=PR_ONLY`; repository `integrator-p/soyuz-rostov-light-realty`; rollback — закрыть PR / не merge; stop — production, новый секрет, БД/Payload, расширение scope.

### EPIC-01 Фундамент


Outcome: в репозитории есть Next App Router, слои `src/platform` и `src/project`, канонические docs и guards без базы данных.  
Entry: чистый `origin/main`. Exit: `pnpm verify` и `pnpm build` зелёные, нет `payload`/`prisma`/`pg` в зависимостях, нет `DATABASE_URL` в `env.ts`.  
Depends on: нет. Wave: foundation. Critical path: yes.  
Verification: `pnpm verify`, `pnpm build`, `verify:layers`.

### EPIC-02 Данные и снапшот


Outcome: локальный подписанный снапшот Hub 3.1.2 читается из фикстуры, карантин и sync работают без БД.  
Entry: L0 в `main`. Exit: `verify:snapshot` и `verify:contracts` зелёные, `DATA_MODE=local`.  
Depends on: L0 HARD. Wave: data. Critical path: yes.  
Verification: `verify:snapshot`, `verify:contracts`.

### EPIC-03 Grammar и SEO


Outcome: все URL и metadata из §7 строятся grammar+реестром, content gate D4 закрыт, journal=DISABLED доказан.  
Entry: L1 в `main`. Exit: `verify:seo-contracts` и `verify:journal` зелёные; у каждой pageKey есть Title/Description/H1.  
Depends on: L1 HARD. Wave: seo. Critical path: yes.  
Verification: `verify:seo-contracts`, `verify:journal`.

### EPIC-04 Каркас UI


Outcome: страницы §7 серверно рендерятся нейтральным каркасом на токенах `theme.css`.  
Entry: L2 в `main`. Exit: `verify:ui-core` зелёный, Playwright smoke по карте страниц, в компонентах нет произвольных цветов.  
Depends on: L2 HARD. Wave: ui. Critical path: yes.  
Verification: `verify:ui-core`, Playwright smoke.

### EPIC-05 Заявки, медиа, безопасность


Outcome: заявка уходит на e-mail §5 в `LEADS_MODE=direct`, медиа через свой loader, CSP/headers на месте.  
Entry: L3 в `main`. Exit: `verify:security` зелёный; тестовая заявка доходит до проверяемого sink (тест/перехват, не production mailbox).  
Depends on: L3 HARD. External: SMTP/e-mail preflight через project env без Secret Master Payload; fallback — mock sink + запись в OPEN_QUESTIONS; stop — live production mail.  
Wave: leads. Critical path: yes.  
Verification: `verify:security`, lead test.

### EPIC-06 Готовность к шаблону

Outcome: сборка проверяется на двух фикстурах, exit-mode и perf-бюджеты закрыты, тег `v1.0.0-skeleton` стоит, production не выкатывается.  
Entry: L4 в `main`. Exit: `verify:performance`, `verify:exit-mode`, `template:check`, полный `pnpm verify`.  
Depends on: L4 HARD. Wave: template-ready. Critical path: yes.  
Verification: `verify:performance`, `verify:exit-mode`, `template:check`.

Каждый эпик L0–L5 доставлен в `main`. Текущая работа — F1.

### EPIC-F1 Дочистка перед шаблоном

Outcome: `main` можно копировать как шаблон: Title/Description/robots из реестра, реальные DTO на страницах, sitemap, LEAD_TRANSPORT, proxy.ts, Manrope, `pnpm verify`, `template:check` на двух фикстурах.  
Entry: L5 в `main` (`cf96aa5` и новее). Exit: критерии приёмки F1 1–10, `pnpm verify` и `pnpm build` зелёные.  
Branch: `epic/F1-template-hardening`. Один PR. Коммиты `F1.<k>: …`.  
Depends on: L5 HARD. Wave: template-hardening. Critical path: yes.  
Verification: `pnpm verify`, `pnpm build`, `template:check`. Production не входит.

Полное ТЗ F1:

1. Удалить корневые стандарты и старый мастер-план. Канон — `docs/MASTER_PLAN.md` v1.4. AGENTS и DELIVERY_STATE обновить. `@types/node` ^24.
2. `resolvePageMetadata(pageKey, params, snapshot)`: реестр, переменные, скрытие цены D4, canonical со слешем, robots (staging → noindex,nofollow; иначе реестр; FAIL → noindex). Подключить в `page.tsx`, `[...path]/page.tsx`, 404 и spasibo. Нет строки реестра → падает сборка и `verify:seo-contracts`.
3. Данные страниц из DTO; нет объекта → 404; неверный semantic → 308; slug застройщика; gate D4 на ЖК/квартиры/районы/фасет; без «первых 3» в generateStaticParams; ISR каталога запрещён.
4. Sitemap из grammar+снапшота: только indexable + PASS. Staging пустой.
5. `LEAD_TRANSPORT=none|smtp`, SmtpLeadSink, none → 503 `lead_transport_disabled` без хранения.
6. `src/proxy.ts`, UI-тексты в `ui-text.config.ts`, verify:layers без кириллицы в app/platform.
7. Локальный Manrope, Geist удалить, Google Fonts нет.
8. `pnpm verify` последовательный список; CI: pr-light + merge-gate.
9. `PROJECT_FIXTURE`, `template:check` на обеих фикстурах без правок платформы под вторую фикстуру.

---

Каждый эпик заканчивается delivery-task: PR в `main` без merge этим планом, пока владелец отдельно не сказал выводить в main.

### 9.2. OWNER_DECISION_REGISTER

| ID | Вопрос | Решение | Deadline | Status |
| :---- | :---- | :---- | :---- | :---- |
| OD1 | Профиль доставки | `DELIVERY_PROFILE=COMMERCIAL`, `PROJECT_CLASS=COMMERCIAL` | before APPROVAL | DECIDED |
| OD2 | Git/CI | `PR_ONLY`, zero-CI, один ручной gate | before APPROVAL | DECIDED |
| OD3 | База данных | Нет БД/CMS/Payload; старые Payload-секреты не использовать | before APPROVAL | DECIDED |

---

## Architect revision history

| Version | Status | Date | Input | Result |
| :---- | :---- | :---- | :---- | :---- |
| v0 | DRAFT | 2026-10-03 | Owner: взять существующий мастер-план | Основа принята. |
| v1 | APPROVED | 2026-10-03 | Owner: «План утвержден» | Snapshot v1 утверждён. Task Manager import разрешён. Production не разрешён. |
| v1.4 | APPROVED | 2026-10-04 | Owner: ТЗ эпик F1 «Дочистка перед шаблоном» | Канон перенесён в `docs/MASTER_PLAN.md`. F1 — текущий эпик. Production не разрешён. |

### FINAL_AUDIT v1

MASTER PLAN MAP  
Primary goal: чистая `main` REALTY_LITE без CMS/design/production.  
Non-goals: БД, Payload, упаковка шаблона как отдельный продукт, перенос домена, production.  
Epics: L0–L5.  
Data: local Hub snapshot.  
Security: PII в заявках L4, opt-in метрика.  
Infrastructure: Dockerfile/compose в L5 как artifact, не rollout.

FINDING REGISTER: открытых BLOCKER нет. Sequential L0→L5 = HARD, ослабить нельзя: каждый слой читает контракт предыдущего.

Night Run Readiness: READY_WITH_LIMITS — одна критическая цепочка эпиков, параллельных implementation waves нет; внутри эпика tasks могут идти пакетом в одной ветке. Production изолирован.

```text
MASTER PLAN AUDIT
Logic/completeness: blockers 0 / major 0
Architecture/data/security: blockers 0 / major 0
Dependency/autonomy: cycles 0 / hard L1←L0, L2←L1, L3←L2, L4←L3, L5←L4 / waves 1 serial
Executability/evidence: 6/6 epics with acceptance+verification
Owner decisions before approval: 0
Night Run Readiness: READY_WITH_LIMITS
```

