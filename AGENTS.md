# AGENTS.md — rules for every coding agent working on this repo

The design is in `docs/desain-v2.md` (Part B = specification, Part C = task list). It is the single source of truth.

## Start of every task
1. `git status` must show a clean working tree. If not: STOP and report.
2. Work only on branch `v2`: `git checkout v2` then `git pull origin v2`.
3. Check the previous task's commit exists (the prompt tells you which). If not: STOP and report.

## Rules (from docs/desain-v2.md B14)
1. Do only the current task. Touch only the files the task lists.
2. Never add packages, routes, columns or features not in the task.
3. Naming: snake_case for DB and JSON, camelCase for JS variables, PascalCase for components and classes. Enum values exactly as in B3. Indonesian for user-facing text, English for code identifiers.
4. Every stock change goes through `StockLedger::apply`; every API response through a Resource; every mutation writes an `AuditLogger` entry.
5. Money = integer rupiah. Qty = decimal string. No floats for money or qty math (use `App\Support\Dec`).
6. Run `php artisan test` (and `npm run lint`, `npm test`, `npm run build` when frontend files changed) before committing. All must pass.
7. One task = one commit with message `T{id}: {title}`. Push to `v2` only. Never merge, never deploy, never commit `.env`, `frontend/dist`, `vendor`, `node_modules`.
8. No `dangerouslySetInnerHTML`, no `innerHTML`, no CDN links, no `console.log` left in code.

## Extra rules
- Copy code and Indonesian texts from the task prompt EXACTLY. Do not rename, translate, shorten or "improve" them.
- If a command fails or a check does not match the expected output: try to fix it only inside the files the task allows. If it still fails: STOP, do not commit, and report the exact error.
- Never run commands against a remote server or a remote database. Never use `ssh`, `scp`, `ftp`, or deploy scripts.
- `backend/.env` must use `DB_CONNECTION=sqlite`. If it points to MySQL or any remote database: STOP and report.
- Never use `git push --force`, `git reset --hard`, `git rebase`, or `git merge`. Never touch branch `main`.
- When the task is done, reply with the report format given in the task prompt.
