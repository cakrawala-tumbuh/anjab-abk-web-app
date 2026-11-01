# IK-10 — Redesain Pekerjaan (Tim Kajian)

Langkah teknis membuka menu **Redesain Pekerjaan** dan membaca **Riwayat Perubahan**.
Akses: pengguna dengan peran **Tim Kajian**.

!!! warning "Administrator tidak otomatis berhak"
Peran **Administrator** saja **tidak** memberi akses ke Redesain Pekerjaan. Menu tidak
muncul di sidebar, dan mengetik alamat `/redesain` langsung menampilkan
**Tidak berhak mengakses halaman ini**. Akses hanya untuk pengguna yang berperan
**Tim Kajian** (diatur oleh administrator sistem identitas, bukan di aplikasi ini).

---

## Membuka Menu

1. Masuk ke aplikasi, lihat sidebar kiri.
2. Klik **Redesain Pekerjaan** — grup menu terbuka berisi **Beranda**,
   **Kode Orang**, **Cakupan 19 Jabatan**, **Konteks**, **Masalah**, dan
   **Riwayat Perubahan**.

## Banner PROTOTIPE

Di bagian atas setiap halaman Redesain Pekerjaan tampil banner kuning:

> PROTOTIPE — metode Paket Validasi & Prioritas Redesain v1.3 belum disahkan. Isi register
> BELUM MENJADI TEMUAN.

Banner ini selalu tampil dan tidak bisa ditutup. Isi register di halaman-halaman ini
bukan temuan resmi sampai metodenya disahkan.

## Orang Ditampilkan sebagai Kode

Di seluruh layar Redesain Pekerjaan, orang **tidak pernah** ditampilkan dengan nama atau
email — hanya **kode orang** (contoh `O-0001`). Pada kolom **Pelaku**, tanda `—` berarti
data berasal dari seed/sistem, bukan dari seseorang.

## Membaca Riwayat Perubahan

1. **Redesain Pekerjaan → Riwayat Perubahan**.
2. Tabel menampilkan kolom **Waktu**, **Entitas**, **ID Entitas**, **Aksi**, **Pelaku**,
   **Sebelum**, dan **Sesudah**.
