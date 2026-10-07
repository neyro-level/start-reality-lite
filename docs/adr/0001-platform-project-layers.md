# ADR 0001. Платформа и проектный слой

Status: accepted  
Date: 2026-10-03  
Plan origin: SZ-ROSTOV-LITE-MAIN v1 (archived)  
Current plan: SRL-NEUTRAL-TEMPLATE v1 (`docs/МАСТЕР_ПЛАН_SRL_NEUTRAL.md`)

## Decision

Код делится на два слоя:

- платформа — `src/platform/**`, тонкие маршруты `src/app/**`, `scripts/**`;
- проектный слой — `src/project/**`, `docs/seo/**`, `fixtures/fixture-demo/**`.

Платформа не содержит бренд, город, URL-сегменты и клиентские тексты. Проектный слой читается платформой через конфиги.

## Consequences

- Guards `platform-no-project-literals`, `no-literal-hrefs` и `verify:layers` обязательны.
- Следующий проект меняет только проектный слой.
- База данных и Payload в этот контур не входят.
