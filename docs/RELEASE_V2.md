# Rilis v2 — Stok Gudang (catatan rilis)

Status: **siap UAT, BELUM dideploy.** Deploy ke `app.bestengineerpersada.com` hanya setelah persetujuan tertulis
Bos Wahyu (lihat `docs/DEPLOY_V2.md` langkah 0). Dokumen ini dibuat di T6.06 (regresi akhir).

## Isi v2

| Fase | Isi |
|---|---|
| 1 | Login (token 7 hari, batas 5 percobaan/menit), peran Owner/Gudang/Finance, kelola pengguna, akun saya, log aktivitas dasar |
| 2 | Master data: kategori, satuan, barang (+ impor Excel), pemasok, proyek |
| 3 | Buku stok (rata-rata tertimbang): stok awal, pembelian (draft → terima → batal), barang keluar ke proyek, pengembalian, pembalikan transaksi, riwayat stok per barang |
| 4 | Biaya lain proyek, laba proyek, nilai stok, riwayat biaya, laporan pergerakan, dashboard per peran |
| 5 | Stok opname, log aktivitas lengkap, pemeriksaan akhir hak akses dan penyembunyian harga untuk Gudang |
| 6 | Unduh Excel laporan (T6.01), cetak bukti penerimaan dan bukti barang keluar (T6.02), perapian tampilan (T6.03), konfigurasi produksi dan panduan deploy (T6.04), `app:create-owner` dan `app:check-production` (T6.05), regresi akhir (T6.06) |

## Hak akses singkat

- **Owner**: semua menu, termasuk pengguna, log aktivitas, pembatalan dan pembalikan.
- **Finance**: laporan uang (laba proyek, nilai stok, riwayat biaya), biaya lain proyek, dashboard keuangan.
- **Gudang**: transaksi barang tanpa melihat harga/nilai uang sama sekali (API pun tidak mengirimkannya).

## Hasil regresi T6.06 (lokal, SQLite)

~~~text
php artisan test                  -> 230 tests lulus
php artisan route:list            -> 67 route aplikasi
php artisan migrate:fresh --seed  -> OK (hanya lokal)
vendor/bin/pint --test ...        -> lulus
composer audit                    -> tidak ada kerentanan (symfony/mime v7.4.22, CVE-2026-45070 tertutup)
npm run lint / test / build       -> lulus, 8 tes frontend
npm audit                         -> 0 kerentanan
~~~

## Yang perlu diketahui sebelum dipakai

1. **Data lama v1 tidak dipindahkan.** Deploy v2 memakai `migrate:fresh` yang mengosongkan database. Backup v1 tetap
   disimpan (langkah 2 `DEPLOY_V2.md`). Data awal v2 diisi lewat Stok Awal / impor Excel.
2. Laporan Pergerakan Barang di Excel dibatasi 10.000 baris per unduhan; persempit tanggal kalau lebih.
3. Cetak memakai fitur cetak browser (Ctrl+P / tombol **Cetak**), bisa disimpan sebagai PDF.
4. Aplikasi tidak mengirim email. Password lupa direset oleh Owner dari menu **Pengguna**.
5. Backup database tidak otomatis; lakukan dari hPanel secara berkala.

## Proses UAT

1. Penguji menjalankan `docs/UAT.md` di lingkungan uji (bukan data asli).
2. Setiap temuan dicatat di tabel **Temuan** pada `docs/UAT.md` (nomor, langkah, yang terjadi, yang diharapkan).
3. T6.06 hanya regresi: perbaikan dari UAT dibuat sebagai tugas baru (T6.07, T6.08, …), satu commit per tugas,
   lalu regresi ini diulang.
4. Setelah semua temuan beres dan UAT ditandatangani, Bos Wahyu memutuskan tanggal deploy dan memberi persetujuan
   tertulis. Baru setelah itu `docs/DEPLOY_V2.md` dijalankan.
