# Desain v2 — Technical design (Part B + Part C)

Source of truth for the v2 rebuild of aplikasi-sulis. Agents: follow this file and AGENTS.md exactly.

# PART B — Technical specification (single source of truth)

Conventions: everything in this part is normative. Briefs must reference section numbers (e.g. "B5.3"). If a brief and this document disagree, this document wins unless the brief explicitly says "overrides B…".

## B1. Repository layout (branch `v2`)
Branch `v2` is created from `main`; `main` stays untouched (it is what runs on the live server). Layout kept monorepo-style so the existing Hostinger root `.htaccess` keeps working:

```
/                      repo root (= Hostinger subdomain document root)
├── .htaccess          REUSED from main (routing + 403 protections); updated only in T6.04
├── AGENTS.md          NEW: coding rules for the agent (see B14)
├── docs/              deployment + UAT docs
├── backend/           Laravel 13 app (API only)
│   ├── app/{Enums,Http/{Controllers/Api/V1,Middleware,Requests,Resources},Models,Services,Support}
│   ├── database/{migrations,factories,seeders}
│   ├── lang/id/       Indonesian validation + messages
│   ├── routes/api.php
│   └── tests/{Feature,Unit}
└── frontend/          React SPA (Vite)
    ├── src/
    └── dist/          build output — NOT committed (gitignored); built and uploaded at deploy
```

- **Build output:** `frontend/dist/` is gitignored on `v2`. At deploy, Bulik builds from the exact deployed commit SHA and uploads `dist/` via rsync/scp (keeps commits clean, build reproducible). Agent tasks must **never** commit `dist/`.
- **Clean start (T1.01):** remove old `backend/app/Http/Controllers/*`, `backend/app/Models/*` (except `User.php`), `backend/app/Services/*`, `backend/app/Providers/AuthServiceProvider.php`, all `backend/database/migrations/2026_*`, old factories/seeders (except `UserFactory`), `backend/tests/Feature/*`, `backend/tests/live_*.php`, `backend/test_role.php`, `frontend/*` (entirely), `scratch/`, root `*_test.js`, `e2e_browser_suite.js`, root `package.json`, `backend/AGENTS.md`, `backend/CLAUDE.md` (Laravel Boost bootstrap text). Keep composer.json/lock (Laravel 13.x, Sanctum 4), `config/`, `bootstrap/`, `public/` (incl. SCRIPT_NAME normalisation in `public/index.php`), root `.htaccess`.
- Ensure `backend/storage/framework/{cache/data,sessions,views}/.gitignore` exist (fixes the old `/up` 500).
- Remove `laravel/legacy-factories`; move `phpunit/phpunit` to require-dev.
- Migrations are a **fresh set** (no production data). Deploying v2 will need `migrate:fresh` on the prod DB (`u860192084_aplikasi_sulis`) after a backup and with **explicit user approval at deploy time**.
- API prefix stays `/api/v1` (`.htaccess` routes `/api/*` to Laravel).

## B2. Global technical rules
- PHP 8.3 (server: `/opt/alt/php83/usr/bin/php`), Laravel 13.x, MySQL/MariaDB in prod, SQLite in-memory for tests.
- `APP_TIMEZONE=Asia/Jakarta`, `APP_LOCALE=id`, `APP_FALLBACK_LOCALE=en`. All timestamps stored in app timezone and returned as ISO-8601 **with offset** (`2026-10-26T15:30:00+07:00`); `date`-only fields returned as `YYYY-MM-DD`.
- **Money = integer rupiah** (`BIGINT`/`unsignedBigInteger`, signed `bigInteger` for deltas). No cents anywhere.
- **Quantity = `DECIMAL(15,3)`**, always > 0 in requests, max 3 decimals.
- **Average cost = `DECIMAL(18,4)`**, informational/display only (see B4).
- All arithmetic on qty/money uses `App\Support\Dec` helper (wraps `bcmath`, scale 6) — never PHP floats. Rounding: **half-up to integer rupiah** via `Dec::roundRupiah()`. `bcmath` extension required (Bulik verifies on server, read-only, in T1.02).
- API JSON: money → JSON integer; qty → **string** with 3 decimals (`"12.500"`); avg cost → string with 4 decimals. Frontend formats.
- Excel read/write: `openspout/openspout` (v4; light, no GD needed).
- No other new composer/npm packages without a brief naming them.

## B3. Data model
All tables: `id BIGINT UNSIGNED AUTO_INCREMENT PK`; "ts" = `created_at`,`updated_at`. **No soft deletes anywhere** — master data uses `is_active`; ledger tables are append-only. FKs `RESTRICT` on delete unless stated.

### B3.1 users
| column | type | notes |
|---|---|---|
| name | varchar(100) | |
| email | varchar(150) unique | login, stored lowercase |
| password | varchar(255) | bcrypt |
| role | varchar(20) | enum `App\Enums\Role`: `owner`,`gudang`,`finance`; **NOT NULL, no default** |
| is_active | boolean default true | |
| last_login_at | timestamp null | |
| ts | | |
(Laravel default `password_reset_tokens` and `sessions` tables dropped; keep `cache`, `jobs` defaults.)

### B3.2 personal_access_tokens — Sanctum default migration.

### B3.3 categories — `name varchar(100) unique`, `is_active bool default true`, ts.
### B3.4 units — `name varchar(50) unique` (e.g. "meter"), `symbol varchar(20) unique` (e.g. "m"), `is_active`, ts.

### B3.5 products
| column | type | notes |
|---|---|---|
| sku | varchar(50) unique | uppercase, `[A-Z0-9\-\._/]` |
| name | varchar(150) | index |
| category_id | FK categories | |
| unit_id | FK units | |
| min_stock | decimal(15,3) default 0 | low-stock threshold |
| notes | varchar(500) null | |
| is_active | bool default true | |
| ts | | |

### B3.6 stock_balances (one row per product; created in the same transaction as the product)
| column | type | notes |
|---|---|---|
| product_id | FK products **unique** | |
| qty | decimal(15,3) default 0 | never < 0 |
| stock_value | bigInteger default 0 | rupiah, never < 0; must be 0 when qty = 0 |
| avg_cost | decimal(18,4) default 0 | = stock_value/qty when qty>0; keeps last value when qty becomes 0 ("last known cost") |
| has_cost | bool default false | true once any priced inflow (opening/purchase) happened |
| updated_at | timestamp | |

### B3.7 suppliers — `name varchar(150)`, `phone varchar(30) null`, `address varchar(300) null`, `notes varchar(500) null`, `is_active`, ts. Index name.

### B3.8 projects
| column | type | notes |
|---|---|---|
| code | varchar(30) unique | optional on create → auto `PRJ-` + zero-padded id (4) |
| name | varchar(150) | |
| client_name | varchar(150) null | |
| location | varchar(200) null | |
| contract_value | unsignedBigInteger default 0 | rupiah (hidden from gudang) |
| start_date, end_date | date null | |
| status | varchar(20) | enum `ProjectStatus`: `aktif`,`selesai`,`batal`; default `aktif` |
| notes | varchar(500) null | |
| created_by | FK users | |
| ts | | index status |

### B3.9 project_costs (other project costs; Finance/Owner)
`project_id FK projects`, `cost_date date`, `description varchar(200)`, `amount unsignedBigInteger` (>0), `created_by FK users`, `updated_by FK users null`, ts. Editable/deletable by Owner/Finance; every change audit-logged (B8). Index (project_id, cost_date).

### B3.10 purchases
| column | type | notes |
|---|---|---|
| number | varchar(30) unique | `PB-` + zero-padded id (6), set right after insert |
| supplier_id | FK suppliers | |
| purchase_date | date | |
| invoice_no | varchar(50) null | supplier invoice |
| status | varchar(20) | enum `PurchaseStatus`: `draft`,`diterima`,`batal` |
| total_value | unsignedBigInteger default 0 | sum of line_total |
| notes | varchar(500) null | |
| created_by | FK users | |
| received_by / received_at | FK users null / timestamp null | |
| cancelled_by / cancelled_at / cancel_reason | FK null / ts null / varchar(300) null | |
| ts | | index status, purchase_date |

