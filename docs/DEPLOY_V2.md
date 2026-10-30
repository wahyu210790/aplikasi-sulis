# Deploy v2 ke Hostinger — app.bestengineerpersada.com

Dokumen ini hanya **menjelaskan langkah-langkah**. Deploy sungguhan **tidak boleh** dijalankan oleh agen koding,
dan baru boleh dilakukan setelah **persetujuan tertulis Bos Wahyu** untuk tanggal deploy dan untuk penghapusan data lama
(langkah 7). Tanpa persetujuan itu: berhenti di langkah 0.

| Komponen | Nilai |
|---|---|
| Domain | `https://app.bestengineerpersada.com` (website utama `https://bestengineerpersada.com` tidak disentuh) |
| Folder aplikasi (document root subdomain) | `/home/u860192084/domains/bestengineerpersada.com/public_html/app` |
| Backend Laravel | `app/backend` |
| Frontend hasil build | `app/frontend/dist` (dibuat di komputer lokal lalu di-upload; tidak ada di Git) |
| PHP CLI | `/opt/alt/php83/usr/bin/php` (PHP 8.3) |
| Composer | `/usr/local/bin/composer` |
| Database MySQL | `u860192084_aplikasi_sulis` |
| Branch rilis | `v2` (commit rilis dicatat di langkah 0) |

Di bawah, `APP=/home/u860192084/domains/bestengineerpersada.com/public_html/app` dan
`PHP=/opt/alt/php83/usr/bin/php`.

## 0. Syarat sebelum mulai

- [ ] Bos Wahyu sudah menyetujui **secara tertulis**: tanggal/jam deploy dan bahwa database lama dihapus (langkah 7).
- [ ] UAT (`docs/UAT.md`) sudah selesai dan semua temuan sudah diperbaiki di `v2`.
- [ ] Commit rilis dicatat: `git log -1 --format='%h %s' origin/v2` → tulis di catatan deploy.
- [ ] Waktu deploy di luar jam kerja gudang (aplikasi mati ± 30 menit).
- [ ] Ada akses SSH dan hPanel Hostinger, dan password database ada di tangan (tidak ditulis di Git atau chat).

## 1. Siapkan rilis di komputer lokal

Di clone bersih branch `v2` pada commit rilis:

~~~bash
git checkout v2 && git pull origin v2
cd backend && composer install && php artisan test && cd ..
cd frontend && npm ci && npm run lint && npm test && npm run build && cd ..
cd frontend && zip -r ../dist-$(git rev-parse --short HEAD).zip dist && cd ..
~~~

Semua harus lulus. Hasilnya file `dist-<commit>.zip` (isi folder `frontend/dist`).

## 2. Backup (WAJIB, sebelum mengubah apa pun)

~~~bash
ssh <user>@<host-hostinger>
mkdir -p ~/backup-v1-$(date +%Y%m%d) && cd ~/backup-v1-$(date +%Y%m%d)
mysqldump --single-transaction --no-tablespaces -u u860192084_aplikasi_sulis -p u860192084_aplikasi_sulis > db-v1.sql
cp $APP/backend/.env env-v1.backup
tar -czf app-v1.tar.gz --exclude='vendor' --exclude='node_modules' -C $APP/.. app
ls -lh
~~~

- [ ] `db-v1.sql` tidak kosong (cek `ls -lh` dan `tail -1 db-v1.sql` berisi `-- Dump completed`).
- [ ] Unduh ketiga file backup ke komputer lokal (hPanel → File Manager) atau buat juga backup lewat hPanel → Databases.

## 3. Mode perawatan

~~~bash
cd $APP/backend && $PHP artisan down
~~~

## 4. Ambil kode v2

~~~bash
cd $APP
git status            # harus bersih; kalau ada perubahan lokal di server: BERHENTI dan laporkan
git fetch origin
git checkout v2        # file frontend/dist versi v1 (ada di Git main) ikut hilang; diganti di langkah 10
git pull origin v2
git log -1 --format='%h %s'   # harus sama dengan commit rilis di langkah 0
~~~

Branch `main` di GitHub tidak diubah. Menggabungkan `v2` ke `main` adalah keputusan terpisah Bos Wahyu.

## 5. Dependensi backend

~~~bash
cd $APP/backend
$PHP /usr/local/bin/composer install --no-dev --optimize-autoloader --no-interaction
$PHP /usr/local/bin/composer audit
~~~

`composer audit` harus menulis `No security vulnerability advisories found.`

## 6. File `.env` produksi

~~~bash
cd $APP/backend
cp .env.production.example .env.new
grep '^APP_KEY=' ~/backup-v1-*/env-v1.backup     # salin nilai APP_KEY lama ke .env.new
nano .env.new                                    # isi APP_KEY (lama) dan DB_PASSWORD
mv .env.new .env && chmod 600 .env
chmod -R 775 storage bootstrap/cache
~~~

Periksa: `APP_ENV=production`, `APP_DEBUG=false`, `LOG_LEVEL=warning`, `SESSION_DRIVER=array`, `CACHE_STORE=database`,
`DB_CONNECTION=mysql`. Jangan pernah menjalankan `key:generate` kalau APP_KEY lama ada.

## 7. Database — ⚠️ MENGHAPUS SEMUA DATA LAMA

