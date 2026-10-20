# Production Readiness & Verification Checklist
## PT. Best Engineer Persada Inventory SaaS

---

## A. Kesiapan Kode & Pengujian Lokal (Sudah Diverifikasi)

- [x] **Frontend Default API URL**: Menggunakan `/api/v1` secara default di `frontend/src/api.js` dan mendukung override `VITE_API_BASE_URL` tanpa duplikasi `/api/v1` atau slash ganda.
- [x] **Frontend Unit Test (`npm --prefix frontend test`)**: Lulus 100%.
- [x] **Frontend Production Build (`npm --prefix frontend run build`)**: Lulus, menghasilkan `frontend/dist/index.html` dan `frontend/dist/assets/index-CjPZ7H9f.js` tanpa hardcoded `localhost` atau `127.0.0.1` pada konfigurasi default.
- [x] **Backend Monorepo Entry Point (`backend/public/index.php`)**: Menormalisasi `SCRIPT_NAME` & `PHP_SELF` saat di-rewrite dari root folder `app/` sehingga route `/api/v1/...` dikenali penuh oleh Laravel.
- [x] **Unauthenticated API Response (`backend/bootstrap/app.php`)**: Mengonfigurasi `$middleware->redirectGuestsTo(fn () => null)` agar request tanpa token selalu mengembalikan HTTP 401 JSON (`{"message":"Unauthenticated."}`), bukan HTTP 500 `Route [login] not defined`.
- [x] **Concurrency & Row Locking (`lockForUpdate`)**:
  - `PurchaseController::confirm()` & `cancel()` memeriksa ulang status `DRAFT` di dalam transaksi setelah `lockForUpdate()`.
  - `InventoryTransactionController` dan `InventoryService` mengunci baris `inventory_stocks` (`lockForUpdate()`) sebelum memodifikasi stok dan moving average cost.
- [x] **Otorisasi Endpoint (`UnitController` & `ProjectProfitabilityController`)**:
  - Mutasi satuan (`/api/v1/units` POST/PUT/DELETE) dibatasi hanya untuk `owner` dan `warehouse`.
  - Pembuatan biaya proyek (`storeExpense`) memvalidasi keberadaan proyek (`findOrFail`) sebelum insert.
- [x] **Backend Automated Test Suite (PHP 8.3.16)**: **94 passed (410 assertions)**.
- [x] **Apache 2.4.62 Live Integration Test**: **35 passed, 0 failed** (mencakup SPA routes, static assets, 404 missing assets, API routing, Bearer header & query string, serta pemblokiran 403 untuk semua file sensitif).

---

## B. Checklist Eksekusi di Server Hostinger (Membutuhkan Akses Server & Kredensial DB)

- [ ] **1. Git Pull di Hostinger**: Tarik commit terbaru di `/home/u860192084/domains/bestengineerpersada.com/public_html/app` (`git pull origin main`).
- [ ] **2. Verifikasi `.htaccess` Root**: Pastikan file `/home/u860192084/domains/bestengineerpersada.com/public_html/app/.htaccess` telah terpasang dari repository.
- [ ] **4. Konfigurasi `backend/.env`**:
  - Salin `backend/.env.production.example` ke `backend/.env`.
  - Isi `DB_PASSWORD` untuk database `u860192084_aplikasi_sulis`.
  - Jalankan `/opt/alt/php83/usr/bin/php artisan key:generate --force`.
  - Set permission `chmod 600 backend/.env` dan `chmod -R 775 backend/storage backend/bootstrap/cache`.
- [ ] **5. Migrasi Database Produksi**:
  - Jalankan `/opt/alt/php83/usr/bin/php artisan migrate --force`.
  - Buat akun Owner/Finance/Warehouse produksi dengan password kuat (jangan jalankan `UserSeeder` default).
- [ ] **6. Verifikasi HTTP Pasca-Deploy (Smoke Test)**:
  - `GET https://app.bestengineerpersada.com/` $\rightarrow$ **200 OK** (HTML SPA).
  - `GET https://app.bestengineerpersada.com/up` $\rightarrow$ **200 OK**.
  - `GET https://app.bestengineerpersada.com/api/v1/products` $\rightarrow$ **401 Unauthorized** JSON.
  - `GET https://app.bestengineerpersada.com/backend/.env` $\rightarrow$ **403 Forbidden**.
  - `GET https://app.bestengineerpersada.com/.git/HEAD` $\rightarrow$ **403 Forbidden**.
  - `GET https://bestengineerpersada.com/` $\rightarrow$ Website utama tetap berjalan normal.
