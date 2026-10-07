# Что не входит в шаблон следующего проекта

- Production deploy, `INDEXING_MODE=public`, живой AMS Hub и production SMTP.
- Отдельный template repository — только по команде владельца после `reference-baseline-template-v3`.
- Playwright как merge-gate.
- Реализация Search / Favorites, journal content, `service` / `dual` / `crm` leads.
- PostgreSQL, Payload, Prisma, CMS, `DATABASE_URL`.
- Секреты, `.env`, spool keys, PKCS8 кроме TEST-фикстур.
- `.beads`, локальные worktree, Cursor plan file.
- Клиентские медиа-оригиналы и внешние CDN-аккаунты.
