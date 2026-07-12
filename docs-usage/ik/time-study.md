# IK-05 — Time Study (TS)

Langkah teknis menjalankan alat ukur **Time Study** di aplikasi.

Bagian **A–B** untuk **Administrator**, **C–D** untuk **Partisipan**. Untuk alur, lihat
[SOP Persiapan TS](../sop/persiapan-time-study.md) dan
[SOP Pelaksanaan Time Study](../sop/pelaksanaan-time-study.md).

Time Study **tidak memakai sesi maupun tahap analisis**. Setiap partisipan langsung
**ditugaskan** (1 partisipan = 1 penugasan), lalu mencatat log harian selama
penugasannya berstatus **Aktif**. Tidak ada langkah "buka/tutup sesi" atau "jalankan
analisis" di alat ukur ini.

---

## A. Menugaskan Partisipan

1. Buka **Time Study** dari Dashboard. Daftar penugasan menampilkan kolom **Partisipan**,
   **Jabatan** (jabatan utama partisipan, otomatis), **Status** (**Aktif**/**Nonaktif**),
   **Ditugaskan**.
2. Klik **+ Tugaskan Partisipan**.
3. Isi formulir:
   - **Partisipan** (wajib, pilih dari dropdown — jabatan ditampilkan otomatis dari data
     partisipan)
   - **Catatan** (opsional)
4. Klik **Tugaskan**. Aplikasi membuka detail penugasan, berstatus **Aktif** sejak awal.

!!! note "Satu partisipan, satu penugasan"
Setiap partisipan hanya dapat memiliki satu penugasan Time Study. Untuk menugaskan
ulang partisipan yang penugasannya sudah dinonaktifkan, aktifkan kembali penugasan
yang ada (lihat bagian B) — bukan membuat penugasan baru.

---

## B. Mengelola Penugasan (Aktif/Nonaktif, Hapus)

Dari detail penugasan (`/time-study/{id}`):

| Status   | Tombol                      | Hasil                                                     |
| -------- | --------------------------- | ---------------------------------------------------------- |
| Aktif    | **Nonaktifkan Penugasan**   | → Nonaktif (log baru tidak dapat ditambah/diubah)         |
| Nonaktif | **Aktifkan Kembali**        | → Aktif kembali                                            |
| —        | **Hapus Penugasan**         | Menghapus penugasan (konfirmasi: riwayat log harian tidak lagi bisa diakses lewat penugasan ini) |

Halaman ini juga menampilkan statistik **Log Harian Terisi** (jumlah log) dan tanggal
**Ditugaskan**.

---

## C. Mengisi Log Harian (Partisipan)

1. Buka **Time Study** dari **Kuesioner Saya**. Halaman **Log Harian — Time Study**
   menampilkan tabel log: **Tanggal**, **Masuk–Keluar**, **Inti**, **Karakter**,
   **Pengembangan**, **Strategis**, **Administrasi**, **Istirahat**, **Warna Hari**, **Aksi**.
2. Klik **+ Tambah Log** (atau **Tambah Log Hari Ini** bila belum ada log). Tombol ini
   hanya muncul selama penugasan **Aktif**.
3. Isi formulir:
   - **Tanggal** (default hari ini)
   - **Waktu Masuk** dan **Waktu Keluar** (format jam:menit)
   - **Kategori Hari**: **Hijau (Hari Biasa)** / **Kuning (Hari Sibuk)** / **Merah (Hari Puncak)**
   - **Distribusi Waktu per Kategori** — isi **jam** (0–23) dan **menit** (0–59) untuk:
     **Pekerjaan Inti**, **Asesmen Karakter**, **Pengembangan Diri**, **Pekerjaan
     Strategis**, **Administrasi**, **Istirahat Terstruktur**
   - **Catatan** (opsional)
4. Klik **Simpan Log**. Log muncul di tabel.

---

## D. Mengedit Log (Partisipan)

1. Pada tabel log, klik **Edit** di kolom **Aksi** (hanya muncul selama penugasan **Aktif**).
2. Ubah nilai yang diperlukan (formulir sama dengan tambah log).
3. Klik **Simpan Perubahan**.

!!! note "Selama penugasan aktif"
Log dapat ditambah dan diedit selama penugasan masih **Aktif**. Saat **Nonaktif**,
tombol tambah/edit disembunyikan — data log yang sudah ada tetap dapat dilihat.

---

<!-- Screenshot: halaman penugasan Time Study dengan daftar partisipan dan status Aktif/Nonaktif -->
<!-- Screenshot: form Tambah Log Harian dengan distribusi waktu per kategori -->
