# Что не входит в копию шаблона

Этот репозиторий — шаблон. Копировать чистый HEAD, не историю git.

Не копировать и не тащить в новый клиентский checkout:

- `.beads`, локальные worktree, Cursor plan file;
- секреты, `.env`, spool keys, PKCS8 кроме TEST-фикстур;
- клиентские медиа-оригиналы и внешние CDN-аккаунты;
- production deploy, `INDEXING_MODE=public`, живой AMS Hub и production SMTP.

Вне scope шаблона как продукта:

- Playwright как merge-gate;
- реализация Search / Favorites, journal content, `service` / `dual` / `crm` leads;
- PostgreSQL, Payload, Prisma, CMS, `DATABASE_URL`.