### B3.11 purchase_items
`purchase_id FK purchases (cascade delete — only drafts can be deleted)`, `product_id FK`, `qty decimal(15,3)`, `unit_price unsignedBigInteger`, `line_total unsignedBigInteger` (= roundRupiah(qty×unit_price)), ts. Unique (purchase_id, product_id).

### B3.12 stock_transactions (header of a stock-out or return document)
| column | type | notes |
|---|---|---|
| number | varchar(30) unique | `BK-`/`RT-` + zero-padded id (6) |
| type | varchar(20) | enum `StockTransactionType`: `project_out`,`project_return` |
| project_id | FK projects | required |
| person_name | varchar(100) | taker (out) / returner (return) — required |
| transaction_date | date | |
| notes | varchar(500) null | |
| status | varchar(20) | `posted`,`reversed` |
| reversed_by / reversed_at / reverse_reason | FK null / ts null / varchar(300) null | |
| created_by | FK users | |
| ts | | index (project_id,type), transaction_date |

### B3.13 stock_movements (THE LEDGER — append-only, never updated or deleted)
| column | type | notes |
|---|---|---|
| product_id | FK products | |
| type | varchar(30) | enum `MovementType` (B4.1) |
| qty_change | decimal(15,3) | signed (+ in, − out), never 0 |
| value_change | bigInteger | signed rupiah |
| unit_cost | decimal(18,4) | = abs(value_change)/abs(qty_change), display only |
| qty_after | decimal(15,3) | balance qty after this movement |
| value_after | bigInteger | balance value after |
| avg_cost_after | decimal(18,4) | balance avg after |
| project_id | FK projects null | set for project_out, project_return and their reversals |
| stock_transaction_id | FK null | |
| purchase_item_id | FK null | |
| stock_opname_item_id | FK null | |
| reverses_movement_id | FK stock_movements null **unique** | only for type `reversal` |
| movement_date | date | business date |
| notes | varchar(500) null | |
| created_by | FK users | |
| created_at | timestamp | (no updated_at) |
Indexes: (product_id,id), (project_id,product_id), (type), (movement_date), (stock_transaction_id), (purchase_item_id).

### B3.14 stock_opnames
`number varchar(30) unique` (`SO-`+id 6), `opname_date date`, `status varchar(20)` enum `OpnameStatus`: `draft`,`menunggu_persetujuan`,`selesai`,`batal`; `notes`, `created_by`, `submitted_by null`, `submitted_at null`, `posted_by null`, `posted_at null`, `cancelled_by null`, `cancelled_at null`, ts.

### B3.15 stock_opname_items
`stock_opname_id FK (cascade)`, `product_id FK`, `system_qty decimal(15,3)` (snapshot when item added; **recomputed at posting**), `counted_qty decimal(15,3) null`, `diff_qty decimal(15,3) null` (set at posting), `notes varchar(300) null`, ts. Unique (stock_opname_id, product_id).

### B3.16 audit_logs
`user_id FK users null`, `action varchar(60)` (e.g. `product.updated`), `subject_type varchar(60) null` (short name e.g. `product`), `subject_id bigint null`, `summary varchar(300)` (Indonesian, human-readable), `changes json null` (`{"before":{…},"after":{…}}`, money fields included — owner-only view), `ip varchar(45) null`, `created_at`. Index (subject_type,subject_id), (user_id), (created_at).

### B3.17 Future (do NOT build now; design must allow)
- Sales: `sales`, `sale_items`, `MovementType::SaleOut`, `products.sale_price`.
- Project material requirements (`project_requirements`: project_id, product_id, planned_qty) — informational only, **never** reserves stock.

## B4. Stock ledger & costing

### B4.1 Movement types (`App\Enums\MovementType`)
| type | qty sign | created by flow | value rule |
|---|---|---|---|
| `opening` | + | Opening stock (B5.6) | entered unit cost |
| `purchase_in` | + | Purchase received | purchase line_total |
| `project_out` | − | Stock-out document | average-cost out rule |
| `project_return` | + | Return document | project issue-cost rule |
| `opname_in` | + | Opname posting, diff>0 | diff × balance.avg_cost (last known; 0 if never) |
| `opname_out` | − | Opname posting, diff<0 | average-cost out rule |
| `reversal` | opposite of original | Reverse document / cancel received purchase | exact negation (with guard B4.4) |

### B4.2 Single entry point
`App\Services\StockLedger::apply(array $lines, MovementContext $ctx): Collection<StockMovement>` is **the only code allowed to write `stock_movements` or `stock_balances`**. Inside the caller's `DB::transaction`:
1. Sort lines by `product_id` ascending (prevents deadlocks).
2. For each line: `StockBalance::where('product_id', …)->lockForUpdate()->first()`.
3. Compute value_change per rule, validate (B4.5), update balance, insert movement with *_after fields.
4. Any rule violation throws `App\Exceptions\BusinessRuleException` (HTTP 422, Indonesian message) → the whole transaction rolls back.

Let balance before = Q (qty), V (value), A (avg). Line qty (absolute) = q.

### B4.3 Formulas
- **Inflow with known value** (`opening`, `purchase_in`), v = entered value: `Q'=Q+q`, `V'=V+v`, `A'=V'/Q'`, `has_cost=true`.
- **Average-cost out rule** (`project_out`, `opname_out`): require `q ≤ Q` else 422 "Stok {name} tidak cukup. Sisa stok: {Q} {unit}.". `v = (q == Q) ? V : roundRupiah(V × q / Q)`; `Q'=Q−q`, `V'=V−v`, `A' = Q'>0 ? V'/Q' : A` (keep last known). value_change = −v. (Taking the whole balance always takes the whole value → no residue.)
- **Project issue-cost rule** (`project_return`): for (project P, product X) over all non-reversed movements: `netQ = −Σ qty_change`, `netV = −Σ value_change` where `project_id=P, product_id=X, type in (project_out, project_return, reversal)`. Require `q ≤ netQ` else 422 "Jumlah pengembalian melebihi barang yang diambil proyek ini ({netQ} {unit}).". `v = (q == netQ) ? netV : roundRupiah(netV × q / netQ)`; `Q'=Q+q`, `V'=V+v`, `A'=V'/Q'`. → A return is valued at the project's own average issue cost, not at today's average.
- **opname_in:** `v = roundRupiah(q × A)` (A = last known avg, possibly 0); `Q'=Q+q`, `V'=V+v`, `A' = Q'>0 ? V'/Q' : A`.
- **Invariant after every line:** `Q' ≥ 0`, `V' ≥ 0`, `Q'==0 ⇒ V'==0`.

### B4.4 Reversal rule
Reversal of movement M: `qty_change = −M.qty_change`, `value_change = −M.value_change`, copies M's project_id, `reverses_movement_id = M.id`. Guards: M not itself a `reversal`; M not yet reversed (unique index); resulting Q' ≥ 0 else 422 "Tidak bisa dibatalkan: stok {name} sudah terpakai. Sisa stok {Q}.". **Value guard** (only when M was an inflow, e.g. reversing a `purchase_in`): if `Q'==0` then `value_change = −V`; else if `V − M.value_change < 0` then `value_change = −V`. Keeps invariants; difference (if any) is written in `notes` ("penyesuaian nilai karena harga rata-rata").
Reversing a whole `stock_transaction` = reversing each of its movements in one DB transaction, then header `status=reversed`. Reversing a `project_return` additionally requires the project's netQ after reversal ≥ 0 (always true mathematically). `opening` and opname movements are **not** reversible (correct via a new opname).

### B4.5 Validation inside the ledger
Product must be `is_active` (except reversals and opname). Project rules: `project_out` requires status `aktif`; `project_return` requires `aktif` or `selesai`. Ledger order = insertion order (id); `movement_date` is a business date only and does not re-sort costing (H8).

