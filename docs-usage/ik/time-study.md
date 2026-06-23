# IK-05 — Time Study (TS)

Langkah teknis menjalankan alat ukur **Time Study** di aplikasi.

Bagian **A–D** untuk **Administrator**, **E–F** untuk **Partisipan**. Untuk alur, lihat
[SOP Persiapan TS](../sop/persiapan-time-study.md) dan
[SOP Pelaksanaan](../sop/pelaksanaan-pengambilan-data.md).

Status sesi: `Draft → Terbuka → Tertutup → Teranalisis`.

---

## A. Membuat Sesi

1. Buka **Time Study** dari Dashboard. Daftar sesi menampilkan kolom **Jabatan**,
   **Periode**, **Status**, **Dibuat**.
2. Klik **+ Buat Sesi**.
3. Isi formulir:
    - **Jabatan** (wajib, pilih dari dropdown)
    - **Periode** (wajib, format `YYYY-MM`, mis. `2026-06`)
    - **Catatan** (opsional)
4. Klik **Buat Sesi**. Aplikasi membuka detail sesi dengan status **Draft**.

---

## B. Membuka & Menutup Sesi

Bagian **Transisi Sesi** menampilkan tombol sesuai status:

| Status | Tombol | Hasil |
|---|---|---|
| Draft | **Buka Sesi** | → Terbuka (responden dapat didaftarkan) |
| Draft | **Hapus Sesi** | Menghapus sesi |
| Terbuka | **Tutup Sesi** | → Tertutup |
| Tertutup | **Jalankan Analisis** | → Teranalisis |

---

## C. Mendaftarkan Responden

> Hanya saat status **Terbuka**. Bagian **Tambah Responden**.

1. **Pilih dari Partisipan (opsional)** — memilih partisipan mengisi otomatis **Nama** dan
   **Label Jabatan**.
2. **Nama** (opsional) dan **Label Jabatan** (wajib, mis. `Guru Matematika`).
3. Klik **+ Daftarkan**. Responden muncul di **Daftar Responden** (kolom **#**, **Nama**,
   **Jabatan**, **Didaftarkan**, **Aksi**).
4. Untuk menghapus, klik **Hapus** pada kolom **Aksi** (konfirmasi muncul).

---

## D. Menjalankan Analisis

Setelah sesi **Tertutup**, klik **Jalankan Analisis**. Status menjadi **Teranalisis** dan
muncul *"✓ Analisis selesai. Lihat hasil di halaman laporan."*

---

## E. Mengisi Log Harian (Partisipan)

1. Buka **Time Study** dari **Kuesioner Saya**. Halaman **Log Harian — Time Study**
   menampilkan tabel log: **Tanggal**, **Masuk–Keluar**, **Inti**, **Karakter**,
   **Pengembangan**, **Strategis**, **Administrasi**, **Istirahat**, **Warna Hari**, **Aksi**.
2. Klik **+ Tambah Log** (atau **Tambah Log Hari Ini** bila belum ada log).
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

## F. Mengedit Log (Partisipan)

1. Pada tabel log, klik **Edit** di kolom **Aksi**.
2. Ubah nilai yang diperlukan (formulir sama dengan tambah log).
3. Klik **Simpan Perubahan**.

!!! note "Selama sesi terbuka"
    Log dapat ditambah dan diedit selama sesi masih **Terbuka**.

---

<!-- Screenshot: form Tambah Log Harian dengan distribusi waktu per kategori -->
