# IK-06 — DCS (Demand-Control-Support)

Langkah teknis menjalankan kuesioner **DCS** di aplikasi.

Bagian **A–C** untuk **Administrator**, **D** untuk **Partisipan**. Untuk alur, lihat
[SOP Persiapan DCS](../sop/persiapan-dcs.md) dan
[SOP Pelaksanaan DCS](../sop/pelaksanaan-dcs.md).

DCS = 3 sub-skala, 42 item, skala 1–5. Status sesi:
`Draft → Terbuka → Tertutup → Teranalisis`.

---

## A. Membuat Sesi

1. Buka **DCS** dari navigasi. Daftar sesi menampilkan **Keterangan**, **Periode**,
   **Status**, **Responden**, **Dibuat**.
2. Klik **+ Buat Sesi**.
3. Isi formulir:
    - **Periode** (wajib, format `YYYY-MM`, mis. `2026-06`)
    - **Min. Responden** (default 6) dan **Maks. Responden** (default 8, harus ≥ min)
    - **Catatan (opsional)**
4. Klik **Buat Sesi**. Sesi terbuat dengan status **Draft**.

!!! note "Tanpa pilihan jabatan"
    Sesi DCS tidak memerlukan pemilihan jabatan. Partisipan jabatan apapun dapat ditugaskan.

---

## B. Membuka & Menutup Sesi

Bagian transisi menampilkan tombol sesuai status:

| Status | Tombol | Hasil |
|---|---|---|
| Draft | **Buka Sesi** | → Terbuka |
| Draft | **Hapus Sesi** | Menghapus sesi (*tidak dapat dibatalkan*) |
| Terbuka | **Tutup Sesi** | → Tertutup |

Setelah **Tertutup**, analisis diproses dari backend; hasil tersedia di halaman laporan.

---

## C. Mendaftarkan Responden

> Hanya saat status **Terbuka**. Bagian **Tambah Responden**.

1. **Pilih dari Partisipan (opsional — pre-isi nama & jabatan)** — memilih partisipan
   mengisi otomatis **Nama** dan **Label Jabatan**.
2. **Nama (opsional)** dan **Label Jabatan** (wajib, mis. `Guru Matematika`).
3. Klik **+ Daftarkan**. Responden muncul di **Daftar Responden** dengan **Status Isian**
   = **Belum diisi**.
4. Untuk menghapus responden yang belum mengisi, klik **Hapus** (konfirmasi muncul).

---

## D. Mengisi Kuesioner (Partisipan)

1. Buka **Kuesioner Saya** → pada kartu **DCS** yang berstatus terbuka & belum diisi, klik
   **Isi Sekarang**.
2. Kuesioner tersusun per **sub-skala**. Untuk tiap pernyataan, pilih satu nilai:
    - **1 — Sangat Tidak Setuju**
    - **2 — Tidak Setuju**
    - **3 — Ragu-ragu**
    - **4 — Setuju**
    - **5 — Sangat Setuju**
3. Pantau penghitung *"{terjawab} / {total} pernyataan dijawab"* di bagian bawah.
4. Setelah **semua** item dijawab, klik **Kirim Jawaban**.

!!! warning "Semua wajib dijawab"
    Tombol **Kirim Jawaban** aktif hanya bila seluruh pernyataan terjawab. Jika belum,
    muncul *"Semua pernyataan wajib dijawab sebelum mengirim."*

!!! success "Setelah dikirim"
    Muncul *"Jawaban berhasil dikirim!"*. Jawaban bersifat final; nanti dapat dibuka lagi
    lewat tombol **Lihat Jawaban** (mode baca-saja).

---

<!-- Screenshot: form kuesioner DCS dengan skala 1–5 dan penghitung progres -->
