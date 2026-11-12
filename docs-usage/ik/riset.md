# IK-19 — Riset: Protokol, Statistik, dan Kasus Negatif

Langkah membuat dan mengunci protokol riset, mencatat dan memverifikasi statistik, serta
mencatat kasus negatif. Akses: **Tim Kajian**.

Buka grup **Riset → Protokol** di sidebar kiri. Pengguna tanpa peran Tim Kajian (termasuk
Administrator) melihat panel "Tidak berhak mengakses halaman ini".

!!! note "Yang TIDAK bisa dilakukan di halaman ini"
Protokol, statistik, dan kasus negatif tidak dapat diubah atau dihapus setelah disimpan, dan
protokol yang sudah dikunci tidak dapat dibuka lagi. Halaman ini juga belum memiliki tombol
sintesis AI.

---

## Membuat protokol

1. **Riset → Protokol**, klik **+ Tambah protokol**.
2. Isi **Kode** (huruf, angka, dan `_ . : -`, tanpa spasi; maksimal 40 karakter), **Judul**,
   dan **Isi protokol**. Bila kode yang sama dipakai lagi, versi naik otomatis.
3. Klik **Simpan protokol**. Setelah server menjawab sukses, halaman detail terbuka dengan
   status **Draf**. Isian yang ditolak server tampil pesannya di bawah isian itu.

## Menelusuri protokol

1. Di daftar, pilih **Status** (Draf atau Terkunci) lalu klik **Terapkan**.
2. "Belum ada protokol riset" berarti belum ada data; "Tidak ada protokol yang cocok dengan
   filter" berarti filter terlalu sempit (klik **Hapus filter**).

## Mengunci protokol

1. Buka detail protokol berstatus **Draf**, klik **Kunci protokol**.
2. Baca konfirmasi "Protokol yang dikunci tidak bisa diubah", lalu setujui.
3. Status berubah menjadi **Terkunci** dan **Hash isi (SHA-256)** tampil. Tombol kunci hilang.

## Mencatat bukti sign-off PI/etik

Bagian **Sign-off PI/etik** ada di detail protokol, di bawah isi protokol. Pada protokol
**Draf** tampil teks "Kunci protokol dulu untuk mencatat sign-off PI/etik". Sign-off
diperlukan sebelum sintesis AI (P08) dapat diminta.

1. Buka detail protokol berstatus **Terkunci** yang belum punya sign-off.
2. Isi **Nama PI** (Principal Investigator; sistem merekam akun Anda sebagai pencatat dan
   menyimpan nama PI yang Anda tulis), **Tanggal persetujuan etik** (tidak boleh di masa
   depan), dan, bila ada, **Nomor persetujuan etik**.
3. Pilih **Berkas PDF persetujuan etik** (hanya PDF, maksimal 5 MiB). Berkas bukan PDF atau
   terlalu besar langsung ditolak di layar tanpa dikirim.
4. Klik **Simpan sign-off**, baca konfirmasi "tidak dapat diubah atau diganti", lalu setujui.
5. Setelah berhasil, bagian ini menampilkan nama PI, tanggal dan nomor persetujuan, nama dan
   ukuran berkas, SHA-256 berkas, pencatat, serta waktu pencatatan. Klik **Unduh PDF
   persetujuan etik** untuk mengunduh berkasnya.

!!! warning "Sign-off hanya sekali"
Bila protokol sudah punya sign-off, server menolak unggahan baru dengan pesan "sudah punya
sign-off PI/etik". Salah unggah tidak bisa diperbaiki dari layar ini; hubungi operator.

## Mencatat dan memverifikasi statistik

Bagian **Statistik** hanya aktif pada protokol **Terkunci**; pada protokol Draf tampil teks
"Kunci protokol dulu".

1. Isi **Nama analisis**, **Keluaran analisis** (tempel apa adanya dari kode analisis), dan
   **Rujukan kode sumber** (skrip dan commit penghasil keluaran), lalu **Simpan statistik**.
2. Statistik baru berstatus **Draf**. Klik **Verifikasi** pada barisnya untuk memverifikasi.

!!! warning "Verifikasi butuh dua akun"
Pemverifikasi harus akun Tim Kajian yang **berbeda** dari pengunggah statistik. Bila akun
yang sama mencoba memverifikasi, server menolak dengan pesan `PEMVERIFIKASI_TIDAK_INDEPENDEN`
dan statistik tetap Draf. Minta rekan Tim Kajian lain untuk memverifikasi.

## Meminta sintesis bukti dengan AI (P08)

Pada protokol **Terkunci**, di bawah bagian Statistik, ada panel **Sintesis bukti dengan AI (P08)**
(tidak tampil pada protokol Draf).

1. Pastikan protokol punya **sign-off PI/etik** dan minimal satu statistik **Terverifikasi**.
   Bila sign-off belum ada, tombol nonaktif dengan keterangan "Butuh sign-off PI/etik"; bila
   statistik terverifikasi belum ada, tampil "Butuh minimal satu statistik terverifikasi."
2. Buka panel, isi **Periode** (mis. `2026/27`), lalu klik **Minta sintesis bukti**.
3. Bila diterima, muncul tautan **Buka usulan** ke layar Usulan AI. "Diterima" belum berarti
   selesai; hasilnya berupa draf yang harus Anda tinjau dan putuskan.

!!! note "Fungsi bisa belum diaktifkan"
Bila operator belum menyalakan fungsi ini, server membalas `fungsi_belum_aktif` dan pesannya
tampil apa adanya; ini perilaku sah, bukan kerusakan. Pesan lain yang mungkin muncul:
`PROTOKOL_BELUM_TERKUNCI`, `SIGNOFF_PI_ETIK_TAK_ADA`, `STATISTIK_TERVERIFIKASI_KOSONG`, dan
`SUMBER_TERLALU_BANYAK`.

## Mencatat kasus negatif

Sama seperti statistik, bagian ini hanya aktif pada protokol **Terkunci**.

1. Isi **Ringkasan kasus (tersamar)** dan **Alasan negatif**. Baca peringatan privasi di
   atasnya: jangan menulis nama orang atau data pribadi.
2. **Rujukan sumber** boleh dikosongkan. Klik **Simpan kasus negatif**.

## Bila muncul pesan galat

Pesan dari server ditampilkan apa adanya, misalnya `PROTOKOL_TERKUNCI`,
`PROTOKOL_BELUM_TERKUNCI`, `SIGNOFF_SUDAH_ADA`, atau `STATISTIK_SUDAH_TERVERIFIKASI`. Sebut kode pesan itu saat
melapor masalah.