### B4.6 Derived values (never stored separately)
- **Project material cost** = `−Σ value_change` over all movements with `project_id = P` (automatically includes returns and reversals).
- **Project net qty per product** = `−Σ qty_change` grouped by product, same filter.
- **Project profit** = `contract_value − material_cost − Σ project_costs.amount`. **Margin %** = `contract_value>0 ? round(profit / contract_value × 100, 1) : null`.
- **Cost price history (product)** = the product's movements of type `opening`/`purchase_in` (with supplier and purchase number), showing unit_cost and avg_cost_after.

### B4.7 Hand-calculated reference scenario (MUST be a feature test, T4.02)
Product "Kabel NYM 2x1.5" (unit meter):
| # | action | value | Q after | V after | A after |
|---|---|---|---|---|---|
| 1 | purchase_in 100 @ 10.000 | +1.000.000 | 100 | 1.000.000 | 10.000 |
| 2 | purchase_in 100 @ 13.000 | +1.300.000 | 200 | 2.300.000 | 11.500 |
| 3 | project_out A 50 | −575.000 | 150 | 1.725.000 | 11.500 |
| 4 | project_out B 80 | −920.000 | 70 | 805.000 | 11.500 |
| 5 | project_return A 10 (netQ 50, netV 575.000) | +115.000 | 80 | 920.000 | 11.500 |
| 6 | purchase_in 20 @ 14.000 | +280.000 | 100 | 1.200.000 | 12.000 |
| 7 | project_out B 30 | −360.000 | 70 | 840.000 | 12.000 |

Project A: contract 10.000.000; material 460.000; other costs 1.500.000 → **profit 8.040.000, margin 80,4 %**.
Project B: contract 5.000.000; material 1.280.000; other costs 0 → **profit 3.720.000, margin 74,4 %**.
Conservation check: purchases 2.580.000 − net material 1.740.000 = stock value 840.000.

Rounding scenario (T3.01 unit test): buy 3 @ 1.000 and 1 @ 1.001 → Q 4, V 4.001. Out 1 → v = round(1.000,25) = 1.000 → V 3.001. Out 3 (all) → v = 3.001 → V 0.

## B5. Business flows (backend)
### B5.1 Purchase
1. Finance/Owner `POST /purchases` → `draft` (items 1..50 distinct products, qty>0, unit_price ≥ 0 integer). `line_total` and `total_value` computed server-side.
2. Draft can be updated/deleted by Finance/Owner.
3. `POST /purchases/{id}/receive` (Gudang/Owner): lock purchase row, re-check status=draft (else 422 "Pembelian ini sudah diproses."), `StockLedger::apply` with one `purchase_in` line per item (value = line_total, movement_date = purchase_date), set `status=diterima`, `received_by`, `received_at`.
4. `POST /purchases/{id}/cancel` (body: reason): draft → `batal` (Finance/Owner). diterima → Owner only: reversal of all its `purchase_in` movements (B4.4), then `batal`. Already `batal` → 422.

### B5.2 Stock-out (Barang Keluar) — `POST /stock-outs` (Gudang/Owner)
Body: `project_id`, `person_name`, `transaction_date`, `notes?`, `items[1..50]{product_id, qty}` (distinct products). Creates `stock_transactions` (type project_out) + movements in one DB transaction. Response shows items with qty; values only for Owner/Finance (B7).

### B5.3 Return (Pengembalian)
`GET /projects/{id}/issued-items` → per product net qty taken (netQ > 0 only; Gudang sees no values). `POST /stock-returns` — same body shape as stock-out; `person_name` = returner.

### B5.4 Reverse document — `POST /stock-transactions/{id}/reverse` (Owner), body `reason` (required, 5..300 chars). Fails if already `reversed`.

### B5.5 Stock opname
Create (Gudang/Owner) `POST /stock-opnames` `{opname_date, notes}` → draft. `PUT /stock-opnames/{id}/items` `{items:[{product_id, counted_qty, notes?}]}` **replaces** item list (draft only); `system_qty` snapshot from balance for display. `POST /stock-opnames/{id}/submit` (Gudang/Owner; needs ≥1 item, all counted_qty filled ≥ 0) → `menunggu_persetujuan`. `POST /stock-opnames/{id}/post` (Owner): lock, re-check status, for each item re-read balance under lock, `system_qty := Q`, `diff = counted − Q`; diff>0 → `opname_in`, diff<0 → `opname_out`, 0 → no movement; status `selesai`. Owner may `POST /stock-opnames/{id}/reject` (back to draft, with note). `POST /stock-opnames/{id}/cancel` from draft/menunggu_persetujuan.

### B5.6 Opening stock (Stok Awal) — `POST /opening-stocks` (Owner/Finance)
`{movement_date, items:[{product_id, qty, unit_cost}]}`. Allowed only for products with **no movements at all** (else 422 "Stok awal {sku} sudah pernah diisi atau barang sudah punya transaksi."). Value = roundRupiah(qty × unit_cost). Also via Excel import (B5.7).

### B5.7 Excel import
- `GET /imports/products/template`, `GET /imports/opening-stocks/template` → .xlsx with header row + one example row.
- `POST /imports/products` (Owner/Gudang), multipart `file` (.xlsx, max 2 MB, max 2.000 data rows). Columns: `sku*`, `nama*`, `kategori*`, `satuan*`, `stok_minimum`, `catatan`. Unknown categories/units are **auto-created** (unit symbol = name lowercased, trimmed to 20). Existing sku → **update** name/category/unit/min_stock/notes.
- `POST /imports/opening-stocks` (Owner/Finance). Columns: `sku*`, `jumlah*`, `harga_modal*`, `tanggal`.
- Both: validate **all rows first**; if any row invalid → nothing saved, 422 with `errors: [{row, column, message}]` (max 100 errors, Indonesian). Success → `{created, updated, skipped}`. One audit log entry per import.

## B6. Permission matrix
O = Owner, G = Gudang, F = Finance. ✓ allowed; "✓*" allowed with money fields hidden (B7); — = 403 "Anda tidak memiliki akses untuk tindakan ini."

| Endpoint group | O | G | F |
|---|---|---|---|
| auth (login/logout/me/password) | ✓ | ✓ | ✓ |
| users CRUD, reset password | ✓ | — | — |
| categories, units: list | ✓ | ✓ | ✓ |
| categories, units: create/update | ✓ | ✓ | — |
| products: list/show | ✓ | ✓* | ✓ |
| products: create/update, import products | ✓ | ✓ | — |
| products/{id}/movements (ledger) | ✓ | ✓* | ✓ |
| products/{id}/cost-history | ✓ | — | ✓ |
| opening stocks (manual + import) | ✓ | — | ✓ |
| suppliers: list/create/update | ✓ | — | ✓ |
| projects: list/show | ✓ | ✓* | ✓ |
| projects: create/update/status | ✓ | — | ✓ |
| projects/{id}/issued-items | ✓ | ✓* | ✓ |
| project costs CRUD | ✓ | — | ✓ |
| purchases: list/show | ✓ | ✓* (only `draft`,`diterima`) | ✓ |
| purchases: create/update/delete draft | ✓ | — | ✓ |
| purchases: receive | ✓ | ✓ | — |
| purchases: cancel draft | ✓ | — | ✓ |
| purchases: cancel received | ✓ | — | — |
| stock-outs, stock-returns: create | ✓ | ✓ | — |
| stock-transactions: list/show | ✓ | ✓* | ✓ |
| stock-transactions: reverse | ✓ | — | — |
| stock-opnames: list/show/create/items/submit/cancel | ✓ | ✓* | view only |
| stock-opnames: post/reject | ✓ | — | — |
| reports: project-profit, stock-value, cost-history | ✓ | — | ✓ |
| reports: movements, project-usage | ✓ | ✓* | ✓ |
| dashboard | ✓ | ✓* | ✓ |
| audit-logs | ✓ | — | — |

