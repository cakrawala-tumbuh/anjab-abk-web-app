# IK-09 — Backup & Restore

Langkah teknis mencadangkan dan memulihkan basis data aplikasi. Akses: **Administrator**.

Buka **Backup & Restore** di sidebar kiri (grup menu admin, di bawah **Master Data**).
Pengguna selain Administrator tidak dapat membuka halaman ini — mengetik alamatnya
langsung di peramban tetap ditolak, entri menu juga tidak muncul di sidebar mereka.

---

## Unduh Cadangan

1. **Backup & Restore → Unduh Cadangan**.
2. Klik **Unduh Cadangan**. Tombol berubah menjadi **Mengunduh…** dan terkunci selama
   proses berlangsung.
3. Setelah selesai, peramban langsung mengunduh satu berkas `.dump` (format `pg_dump`)
   berisi salinan penuh basis data saat ini.

!!! note "Server tidak menyimpan salinan"
Aplikasi tidak menahan riwayat cadangan di server — tidak ada daftar cadangan yang bisa
dilihat kembali. Simpan berkas hasil unduhan di lokasi yang aman (mis. penyimpanan cloud
internal yayasan) segera setelah diunduh.

---

## Pulihkan dari Cadangan

!!! danger "Tindakan destruktif dan tidak bisa dibatalkan"
Memulihkan cadangan **mengganti seluruh data yang tersimpan saat ini** dengan isi
berkas yang diunggah. Data yang dibuat setelah cadangan itu diambil akan **hilang
permanen**. Pastikan benar-benar diperlukan sebelum melanjutkan, dan sebaiknya
**unduh cadangan terbaru terlebih dahulu** (lihat bagian di atas) sebagai jaring
pengaman sebelum memulihkan cadangan lain.

1. **Backup & Restore → Pulihkan dari Cadangan**. Baca peringatan destruktif yang tampil
   di bagian atas formulir.
2. Klik **Berkas cadangan (.dump)**, pilih berkas dump yang akan dipulihkan.
3. Isi **Ketik nama basis data tujuan untuk konfirmasi**. Ini adalah pengaman terakhir
   sebelum data diganti — aplikasi **tidak** menampilkan nama yang benar di layar mana
   pun; tanyakan kepada tim teknis bila belum tahu nilainya.
4. Tombol **Pulihkan Basis Data** aktif hanya setelah kedua kolom di atas terisi.
   Klik tombol tersebut untuk memulai.
5. Selama proses berjalan (bisa memakan puluhan detik untuk basis data besar), tombol
   berubah menjadi **Memulihkan…** dan terkunci — jangan menutup atau memuat ulang
   halaman.
6. Hasil ditampilkan setelah proses selesai:
   - **Berhasil** — muncul panel hijau berisi status. Bila ada **peringatan tindak
     lanjut** (mis. skema basis data hasil pulihan berbeda dari versi aplikasi saat
     ini), isinya ditampilkan di panel yang sama — segera hubungi tim teknis bila ini
     muncul.
   - **Gagal** — muncul pesan merah yang menjelaskan sebab spesifiknya, misalnya:
     - konfirmasi yang diketik tidak cocok dengan nama basis data tujuan;
     - berkas yang diunggah melebihi batas ukuran yang diizinkan;
     - akun yang login bukan Administrator.

---

<!-- Screenshot: halaman Backup & Restore dengan tombol Unduh Cadangan dan formulir Pulihkan -->
