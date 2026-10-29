# UAT — Skrip uji klien (Stok Gudang v2)

Untuk Bos Wahyu dan tim (Owner, Finance, Gudang). Dijalankan di **lingkungan uji** yang ditunjuk Bulik, bukan di aplikasi
produksi, kecuali Bos Wahyu memutuskan lain. Centang setiap langkah; kalau hasilnya tidak sesuai, tulis di tabel
**Temuan** di bawah (nomor langkah, apa yang terjadi, foto layar). Temuan menjadi daftar perbaikan T6.06.

Akun uji: `owner@sulis.test`, `finance@sulis.test`, `gudang@sulis.test` (password diberikan terpisah).
Lakukan sebagian langkah di HP (layar kecil) dan sebagian di laptop.

## A. Masuk dan akun (semua peran)

- [ ] A1. Masuk dengan password salah → pesan "Email atau password salah." (tidak masuk).
- [ ] A2. Masuk dengan benar → Dashboard sesuai peran.
- [ ] A3. Menu **Akun** → ganti password → keluar → masuk lagi dengan password baru.
- [ ] A4. Keluar → kembali ke halaman Masuk.

## B. Data master (Owner)

- [ ] B1. **Kategori**: tambah "Kabel", ubah namanya, nonaktifkan lalu aktifkan lagi.
- [ ] B2. **Satuan**: tambah "roll" (rol).
- [ ] B3. **Barang**: tambah barang baru dengan SKU, kategori, satuan, stok minimum. SKU yang sama dua kali → ditolak.
- [ ] B4. **Barang → Impor**: unduh template, isi 3 barang, upload → 3 barang masuk. File dengan 1 baris salah → tidak ada yang masuk, baris salah ditunjukkan.
- [ ] B5. **Pemasok** (Owner/Finance): tambah pemasok.
- [ ] B6. **Proyek** (Owner/Finance): tambah proyek dengan nilai kontrak.

## C. Stok masuk

- [ ] C1. **Stok Awal** (Owner/Finance): isi stok awal 1 barang dengan harga modal → stok dan nilai stok bertambah.
- [ ] C2. **Pembelian** (Finance): buat draft dengan 2 barang → ubah jumlah → simpan. Stok belum berubah.
- [ ] C3. Gudang: buka draft yang sama → **Terima Barang** → stok bertambah. Gudang tidak melihat harga di layar mana pun.
- [ ] C4. Pembelian yang diterima → **Cetak** → Bukti Penerimaan Barang 1 halaman A4 dengan 2 kotak tanda tangan.
      Dicetak oleh Gudang: tanpa harga. Dicetak oleh Owner/Finance: dengan harga.
- [ ] C5. Owner: **Batalkan Pembelian** yang sudah diterima (wajib isi alasan) → stok berkurang lagi; cetakannya bertanda DIBATALKAN.

## D. Stok keluar dan kembali (Gudang)

- [ ] D1. **Barang Keluar**: ke proyek, nama pengambil, 2 barang → stok berkurang. Jumlah melebihi stok → ditolak.
- [ ] D2. Detail → **Cetak** → Bukti Barang Keluar 1 halaman dengan tanda tangan.
- [ ] D3. **Pengembalian** dari proyek yang sama → stok bertambah. Cetak Bukti Pengembalian.
- [ ] D4. Owner: **Batalkan** satu Barang Keluar (wajib alasan) → stok kembali; cetakannya bertanda DIBATALKAN.

## E. Stok opname

- [ ] E1. Gudang: buat stok opname, isi hitungan fisik (satu barang selisih), **Ajukan ke Owner**.
- [ ] E2. Owner: buka opname → **Setujui** → stok mengikuti hitungan fisik.
- [ ] E3. Opname lain: Owner **Tolak** dengan alasan → kembali ke draft, Gudang bisa memperbaiki dan mengajukan lagi.

## F. Proyek dan biaya (Owner/Finance)

- [ ] F1. Detail proyek → **Biaya Lain** → tambah, ubah, hapus biaya. Di HP terlihat "Dicatat oleh".
- [ ] F2. Tab **Laba**: nilai kontrak − biaya material − biaya lain = laba. Cocokkan dengan hitungan manual.

## G. Laporan

- [ ] G1. **Laba Proyek**, **Nilai Stok**, **Pergerakan Barang**, **Riwayat Harga Modal** tampil dan angkanya masuk akal.
- [ ] G2. **Unduh Excel** di Laba Proyek, Nilai Stok dan Pergerakan Barang → file terbuka di Excel, isi sama dengan layar
      (dengan filter yang sedang dipakai), baris TOTAL di bawah.
- [ ] G3. Gudang: hanya tab Pergerakan Barang; file Excel-nya tanpa kolom harga/nilai.
- [ ] G4. Filter tanggal "Dari" lebih besar dari "Sampai" → pesan "Tanggal "Sampai" tidak boleh sebelum tanggal "Dari"."

## H. Pengguna dan Log Aktivitas (Owner)

- [ ] H1. **Pengguna**: tambah pengguna Gudang baru, nonaktifkan → pengguna itu langsung keluar dan tidak bisa masuk.
- [ ] H2. Aktifkan lagi → bisa masuk.
- [ ] H3. **Log Aktivitas**: semua langkah di atas tercatat (siapa, kapan, apa); klik baris → rincian sebelum/sesudah.
- [ ] H4. Finance dan Gudang tidak melihat menu Pengguna dan Log Aktivitas.

## I. Tampilan

- [ ] I1. Di HP: semua halaman bisa dipakai tanpa geser ke samping; tombol mudah ditekan.
- [ ] I2. Semua teks berbahasa Indonesia, format Rupiah `Rp 1.250.000`, tanggal `30 Okt 2026`, jam `WIB`.

## Temuan

| No | Langkah | Peran | Apa yang terjadi | Seharusnya | Foto |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

Hasil UAT: ☐ Lulus  ☐ Lulus dengan catatan  ☐ Belum lulus — Tanggal: ________  Tanda tangan Bos Wahyu: ________