Implementation: route middleware `role:owner,finance` (`App\Http\Middleware\EnsureRole`); every route declares its roles explicitly in `routes/api.php` (no defaults). Object rules (e.g. Gudang cannot see `batal` purchases) live in the controller/query. `User::canSeeMoney(): bool` = role !== gudang.

## B7. Money hiding for Gudang (hard rule)
- Every response goes through an API Resource (`app/Http/Resources`); **no controller returns a model or array directly**.
- Money fields are wrapped in `$this->when($request->user()->canSeeMoney(), …)` so the **key is absent** (not null) for Gudang.
- Money fields: products/stock_balances: `avg_cost`, `stock_value`, `has_cost`; movements: `value_change`, `unit_cost`, `value_after`, `avg_cost_after`; purchases: `total_value`; purchase items: `unit_price`, `line_total`; projects: `contract_value` and any profit fields; stock transactions: `total_value` (computed); opname items: none; dashboard: any rupiah figure; purchases embedded for Gudang: supplier `{id,name}` only.
- Test helper `assertNoMoneyKeys($json)` recursively asserts none of these keys exist: `avg_cost, stock_value, has_cost, value_change, unit_cost, value_after, avg_cost_after, total_value, unit_price, line_total, contract_value, amount, material_cost, profit, margin_percent`. Used in a test that calls **every** G-accessible endpoint as Gudang (T3.08, T5.04).
- Frontend also hides money columns for Gudang, but **the API is the guarantee**.

## B8. Audit log
`App\Services\AuditLogger::log(string $action, ?Model $subject, string $summary, ?array $before = null, ?array $after = null)` — called **inside** the same DB transaction as the change. Actions (fixed list, enum-like constants in `App\Support\AuditAction`):
`auth.login`, `auth.login_failed` (email only, no password), `auth.logout`, `auth.password_changed`, `user.created`, `user.updated`, `user.password_reset`, `user.deactivated`, `user.activated`, `category.created/updated`, `unit.created/updated`, `product.created/updated`, `product.imported`, `supplier.created/updated`, `project.created/updated`, `project.status_changed`, `project_cost.created/updated/deleted`, `purchase.created/updated/deleted/received/cancelled`, `opening_stock.created`, `opening_stock.imported`, `stock_out.created`, `stock_return.created`, `stock_transaction.reversed`, `opname.created/updated/submitted/rejected/posted/cancelled`.
`GET /audit-logs` (Owner) with filters user_id, action prefix, subject_type, date_from/date_to; paginated, newest first. `summary` example: "Barang keluar BK-000012 ke proyek PRJ-0003 (3 barang) oleh Budi".

## B9. API conventions & endpoint list
### B9.1 Conventions
- Base `/api/v1`; JSON only; header `Authorization: Bearer {token}`.
- List responses: `{ "data": [...], "meta": { "current_page", "last_page", "per_page", "total" } }`; query `page`, `per_page` (default 20, max 100), `search`, `sort` (whitelisted per endpoint), `direction` (`asc|desc`). Simple lookups accept `?all=1` (returns up to 500 active items, no pagination; for dropdowns).
- Single responses: `{ "data": {...} }`. Create → 201.
- Errors: `{ "message": "…", "errors": { "field": ["…"] } }` (422 validation); business-rule 422 has only `message`. 401 "Sesi Anda telah berakhir. Silakan masuk kembali."; 403 "Anda tidak memiliki akses untuk tindakan ini."; 404 "Data tidak ditemukan."; 405 "Metode tidak diizinkan."; 429 "Terlalu banyak percobaan. Coba lagi dalam {n} detik."; 500 "Terjadi kesalahan pada server. Silakan coba lagi." (no stack trace when APP_DEBUG=false). DB unique violations must never surface — validate `unique` in FormRequests.
- Validation messages from `lang/id/validation.php` + Indonesian attribute names (`attributes` array).
- Each endpoint has a FormRequest class `{Action}{Resource}Request`.