Skema v2 berbeda total dari v1. `migrate:fresh` **menghapus semua tabel** di `u860192084_aplikasi_sulis` lalu membuat ulang
tabel v2 yang kosong. Data v1 hanya tersisa di backup langkah 2.

Hanya jalankan kalau: backup langkah 2 sudah dicek **dan** Bos Wahyu sudah menyetujui penghapusan ini (langkah 0).

~~~bash
cd $APP/backend
$PHP artisan migrate:fresh --force
$PHP artisan migrate:status
~~~

**Jangan pernah** menambahkan `--seed` di produksi (seeder berisi akun contoh dengan password contoh).

## 8. Akun Owner pertama

~~~bash
cd $APP/backend
$PHP artisan app:create-owner
~~~

Perintah ini menanyakan nama, email dan password (minimal 8 karakter, ada huruf dan angka). Password diketik
tersembunyi dan tidak bisa diberikan sebagai opsi, jadi tidak tersimpan di riwayat shell. Pengguna lain dibuat
oleh Owner dari menu **Pengguna** di aplikasi.

## 9. Cache Laravel

~~~bash
cd $APP/backend
$PHP artisan config:cache
$PHP artisan route:cache
$PHP artisan event:cache
$PHP artisan app:check-production
~~~

`app:check-production` hanya membaca (tidak mengubah apa pun). Semua baris harus `[OK]`. Kalau ada `[GAGAL]`,
perbaiki `.env` lalu ulangi `config:cache` dan pemeriksaan ini sebelum lanjut.

## 10. Upload frontend

1. hPanel → File Manager → `public_html/app/frontend/`.
2. Hapus folder `dist` lama (kalau ada), upload `dist-<commit>.zip`, lalu **Extract** di folder `frontend/`.
3. Pastikan ada `frontend/dist/index.html` dan `frontend/dist/assets/`.

## 11. Aplikasi hidup lagi

~~~bash
cd $APP/backend && $PHP artisan up
~~~

## 12. Smoke test setelah deploy (hanya membaca, tanpa membuat data uji)

Dari komputer lokal:

~~~bash
U=https://app.bestengineerpersada.com
curl -s -o /dev/null -w '%{http_code}\n' $U/                  # 200
curl -s -o /dev/null -w '%{http_code}\n' $U/masuk             # 200
curl -s -o /dev/null -w '%{http_code}\n' $U/up                # 200
curl -s $U/api/v1/auth/me -H 'Accept: application/json'      # 401 {"message":"Sesi Anda telah berakhir. Silakan masuk kembali."}
curl -s -o /dev/null -w '%{http_code}\n' $U/backend/.env      # 403
curl -s -o /dev/null -w '%{http_code}\n' $U/.git/HEAD         # 403
curl -s -o /dev/null -w '%{http_code}\n' $U/composer.json     # 403
curl -s -o /dev/null -w '%{http_code}\n' $U/AGENTS.md         # 403
curl -s -o /dev/null -w '%{http_code}\n' $U/assets/tidak-ada.js   # 404
curl -sI $U/ | grep -iE 'content-security-policy|x-content-type-options|referrer-policy|x-frame-options'   # 4 baris
curl -s -o /dev/null -w '%{http_code}\n' https://bestengineerpersada.com/   # 200, website utama tetap jalan
~~~

Di browser (desktop dan HP):

- [ ] Masuk sebagai Owner (akun langkah 8) → Dashboard tampil, tidak ada error merah di console browser.
- [ ] Buka setiap menu sekali: Pembelian, Barang Keluar, Pengembalian, Stok Awal, Stok Opname, Barang, Proyek, Pemasok,
      Kategori, Satuan, Laporan, Pengguna, Log Aktivitas, Akun.
- [ ] Log Aktivitas menampilkan `Masuk` untuk akun Owner tadi.
- [ ] Keluar → kembali ke halaman Masuk.

Kalau semua lulus: catat jam selesai dan commit rilis, lalu mulai input data awal (kategori, satuan, barang, stok awal).

## 13. Cron (opsional)

hPanel → Advanced → Cron Jobs, sekali sehari:

~~~bash
/opt/alt/php83/usr/bin/php /home/u860192084/domains/bestengineerpersada.com/public_html/app/backend/artisan sanctum:prune-expired --hours=24
~~~

## 14. Rollback (kalau smoke test gagal dan tidak bisa diperbaiki cepat)

~~~bash
cd $APP/backend && $PHP artisan down
cd $APP && rm -rf frontend/dist && git checkout main     # main berisi frontend/dist versi v1
cp ~/backup-v1-<tanggal>/env-v1.backup backend/.env && chmod 600 backend/.env
mysql -u u860192084_aplikasi_sulis -p u860192084_aplikasi_sulis < ~/backup-v1-<tanggal>/db-v1.sql
cd backend && $PHP /usr/local/bin/composer install --no-dev --optimize-autoloader --no-interaction
$PHP artisan config:clear && $PHP artisan route:clear
$PHP artisan up
~~~

Kalau ada file v1 yang hilang, ambil dari `app-v1.tar.gz` (langkah 2). Laporkan ke Bos Wahyu apa yang gagal sebelum
mencoba deploy lagi.