3. Klik **Lihat** pada kolom **Sebelum**/**Sesudah** untuk membuka isi (JSON terformat);
   klik lagi untuk menutup.
4. Untuk menyaring, isi **Entitas** dan/atau **ID entitas**, lalu klik **Terapkan**.
5. Gunakan tombol halaman di bawah tabel bila catatan lebih dari satu halaman.

Halaman ini hanya untuk membaca — tidak ada tombol ubah atau hapus. Riwayat bersifat
catatan tambah-saja (tidak dapat diedit).

!!! note "Bila muncul pesan error"
Jika server menolak (misalnya 403) atau gagal (5xx), halaman menampilkan pesan error
dengan tombol **Coba lagi** — bukan tabel kosong. Tabel kosong berarti memang belum ada
riwayat (atau tidak ada yang cocok dengan filter).

---

## Kode Orang

Kode orang (contoh `O-0001`) adalah identitas narasumber di seluruh register redesain.
Halaman ini satu-satunya layar redesain yang menampilkan **nama** partisipan, karena
peta kode ↔ partisipan hanya untuk Tim Kajian.

1. **Redesain Pekerjaan → Kode Orang**. Tabel memuat **Kode**, **Keterangan peran**,
   **Partisipan**, dan **Dibuat**.
2. Untuk menambah narasumber, isi **Keterangan peran** (tulis jabatan/peran, bukan nama),
   pilih **Partisipan** bila ada (boleh dikosongkan), lalu klik **Tambah**.
3. Bila partisipan itu sudah punya kode, tampil pesan **Partisipan ini sudah punya kode**
   dan tidak ada yang tersimpan.
4. Untuk mengubah keterangan, edit kolom **Keterangan peran** lalu klik **Simpan**.

Kode orang tidak dapat dihapus. Di form lain, kode dipilih lewat daftar berlabel
`kode — keterangan peran` (tanpa nama orang). Bila daftar gagal dimuat, tampil pesan
galat — bukan daftar kosong.

## Cakupan 19 Jabatan

1. **Redesain Pekerjaan → Cakupan 19 Jabatan**. Tabel menampilkan 19 role, masing-masing
   dengan kolom **Bandung** dan **Semarang**.
2. Sel bertanda **Belum dipetakan ke master jabatan** berarti role cabang itu belum
   dihubungkan ke jabatan di master data — cakupan belum lengkap.
3. Klik **Ubah Bandung** / **Ubah Semarang** pada sel untuk membuka form: **Jabatan master**,
   **Status unit**, **Pemegang diperiksa**, **Inventori ditinjau**, **Peta diperkuat**,
   **Gap / variasi** (jangan menulis nama orang), dan **PIC (kode orang)**. Klik **Simpan**.
4. Bila jabatan yang dipilih ternyata sudah tidak ada, server menolak dan tampil pesan galat.

Baris cakupan tidak dapat ditambah atau dihapus dari layar ini.

---

## Konteks

Konteks adalah katalog tema yang menjadi dasar hipotesis masalah. Judul halaman memuat
label tetap **BELUM MENJADI TEMUAN** — isi katalog bukan temuan resmi.

1. **Redesain Pekerjaan → Konteks**. Tabel memuat **Kode**, **Tema**, **Gelombang**,
   **Aktif**, dan **Aksi**.
2. Untuk menambah konteks, buka **Tambah konteks**, isi **Kode (K-NN)** (mis. `K-15`),
   **Tema**, **Gelombang**, **Ruang dugaan**, **Sumber draf**, dan **Batas pemeriksaan**,
   lalu klik **Tambah konteks**. Bila kode sudah dipakai, tampil pesan
   **Kode konteks sudah dipakai**.
3. Untuk mengubah, klik **Ubah** pada baris konteks, sunting isinya, lalu klik
   **Simpan perubahan**. Kode tidak dapat diubah.
4. Untuk menonaktifkan konteks, hilangkan centang **Aktif**. Konteks tidak bisa dihapus.

Jangan menulis nama orang atau data pribadi di isian teks; tulis jabatan atau peran.

## Masalah

Register masalah memuat hipotesis masalah per sekolah dan periode.

1. **Redesain Pekerjaan → Masalah**. Tabel memuat **Kode**, **Konteks**, **Sekolah**,
   **Periode acuan**, **Status awal**, **Gelombang**, dan **Dibuka**. Bila sekolah belum
   ditetapkan, kolom Sekolah menampilkan keterangan sekolah atau **Belum ditetapkan**.
2. Untuk menyaring, pilih **Konteks**, **Sekolah**, **Status awal**, **Gelombang**, atau
   **Dibuka untuk konfirmasi**. Filter langsung berlaku dan tersimpan di alamat halaman.
3. Klik **+ Tambah masalah**, isi formulir (konteks, sekolah atau keterangan sekolah,
   periode acuan, rumusan hipotesis, sumber awal dan keterbatasan, status awal, gelombang,
   penjelasan alternatif, penanggung jawab berupa kode orang, serta uraian tugas yang
   tertaut), lalu klik **Tambah masalah**. Pilih **Belum ditetapkan** pada Sekolah bila
   sekolahnya belum diketahui, lalu isi **Keterangan sekolah**.
4. Untuk mengubah, klik kode masalah pada tabel (sementara halaman detail belum tersedia,
   tautan ini membuka formulir ubah), lalu klik **Simpan perubahan**.

### Membuka masalah untuk konfirmasi sekolah

Pada kolom **Dibuka**, klik **Buka untuk konfirmasi sekolah** agar masalah muncul di daftar
sekolah, atau **Tutup** untuk menyembunyikannya kembali. Perubahan langsung terlihat.

### Status awal dibekukan

Setelah konfirmasi pertama dari sekolah terkirim, **Status awal** dibekukan: pilihannya
nonaktif dan tampil keterangan **Dibekukan sejak <tanggal> (konfirmasi pertama terkirim)**.
Field lain tetap dapat diubah.

## Sesi partisipasi & rekap

Halaman ini mencatat keterlibatan satu orang pada satu sesi kegiatan redesain. Catatan ini
**BUKAN Time Study**. Orang tampil sebagai kode (mis. O-0001), bukan nama.

1. **Redesain Pekerjaan → Sesi Partisipasi**. Tabel memuat **Kode sesi**, **Kode orang**,
   **Sekolah**, **Peran**, **Jenis kegiatan**, **Menit rencana**, **Menit disepakati**, dan
   **Status izin**. Menit yang belum diisi tampil **—**.
2. Untuk menyaring, isi **Kode sesi** atau **Kode orang** (tekan Enter), atau pilih
   **Jenis kegiatan** atau **Status izin**. Filter langsung berlaku dan tersimpan di alamat
   halaman.
3. Klik **+ Tambah sesi**, isi **Kode sesi** (dibagi semua peserta satu kegiatan),
   **Kode orang**, **Peran**, **Jenis kegiatan**, serta menit, lalu klik **Catat sesi**.
   Menit boleh dikosongkan, tetapi tidak boleh negatif. Pilih satu atau lebih **Masalah
   tertaut** bila relevan.
4. **Status izin** hanya informasi; tidak menghalangi pencatatan. Sesi dengan status
   **Tidak diotorisasi** tetap dapat disimpan.
5. Bila pasangan kode sesi dan kode orang sudah ada, tampil pesan **Orang ini sudah
   tercatat di sesi tersebut**.
6. Untuk mengubah, klik kode sesi pada tabel, sunting isinya, lalu klik **Simpan
   perubahan**.

### Rekap per orang

Klik **Rekap per orang** untuk melihat, per kode orang, **Jumlah sesi**, **Total menit
rencana**, dan **Total menit disepakati**. Total yang belum ada isinya tampil **—**, bukan 0.

Jangan menulis nama orang atau data pribadi di isian teks; tulis jabatan atau peran.