### B9.2 Endpoints
Auth: `POST /auth/login` `{email,password}` → `{data:{token, expires_at, user:{id,name,email,role}}}`; errors 422 "Email atau password salah." (same message for unknown email or inactive user; separate 403 "Akun Anda dinonaktifkan. Hubungi Owner." **only after correct password**). `POST /auth/logout` → 204 (revokes current token). `GET /auth/me` → `{data:user}`. `PUT /auth/password` `{current_password,password,password_confirmation}` → 204, revokes user's other tokens.
Users (O): `GET /users`, `POST /users` `{name,email,role,password}`, `PUT /users/{id}` `{name,email,role,is_active}`, `POST /users/{id}/reset-password` → `{data:{temporary_password}}` (12 chars, shown once; revokes tokens). Rules: cannot deactivate/demote the **last active owner** nor yourself; deactivation revokes all tokens.
Master: `GET|POST /categories`, `PUT /categories/{id}`; same for `/units`, `/suppliers`. `GET /products` (filters `search` sku/name, `category_id`, `is_active`, `low_stock=1` = qty ≤ min_stock) — each item includes `stock:{qty, avg_cost*, stock_value*, has_cost*}`, category, unit. `GET /products/{id}`, `POST /products`, `PUT /products/{id}` (sku, name, category_id, unit_id, min_stock, notes, is_active). `GET /products/{id}/movements` (filters type, date range) — ledger rows with project `{id,code,name}`, document number, `created_by:{id,name}`. `GET /products/{id}/cost-history`.
Projects: `GET /projects` (filters status, search), `GET /projects/{id}` (+ summary `{material_cost*, other_costs*, profit*, margin_percent*}` for O/F), `POST /projects`, `PUT /projects/{id}`, `GET /projects/{id}/issued-items`, `GET|POST /projects/{id}/costs`, `PUT|DELETE /projects/{id}/costs/{costId}`.
Stock: `POST /opening-stocks`; `GET|POST /purchases`, `GET|PUT|DELETE /purchases/{id}`, `POST /purchases/{id}/receive`, `POST /purchases/{id}/cancel` `{reason}`; `POST /stock-outs`; `POST /stock-returns`; `GET /stock-transactions` (filters type, project_id, product_id, date_from, date_to, search number/person), `GET /stock-transactions/{id}` (header + lines), `POST /stock-transactions/{id}/reverse`; `GET|POST /stock-opnames`, `GET /stock-opnames/{id}`, `PUT /stock-opnames/{id}/items`, `POST /stock-opnames/{id}/{submit|post|reject|cancel}`.
Imports: as B5.7.
Reports: `GET /reports/project-profit` (filter status; list all projects with contract, material, other, profit, margin + totals), `GET /reports/projects/{id}/materials` (per product: qty out, qty returned, net qty, net value*), `GET /reports/stock-value` (per product qty, avg, value + total), `GET /reports/movements` (all movements; filters product, project, type, user, date range), `GET /reports/cost-history?product_id=`.
Dashboard: `GET /dashboard` → role-specific payload. O/F: totals (stock value, # low-stock products, # active projects, # purchases waiting to be received, this month material cost), top 5 projects by profit, last 10 movements. G: low-stock list, purchases waiting to be received, last 10 stock transactions (no money).
Audit: `GET /audit-logs`.

### B9.3 Example shapes
Product item (Owner/Finance):
```json
{"id":1,"sku":"KBL-NYM-2X15","name":"Kabel NYM 2x1.5","category":{"id":1,"name":"Kabel"},
 "unit":{"id":1,"name":"meter","symbol":"m"},"min_stock":"50.000","is_active":true,
 "stock":{"qty":"115.000","avg_cost":"11500.0000","stock_value":1322500,"has_cost":true},
 "is_low_stock":false}
```
Same for Gudang: `"stock":{"qty":"115.000"}` — no other stock keys.

Stock-out request:
```json
{"project_id":3,"person_name":"Budi (teknisi)","transaction_date":"2026-10-26","notes":"Lantai 2",
 "items":[{"product_id":1,"qty":"25"},{"product_id":7,"qty":"4"}]}
```
Response 201:
```json
{"data":{"id":12,"number":"BK-000012","type":"project_out","status":"posted",
 "project":{"id":3,"code":"PRJ-0003","name":"Gedung X"},"person_name":"Budi (teknisi)",
 "transaction_date":"2026-10-26","created_by":{"id":2,"name":"Andi"},"created_at":"2026-10-26T15:30:00+07:00",
 "lines":[{"product":{"id":1,"sku":"KBL-NYM-2X15","name":"Kabel NYM 2x1.5","unit_symbol":"m"},"qty":"25.000","value":287500}],
 "total_value":330000}}
```
(For Gudang `value` and `total_value` are absent.)

## B10. Validation rules (common)
- `qty`: required, numeric, regex `^\d{1,12}(\.\d{1,3})?$`, > 0.
- `unit_price` / `unit_cost` / `amount` / `contract_value`: integer, 0..999.999.999.999 (`amount` > 0).
- Business dates (`transaction_date`, `purchase_date`, `movement_date`, `opname_date`, `cost_date`): `date_format:Y-m-d`, ≤ today, ≥ today − 30 days (H8). `project.start_date/end_date`: unrestricted, end ≥ start.
- `person_name`: required, string, 2..100, trimmed. `notes` ≤ 500. `reason` 5..300.
- `items`: array 1..50; `items.*.product_id` exists, distinct, active (except opname).
- `email`: email:rfc, unique (case-insensitive; lowercased before validate). `password`: min 8, at least 1 letter and 1 digit.
- `sku`: required, max 50, uppercase on save, unique.
- Strings trimmed (Laravel default middleware); HTML is never rendered server-side.

## B11. Authentication & security
- Sanctum personal access tokens; `config/sanctum.php` `expiration = 10080` (7 days). `POST /auth/login` deletes the user's tokens older than 7 days, then creates a token named `spa`. Command `sanctum:prune-expired --hours=24` listed in docs for a cron (optional).
- Rate limits (`AppServiceProvider::boot`): `login` 5/min per (lowercased email + IP) and 30/hour per IP; `api` 120/min per user; `imports` 10/hour per user.
- Inactive users: middleware `EnsureUserIsActive` on all authenticated routes → 401 and token deleted.
- CORS: not needed (same origin); `config/cors.php` allowed_origins = [] in production, `http://localhost:5173` in local.
- Production `.env`: `APP_DEBUG=false`, `LOG_LEVEL=warning`, `SESSION_DRIVER=array` (stateless API), `CACHE_STORE=database` (rate limiter).
- No seeders in production; command `php artisan app:create-owner` (interactive: name, email, password) creates the first owner (T6.05).
- Security headers in `.htaccess` (T6.04): `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`; `X-Content-Type-Options: nosniff`; `Referrer-Policy: same-origin`; `X-Frame-Options: DENY`.

## B12. Frontend (React)
### B12.1 Stack (exact)
Vite (latest 6/7 line available at T1.07), **React 19**, **JavaScript (JSX)** (no TypeScript — keep the agent simple), **Tailwind CSS v4** via `@tailwindcss/vite` (**no CDN**), `react-router` v7 (declarative `BrowserRouter` mode), `@tanstack/react-query` v5, `@headlessui/react` v2 (Dialog, Combobox, Menu, Listbox, Transition), `lucide-react` (icons), `@fontsource-variable/inter` (self-hosted font), ESLint (flat config) with `eslint-plugin-react-hooks` + rule banning `dangerouslySetInnerHTML`/`innerHTML`, Vitest (unit tests for `lib/format.js` only). No other UI kits, no axios, no state library, no CDN anything.
Dev: `npm run dev` on 5173 with Vite proxy `/api` → `http://127.0.0.1:8000`. Production: same origin `/api/v1`.

### B12.2 Structure
```
frontend/src/
  main.jsx                 QueryClient + AuthProvider + BrowserRouter
  App.jsx                  route table (B12.4)
  styles/index.css         @import "tailwindcss"; @theme tokens (B12.6)
  lib/api.js               fetch wrapper: base '/api/v1', JSON, Bearer, error normalisation, 401 → logout
  lib/format.js            formatRupiah, formatQty, parseQty("12,5"→"12.5"), formatDate, formatDateTime (id-ID, Asia/Jakarta)
  lib/constants.js         ROLES, ROLE_LABELS, STATUS_LABELS, MOVEMENT_TYPE_LABELS (Indonesian)
  lib/permissions.js       can(user, action) — mirrors B6; canSeeMoney(user)
  auth/AuthProvider.jsx, auth/useAuth.js, auth/RequireAuth.jsx, auth/RequireRole.jsx
  components/ui/           design system (B12.7) — one component per file
  components/layout/       AppShell.jsx, Sidebar.jsx, MobileTopBar.jsx, MobileDrawer.jsx, NavItems.js
  features/<area>/         api.js (react-query hooks) + pages/*.jsx + components/*.jsx
     areas: auth, dashboard, products, master (categories, units, suppliers), projects, purchases,
            stock-out, returns, opening-stock, opname, reports, users, audit, account
```

### B12.3 Auth & token storage
- Token in `localStorage` key `sulis_token`; user in React state, re-fetched via `/auth/me` on load. Chosen for simplicity (cookie SPA session adds CSRF/session config that is error-prone for the agent). XSS mitigations are therefore **mandatory**: no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` (ESLint rule + grep check in every acceptance); all user text rendered as JSX text only; no third-party scripts/fonts/CDNs at runtime; CSP header (B11); 7-day token expiry and server-side revocation.
- On 401: clear token, redirect to `/masuk?alasan=sesi` with toast "Sesi Anda telah berakhir. Silakan masuk kembali."

### B12.4 Routes (Indonesian paths)
| path | page | roles |
|---|---|---|
| `/masuk` | Login | public |
| `/` | Dashboard | all |
| `/barang`, `/barang/:id` | Product list / detail (tabs: Riwayat; Riwayat Harga Modal for O/F) | all |
| `/barang/impor` | Import products (+ opening stock tab for O/F) | O,G (+F for opening tab) |
| `/stok-awal` | Opening stock form | O,F |
| `/barang-keluar`, `/barang-keluar/baru`, `/barang-keluar/:id` | Stock-out list / form / detail (printable) | all view; O,G create |
| `/pengembalian`, `/pengembalian/baru`, `/pengembalian/:id` | Returns | all view; O,G create |
| `/pembelian`, `/pembelian/baru`, `/pembelian/:id`, `/pembelian/:id/ubah` | Purchases | per B6 |
| `/stok-opname`, `/stok-opname/:id` | Opname | O,G (F view) |
| `/proyek`, `/proyek/:id` | Projects (detail tabs: Ringkasan, Material, Biaya Lain, Laba) | all (G: Ringkasan + Material qty only) |
| `/pemasok` | Suppliers | O,F |
| `/laporan` | Reports hub: Laba Proyek, Nilai Stok, Pergerakan Barang, Riwayat Harga Modal | O,F (G: Pergerakan Barang only) |
| `/pengaturan/kategori`, `/pengaturan/satuan` | Categories, units | O,G (F view) |
| `/pengguna` | Users | O |
| `/log-aktivitas` | Audit log | O |
| `/akun` | My account / change password | all |
| `*` | 404 page "Halaman tidak ditemukan" | |

### B12.5 Navigation
- **Desktop (≥ 1024px):** fixed left sidebar 256px, dark navy (`--color-sidebar`), logo/company name, grouped items (Utama, Transaksi, Data, Laporan, Admin) filtered by `permissions.js`, user card + logout at bottom.
- **Mobile (< 1024px):** top bar (hamburger → drawer with same items, page title, user menu). For Gudang: fixed bottom action bar with 3 big buttons "Barang Keluar", "Pengembalian", "Stok". Content padding 16px; every tap target ≥ 44px.

### B12.6 Design tokens (Tailwind v4 `@theme`)
- Font: Inter Variable; numbers use `tabular-nums`.
- Type scale (size/line-height): page title 24/32 semibold (mobile 20/28); section 18/28 semibold; body 14/20; small 12/16; KPI number 28/36 semibold.
- Colors: neutral `slate` (bg `#F8FAFC`, surface white, border `#E2E8F0`, text `#0F172A`, muted `#64748B`); primary `#1D4ED8` (blue-700), hover `#1E40AF`, soft `#EFF6FF`; sidebar `#0B1220`, sidebar active `#1E293B` with primary left bar; success `#047857`/soft `#ECFDF5`; warning `#B45309`/soft `#FFFBEB`; danger `#B91C1C`/soft `#FEF2F2`; info `#0369A1`/soft `#F0F9FF`.
- Radius: inputs/buttons 8px, cards 12px, modals 16px. Shadow: cards `shadow-sm`; modals `shadow-xl`. Spacing 4px scale; card padding 20px (mobile 16px); page max width 1280px.
- Status badges: Aktif/Diterima/Selesai(opname) → success; Draft/Menunggu → warning; Batal/Dibatalkan → danger; Selesai(proyek) → info; low stock → danger soft with icon.
- Movement type labels/colors: Stok Awal (slate), Pembelian Masuk (success), Keluar ke Proyek (primary), Pengembalian (info), Koreksi Opname + (success), Koreksi Opname − (warning), Pembatalan (danger).

### B12.7 Component list (`components/ui/`)
`Button` (variants primary/secondary/ghost/danger; sizes sm/md/lg; `loading` prop disables + spinner), `IconButton`, `Input`, `NumberInput` (qty; accepts comma; `inputMode="decimal"`), `MoneyInput` (shows thousands dots, stores integer), `Textarea`, `Select` (Headless Listbox), `ComboBox` (searchable product/project picker, async), `DateInput` (native date), `FormField` (label + hint + error), `Checkbox`, `Switch`, `Card`, `PageHeader` (title, subtitle, actions, breadcrumb), `StatCard` (KPI with icon and optional trend text), `Badge`, `StatusBadge` (maps enums → label/color from constants.js), **`DataTable`** (props: `columns[{key, header, render, align, hideOnMobile, mobileLabel}]`, `rows`, `loading`, `emptyState`, `onRowClick`; **≥ md: table; < md: stacked card per row** with first column as title and the rest as label: value pairs), `Pagination`, `SearchInput` (debounced 300 ms), `FilterBar`, `Tabs`, `Modal`, `ConfirmDialog` (requires typed reason when `requireReason`), `Drawer`, `Toast` + `useToast`, `EmptyState`, `ErrorState` (with "Coba lagi"), `Skeleton`, `Money` (renders "Rp 1.322.500"; renders nothing if value undefined → Gudang-safe), `Qty` (formats with unit symbol).
A dev-only `/_ui` page shows every component (excluded from production nav).
Forms: submit buttons disable during request (prevent double submit); server 422 errors mapped to field errors; success → toast + navigate.
Stock-out form is mobile-first: big project ComboBox (aktif only), person name, date (default today), item list with per-row ComboBox product + qty + "sisa stok" hint + remove; "+ Tambah barang"; sticky bottom "Simpan Barang Keluar"; confirmation modal summarising items before submit.

### B12.8 Copy & formatting
All UI text Indonesian (no English labels). Rupiah: `Rp 1.322.500`. Qty: up to 3 decimals, comma separator, with unit (`12,5 m`). Dates: `26 Okt 2026`; datetimes `26 Okt 2026, 15.30 WIB`.

## B13. Testing strategy
- **Backend:** PHPUnit feature tests with `RefreshDatabase` on SQLite in-memory. Every task adds tests; suite must stay green (`php artisan test`). Factories for every model. Required test files (minimum):
  - `AuthTest` (login ok/wrong/inactive, throttle 429 after 5, token expiry, logout revokes, password change)
  - `UserManagementTest` (owner-only, last-owner protection, reset revokes tokens)
  - `PermissionMatrixTest` — data provider over **every route × role**, asserting B6 status (2xx vs 403). The route list in the test must equal `php artisan route:list` (test fails if a route is missing from the matrix).
  - `MoneyHidingTest` — every G-accessible endpoint called as Gudang with `assertNoMoneyKeys`.
  - `StockLedgerTest` (unit-ish) — every B4.3 formula, invariants, rounding scenario, reversal guards.
  - `PurchaseFlowTest` (draft→receive→stock/avg, double-receive blocked, cancel draft, cancel received owner + reversal guard)
  - `StockOutFlowTest` (required project/person, insufficient stock 422 with whole document rolled back, inactive/batal project rejected)
  - `ReturnFlowTest` (valued at issue cost, exceeding netQ rejected, selesai project allowed)
  - **`ProjectTraceabilityTest` (A/B scenario):** stock bought for project A; Gudang user "Andi" issues 80 m to project **B** with taker "Budi"; assert `GET /reports/movements?project_id=B` and `GET /stock-transactions?project_id=B` show product, 80 m, Budi, Andi, date, document number; assert project A shows nothing for it; assert product ledger shows the out movement; remaining stock correct.
  - **`ProjectProfitScenarioTest`:** exactly the B4.7 table (assert every Q/V/A after each step, then project A/B profit and margin).
  - `OpnameFlowTest`, `OpeningStockTest`, `ImportTest` (valid file, invalid rows → nothing saved, update existing sku), `AuditLogTest` (key actions write logs), `ErrorMessagesTest` (401/403/404/422 Indonesian).
- **Frontend:** `npm run lint` (0 errors), `npm run test` (Vitest for `lib/format.js`), `npm run build` succeeds; grep: no `dangerouslySetInnerHTML|innerHTML|cdn\.` in `src/`.
- **Bulik verification per task:** fresh clone, full test suite, build, and manual smoke via headless Chromium at 1280 and 390 for UI tasks (screenshots). Agent reports are not accepted as proof.

## B14. AGENTS.md (root) — rules the agent must follow (written in T1.01)
1. Only touch files listed in the task. If another file seems to need a change, stop and report.
2. Never add packages, routes, columns or features not in the task.
3. Naming: snake_case DB/JSON, camelCase JS variables, PascalCase components/classes; enum values exactly as in B3; Indonesian for user-facing text, English for code identifiers.
4. Every stock change goes through `StockLedger::apply`; every response through a Resource; every mutation writes an AuditLogger entry.
5. Money = integer rupiah; qty = decimal string; no floats for money/qty math (use `Dec`).
6. Run `php artisan test` (and `npm run lint && npm run build` when frontend files changed) before committing; all must pass.
7. One task = one commit with message `T{id}: {title}`. Push to `v2` only. Never merge, never deploy, never commit `.env`, `frontend/dist`, `vendor`, `node_modules`.
8. No `dangerouslySetInnerHTML`, no CDN links, no `console.log` left in code.

## B15. Reuse from old code (`main`)
| Reuse | How |
|---|---|
| `backend/composer.json/lock`, `config/*`, `bootstrap/app.php` (JSON exceptions, `redirectGuestsTo(fn () => null)`), `public/index.php` (SCRIPT_NAME normalisation), `public/.htaccess` | Keep as-is; edit only what B2/B11 require |
| Root `.htaccess` (Authorization header pass-through, 403 rules, `/api` + `/up` rewrite, static file serving, 404 for missing assets, SPA fallback rule 7 — already compatible with BrowserRouter) | Keep; T6.04 trims old filenames from rule 2b, adds security headers, re-checks rules |
| `docs/HOSTINGER_DEPLOYMENT.md` | Rewrite in T6.04 to v2 flow (dist uploaded, not committed) |
| Weighted-average idea + `lockForUpdate` + "re-check status after lock" pattern (`InventoryService`, `PurchaseController::confirm/cancel`) | Re-implemented properly in `StockLedger` (integer money, bcmath, single entry point) |
| Stock-opname flow (`StockOpnameController`) | Concept reused, with added submit/approve step and system qty recomputed at posting |
| Test ideas (`PurchaseTest` double-confirm, `StockOpnameTest` rollback, `ProductionHardeningTest` 401 JSON) | Rewritten into B13 test files |
| Old frontend visual style (slate + blue, cards) | Inspiration only; all code rewritten in React |
| **Not reused** | Old controllers/models/migrations, `STOCK_OUT`-without-project type, warehouse cost entry, `innerHTML` UI, Tailwind CDN, scratch/test scripts, Laravel Boost AGENTS/CLAUDE files |


## B16. Fase 1 implementation notes (decided 26 Okt 2026, verified on a test clone)
These notes fix small details B1–B15 left open. If B16 and an earlier section differ, **B16 wins** for Fase 1.
- **Migration file names.** Keep `0001_01_01_000001_create_cache_table.php` and `0001_01_01_000002_create_jobs_table.php` unchanged. `0001_01_01_000000_create_users_table.php` creates only `users` (no `remember_token`, no `email_verified_at`, no `password_reset_tokens`, no `sessions`). `0001_01_01_000003_create_personal_access_tokens_table.php` (Sanctum standard). `0001_01_01_000004_create_audit_logs_table.php`. Every later migration uses prefix `2026_11_01_0000NN_` (NN = 01, 02, … in task order).
- **Versions (verified to install together on Node 20.19 / npm 11, 26 Okt 2026):** `vite@^8`, `@vitejs/plugin-react@^6`, `tailwindcss@^4`, `@tailwindcss/vite@^4`, `react@^19`, `react-dom@^19`, `react-router@^7` (pinned to 7 — v8 exists, do not use), `@tanstack/react-query@^5`, `@headlessui/react@^2`, `lucide-react@^1`, `@fontsource-variable/inter@^5`, `eslint@^10`, `@eslint/js@^10`, `eslint-plugin-react-hooks@^7`, `eslint-plugin-react-refresh@^0.5`, `globals@^17`, `vitest@^5`. This replaces "Vite 6/7" in B12.1. Backend: Laravel 13, PHP ≥ 8.3 with `bcmath`, Sanctum 4, PHPUnit 11 (moved to `require-dev`), `laravel/legacy-factories` removed.
- **Rounding.** `Dec::roundRupiah()` rounds half away from zero (2.5 → 3, −2.5 → −3). For positive amounts this equals "half-up".
- **Error JSON.** 422 `message` = the first validation error message (Indonesian), plus `errors`. Any other HTTP error without a specific mapping → "Permintaan tidak dapat diproses.". 429 → "Terlalu banyak percobaan. Coba lagi dalam {n} detik." (n from `Retry-After`).
- **UserResource fields:** `id, name, email, role, role_label, is_active, last_login_at, created_at` (dates ISO-8601 with +07:00).
- **List responses** use `App\Support\ApiPaginator`: `per_page` default 20, max 100; body `{data:[…], meta:{current_page,last_page,per_page,total}}`.
- **AuditLogger signature:** `log(string $action, ?Model $subject, string $summary, ?array $before = null, ?array $after = null, ?User $actor = null)`. Unknown action constants throw `InvalidArgumentException`. `subject_type` = snake_case class basename (e.g. `user`).
- **User rules (messages verbatim):** changing own role or deactivating self → 422 "Anda tidak bisa menonaktifkan atau mengubah peran akun Anda sendiri."; leaving zero active owners → 422 "Harus ada minimal satu Owner yang aktif." (defensive guard; not reachable through the API because of the self rule, so it is not tested).
- **Frontend design tokens (Tailwind `@theme` names):** colors `canvas, surface, line, ink, muted, primary, primary-hover, primary-soft, sidebar, sidebar-active, success, success-soft, warning, warning-soft, danger, danger-soft, info, info-soft`; radius `control, card, modal`. Never use raw hex in components; never build class names dynamically (Tailwind cannot see them) — use fixed maps.
- **Fase 1 menu:** Dashboard (all roles), Pengguna (owner), Akun Saya (user menu). Gudang bottom bar shows items flagged `bottomBar: true`; none in Fase 1, so it is hidden until Fase 3.
- **Demo users (local seeder only, never production):** `owner@sulis.test`, `gudang@sulis.test`, `finance@sulis.test`, password `Password123`.
- **PermissionMatrixTest convention:** one `MATRIX` constant `['METHOD uri' => [allowed roles]]`. Test 1 asserts MATRIX keys equal all registered `api/*` routes (no HEAD/OPTIONS). Test 2 checks each role gets 403 when not allowed and not-403 when allowed, and a guest gets 401 everywhere except login. Every later task that adds a route must add it to MATRIX.
- **Frontend token key:** `localStorage['sulis_token']`. 401 on any request except login → token cleared, redirect to `/masuk?alasan=sesi`.

---

# PART C — Task breakdown (one task ≈ one Gemini Flash session ≈ one commit)

Format: **ID — Title.** Goal. *Files* (main). **Accept** (must pass, in addition to full test suite + lint/build for FE tasks).

## Fase 1 — Foundation (11 tasks)
- **T1.01 — Branch v2 cleanup & AGENTS.md.** Create `v2`, delete old code per B1, fix storage dirs, write root `AGENTS.md` (B14), clean composer deps. *Files:* deletions, `.gitignore`, `AGENTS.md`, `backend/composer.json`, `backend/storage/**/.gitignore`. **Accept:** `composer install`, `php artisan test` (example test), `/up` returns 200 locally; no old files remain (checked against list).
- **T1.02 — Locale, timezone, error JSON.** Asia/Jakarta, `lang/id/validation.php` + attributes, Indonesian JSON errors (B9.1), `BusinessRuleException`, `Dec` helper + unit tests. *Files:* `config/app.php`, `bootstrap/app.php`, `lang/id/*`, `app/Exceptions/BusinessRuleException.php`, `app/Support/Dec.php`, tests. **Accept:** `ErrorMessagesTest` (401/403/404/405/422), `DecTest` (roundRupiah half-up, mul/div scale).
- **T1.03 — Users table, Role enum, factories.** B3.1, `App\Enums\Role`, `User::canSeeMoney()`, `isOwner()`, local-only seeder (3 users). *Files:* users migration, `app/Enums/Role.php`, `app/Models/User.php`, `UserFactory`, `DatabaseSeeder`. **Accept:** migrate fresh OK; seeder no-op in production (test).
- **T1.04 — Auth API.** Login/logout/me/password, token expiry, rate limiter, `EnsureUserIsActive`. *Files:* `AuthController`, FormRequests, `UserResource`, `AppServiceProvider`, `config/sanctum.php`, `routes/api.php`. **Accept:** `AuthTest`.
- **T1.05 — Role middleware + audit log infrastructure.** `EnsureRole`, `audit_logs` migration/model, `AuditLogger`, `AuditAction`; login events logged. *Files:* middleware, migration, model, services, `bootstrap/app.php`. **Accept:** `AuditLogTest` (login/login_failed), role middleware test.
- **T1.06 — Users management API.** B9.2 Users. *Files:* `UserController`, requests, routes, tests. **Accept:** `UserManagementTest`; `PermissionMatrixTest` skeleton created with routes so far.
- **T1.07 — Frontend scaffold.** Vite + React 19 + Tailwind v4 + ESLint + Vitest + fontsource + proxy; `styles/index.css` tokens (B12.6); `lib/format.js` + tests; `lib/constants.js`. *Files:* `frontend/*` config, `src/main.jsx`, `src/App.jsx`, `src/styles/index.css`, `src/lib/*`. **Accept:** lint/test/build pass; format tests cover rupiah/qty/parseQty/date.
- **T1.08 — UI components part 1.** Button, IconButton, Input, NumberInput, MoneyInput, Textarea, Select, DateInput, FormField, Checkbox, Switch, Badge, StatusBadge, Card, Money, Qty. *Files:* `components/ui/*`, `/_ui` page. **Accept:** build; `/_ui` screenshot 1280/390 reviewed by Bulik.
- **T1.09 — UI components part 2.** DataTable (table→cards), Pagination, SearchInput, FilterBar, Tabs, Modal, ConfirmDialog, Drawer, Toast, EmptyState, ErrorState, Skeleton, PageHeader, StatCard, ComboBox. *Files:* `components/ui/*`. **Accept:** `/_ui` shows all; DataTable renders cards at 390.
- **T1.10 — API client, auth, layout, login page.** `lib/api.js`, AuthProvider, RequireAuth/RequireRole, `permissions.js`, AppShell/Sidebar/MobileTopBar/Drawer/Gudang bottom bar, `/masuk`, empty dashboard, 404 page. **Accept:** manual login for each role shows only that role's menu; 401 redirect works; screenshots.
- **T1.11 — Users page & My Account.** `/pengguna` (list, add, edit, reset password with show-once modal, deactivate), `/akun`. **Accept:** smoke as owner; G/F get 403 page.

## Fase 2 — Master data (9 tasks)
- **T2.01 — Categories & units API.** B3.3–3.4, resources, audit. **Accept:** CRUD tests + matrix rows.
- **T2.02 — Products API + stock_balances.** B3.5–3.6 (balance row created with product), list filters, `ProductResource` with money hiding, `assertNoMoneyKeys` helper. **Accept:** product tests; Gudang no money keys.
- **T2.03 — Suppliers API.** B3.7. **Accept:** tests + matrix.
- **T2.04 — Projects API.** B3.8, auto code, status changes, `contract_value` hidden for G (summary fields come in T4.02). **Accept:** tests + matrix.
- **T2.05 — Product Excel import API.** openspout, template download, all-or-nothing validation (B5.7). **Accept:** `ImportTest` (products) with fixture files.
- **T2.06 — FE: categories, units, suppliers pages.** **Accept:** CRUD via UI smoke; mobile cards.
- **T2.07 — FE: products list + form + detail shell.** List with low-stock badge and filters, create/edit modal, detail page (stock card; Riwayat tab placeholder). **Accept:** smoke as O and G (G sees no money).
- **T2.08 — FE: product import page.** Upload, per-row error table, success summary, template download. **Accept:** valid + invalid fixture smoke.
- **T2.09 — FE: projects list + form + detail shell.** Status badge, contract value (O/F only). **Accept:** smoke O/F/G.

## Fase 3 — Stock in & out core (12 tasks)
- **T3.01 — Ledger tables + StockLedger service.** B3.12–3.13, `MovementType`, `StockLedger::apply`, all B4.3/B4.4 formulas, rounding scenario. *Files:* migrations, models, `app/Services/StockLedger.php`, `MovementContext`. **Accept:** `StockLedgerTest` (formulas, invariants, rounding, reversal guards).
- **T3.02 — Opening stock API (manual + Excel).** B5.6, B5.7 opening import. **Accept:** `OpeningStockTest`, import test.
- **T3.03 — Purchases API (draft, receive, cancel draft).** B3.10–3.11, B5.1 steps 1–3; Gudang view rules. **Accept:** `PurchaseFlowTest` part 1, money hiding.
- **T3.04 — Cancel received purchase (owner reversal).** B5.1 step 4 + B4.4 value guard. **Accept:** `PurchaseFlowTest` part 2.
- **T3.05 — Stock-out API + stock-transactions list/show.** B5.2. **Accept:** `StockOutFlowTest`.
- **T3.06 — Returns API + issued-items.** B5.3. **Accept:** `ReturnFlowTest`.
- **T3.07 — Reverse stock transaction API.** B5.4. **Accept:** reversal tests (out and return), audit entry.
- **T3.08 — Product ledger endpoint + traceability.** `GET /products/{id}/movements`, `GET /reports/movements`. **Accept:** `ProjectTraceabilityTest` (A/B), `MoneyHidingTest` covering all G endpoints so far.
- **T3.09 — FE: Barang Keluar form + list + detail (printable).** B12.7 stock-out form spec. **Accept:** smoke at 390 as Gudang: create 2-item document, insufficient-stock error shown inline, print view.
- **T3.10 — FE: Pengembalian form + list.** Project → issued items → qty. **Accept:** smoke as G.
- **T3.11 — FE: Pembelian pages.** Finance create/edit draft with MoneyInput; Gudang "Terima Barang" view without prices; owner cancel received. **Accept:** smoke F→G→O.
- **T3.12 — FE: product detail ledger tab + Stok Awal page + owner "Batalkan" action.** **Accept:** smoke; ConfirmDialog requires reason.

## Fase 4 — Cost & profit (6 tasks)
- **T4.01 — Project costs API.** B3.9. **Accept:** tests + audit + matrix.
- **T4.02 — Profit calculations & project summary.** `ProjectProfitService`, summary in `GET /projects/{id}`, `GET /reports/project-profit`, `GET /reports/projects/{id}/materials`. **Accept:** **`ProjectProfitScenarioTest` (B4.7 exact numbers)**.
- **T4.03 — Stock value & cost-history reports API.** `GET /reports/stock-value`, `GET /reports/cost-history`, `GET /products/{id}/cost-history`. **Accept:** tests with known numbers; G 403.
- **T4.04 — FE: project detail tabs.** Ringkasan, Material (net per product), Biaya Lain (CRUD), Laba. **Accept:** smoke; numbers match B4.7 scenario seeded via API.
- **T4.05 — FE: Laporan hub.** Laba Proyek, Nilai Stok, Pergerakan Barang (filters), Riwayat Harga Modal. **Accept:** smoke O/F; G sees only Pergerakan without money.
- **T4.06 — Dashboard API + FE per role.** B9.2 Dashboard. **Accept:** tests (G payload no money); screenshots 1280/390 per role.

## Fase 5 — Additional controls (5 tasks; T5.05 optional/later)
- **T5.01 — Stock opname API.** B5.5. **Accept:** `OpnameFlowTest` (submit, post recomputes system qty, ±diff movements, reject, cancel).
- **T5.02 — FE: Stock opname pages.** List, mobile-friendly counting page (search + qty per row), submit, owner approve/reject. **Accept:** smoke G→O.
- **T5.03 — Audit log completeness + page.** Ensure every B8 action logged; `GET /audit-logs`; `/log-aktivitas` with filters, human summaries, before/after diff view. **Accept:** `AuditLogTest` covers every action constant.
- **T5.04 — Permission & money-hiding final sweep.** Complete `PermissionMatrixTest` (every route × role) and `MoneyHidingTest` (every G route). **Accept:** both list every route; test fails if a route is unlisted.
- **T5.05 — (Optional, later) Project material requirements.** B3.17, informational planned vs actual. Only if user approves.

## Fase 6 — Polish & handover (6 tasks)
- **T6.01 — Excel export of reports.** Laba Proyek, Nilai Stok, Pergerakan (respects filters; G export without money). **Accept:** tests on file contents.
- **T6.02 — Print views.** Bukti Barang Keluar, Bukti Pengembalian, Bukti Penerimaan (no prices for G) with print CSS. **Accept:** print-preview screenshots.
- **T6.03 — UI polish pass.** Empty/error/loading states everywhere, copy review (all Indonesian), 390px audit fixes, keyboard focus states. **Accept:** Bulik screenshot checklist for every route at 1280/390.
- **T6.04 — Deploy config & docs.** Root `.htaccess` (B11 headers, trim rule 2b), prod `.env.example`, `docs/DEPLOY_V2.md` (backup, migrate:fresh warning, build-and-upload dist, smoke list), `docs/UAT.md` (client test script). **Accept:** local Apache/LiteSpeed-like check by Bulik; docs reviewed.
- **T6.05 — `app:create-owner` command + production hardening checks.** **Accept:** command test; `APP_DEBUG=false` hides traces (test).
- **T6.06 — Final regression & UAT fixes buffer.** Only fixes from Bulik's verification/UAT list. **Accept:** full suite + all smoke green.

Deploy to `app.bestengineerpersada.com` is **not an agent task**: Bulik does it after explicit user approval, with backup first.

**Total: 49 tasks** (F1 11, F2 9, F3 12, F4 6, F5 5 incl. 1 optional, F6 6).
