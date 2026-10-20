# Panduan Deployment Hostinger — PT. Best Engineer Persada Inventory SaaS

Dokumen ini menjelaskan arsitektur dan langkah-langkah deployment produksi pada Hostinger untuk domain **`https://app.bestengineerpersada.com`** tanpa mengganggu website utama **`https://bestengineerpersada.com`**.

---

## 1. Arsitektur Deployment Aktual

| Komponen | Nilai / Lokasi |
|---|---|
| **Domain Produksi** | `https://app.bestengineerpersada.com` |
| **Document Root Subdomain** | `/home/u860192084/domains/bestengineerpersada.com/public_html/app` |
| **Backend (Laravel 13)** | `/home/u860192084/domains/bestengineerpersada.com/public_html/app/backend` |
| **Frontend Build (Vite SPA)** | `/home/u860192084/domains/bestengineerpersada.com/public_html/app/frontend/dist` |
| **PHP CLI Binary** | `/opt/alt/php83/usr/bin/php` |
| **Composer Binary** | `/usr/local/bin/composer` |
| **Database & User MySQL** | `u860192084_aplikasi_sulis` |
| **API Base URL Frontend** | `/api/v1` (Satu domain, tidak bergantung pada CORS lintas domain) |

---

## 2. Alur Routing & Proteksi Keamanan (`.htaccess`)

Karena document root subdomain `app.bestengineerpersada.com` terkunci ke folder `app/` yang berisi monorepo Git, file `.htaccess` utama ditempatkan di `/home/u860192084/domains/bestengineerpersada.com/public_html/app/.htaccess` (tersedia dari kandidat teruji `scratch/candidate_root_htaccess.txt`):

1. **Preservasi Header**: Meneruskan header `Authorization: Bearer <token>` dan `X-XSRF-Token` ke PHP-FPM/LSAPI.
2. **Proteksi Ketat (HTTP 403 Forbidden)**:
   - Memblokir semua file/folder tersembunyi (`.git`, `.env`, `.gitignore`, `.htaccess`).
   - Memblokir manifest dan skrip internal (`artisan`, `composer.json`, `composer.lock`, `package.json`, `phpunit.xml`, file `*_test.js`, dll.).
   - Memblokir akses HTTP langsung ke `backend/*` dan `frontend/*` menggunakan pemeriksaan `%{THE_REQUEST}` sehingga hanya internal rewrite server yang diizinkan masuk ke `backend/public/index.php` dan `frontend/dist/`.
3. **Routing API Laravel (`/api/v1/*` & `/up`)**:
   - Diteruskan secara internal ke `backend/public/index.php`.
   - `backend/public/index.php` menormalisasi `SCRIPT_NAME` dan `PHP_SELF` ketika dipanggil dari root monorepo sehingga Symfony Request mengenali path `/api/v1/...` secara utuh.
4. **Static Assets & SPA Fallback**:
   - `/` dan route navigasi SPA (`/dashboard`, `/purchasing`, `/inventory`, `/reports`, dll.) menyajikan `frontend/dist/index.html`.
   - File fisik yang ada di `frontend/dist/` (seperti `/assets/index-*.js`) dilayani langsung dengan MIME type yang sesuai.
   - Permintaan ke asset statis yang tidak ditemukan (`/assets/missing.js`, `*.css`, `*.png`) mengembalikan **HTTP 404 murni**, bukan HTML `index.html`.

---

## 3. Langkah Deployment di Server Hostinger (SSH)

> **Peringatan:** Jangan pernah menaruh password atau `APP_KEY` di dalam Git repository.

### Langkah 1 — Tarik Kode Terbaru (Sudah Termasuk Root `.htaccess`)
```bash
cd /home/u860192084/domains/bestengineerpersada.com/public_html/app
git pull origin main
ls -la .htaccess
```

### Langkah 2 — Siapkan `backend/.env` Produksi
```bash
cd /home/u860192084/domains/bestengineerpersada.com/public_html/app/backend
cp .env.production.example .env
```
Edit `backend/.env` menggunakan editor server (`nano .env`) dan isi `DB_PASSWORD` dengan password database MySQL Hostinger yang sebenarnya. Pastikan:
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://app.bestengineerpersada.com`
- `DB_DATABASE=u860192084_aplikasi_sulis`
- `DB_USERNAME=u860192084_aplikasi_sulis`

### Langkah 3 — Pasang Dependensi & Generate Application Key
```bash
cd /home/u860192084/domains/bestengineerpersada.com/public_html/app/backend
/opt/alt/php83/usr/bin/php /usr/local/bin/composer install --no-dev --optimize-autoloader
/opt/alt/php83/usr/bin/php artisan key:generate --force
```

### Langkah 4 — Set Permission Direktori Writable Laravel
```bash
chmod -R 775 storage bootstrap/cache
chmod 600 .env
```

### Langkah 5 — Verifikasi Koneksi Database & Jalankan Migrasi
```bash
/opt/alt/php83/usr/bin/php artisan migrate:status
/opt/alt/php83/usr/bin/php artisan migrate --force
```
> **Penting:** Jangan menjalankan `UserSeeder` bawaan di produksi karena menggunakan password contoh. Buat akun produksi secara eksplisit melalui `artisan tinker` dengan password yang kuat.

### Langkah 6 — Optimasi Cache Produksi Laravel
```bash
/opt/alt/php83/usr/bin/php artisan config:cache
/opt/alt/php83/usr/bin/php artisan route:cache
```

---

## 4. Alternatif Struktur Di Luar Webroot (Opsional Masa Depan)

Apabila di kemudian hari ingin memisahkan kode sumber sepenuhnya dari folder `public_html/app`:
1. Pindahkan repo ke `/home/u860192084/apps/stock-produk-sulis`.
2. Salin isi `frontend/dist/*` ke `/home/u860192084/domains/bestengineerpersada.com/public_html/app/`.
3. Buat wrapper `api/index.php` yang me-require `/home/u860192084/apps/stock-produk-sulis/backend/public/index.php`.
