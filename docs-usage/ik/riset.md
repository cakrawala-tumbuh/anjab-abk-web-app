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

## Mencatat kasus negatif

Sama seperti statistik, bagian ini hanya aktif pada protokol **Terkunci**.

1. Isi **Ringkasan kasus (tersamar)** dan **Alasan negatif**. Baca peringatan privasi di
   atasnya: jangan menulis nama orang atau data pribadi.
2. **Rujukan sumber** boleh dikosongkan. Klik **Simpan kasus negatif**.

## Bila muncul pesan galat

Pesan dari server ditampilkan apa adanya, misalnya `PROTOKOL_TERKUNCI`,
`PROTOKOL_BELUM_TERKUNCI`, atau `STATISTIK_SUDAH_TERVERIFIKASI`. Sebut kode pesan itu saat
melapor masalah.
