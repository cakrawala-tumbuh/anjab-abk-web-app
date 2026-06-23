# SOP Pelaksanaan Pengambilan Data

Prosedur baku menjalankan pengambilan data untuk **semua alat ukur** (Task Inventory,
Time Study, DCS, WCP) — dari membuka sesi hingga menjalankan analisis.

**Tujuan:** memastikan data terkumpul lengkap, dari responden yang tepat, dalam periode
yang ditentukan, lalu diproses menjadi hasil.

**Penanggung jawab:** Administrator studi ANJAB-ABK (dibantu koordinator panel untuk TI).

**Prasyarat:** SOP Persiapan alat ukur terkait telah selesai
([TI](persiapan-task-inventory.md) · [TS](persiapan-time-study.md) ·
[DCS](persiapan-dcs.md) · [WCP](persiapan-wcp.md)).

---

## Pola Umum Pelaksanaan

Semua alat ukur mengikuti pola yang sama, dengan perbedaan pada apa yang diisi partisipan:

```
Buka sesi → Daftarkan responden → Tugaskan & pandu pengisian
        → Pantau progres → Tutup sesi → Jalankan analisis
```

| Alat Ukur | Yang diisi partisipan | Transisi sesi |
|---|---|---|
| **Task Inventory** | Tahap 1 (seleksi tugas) → [koordinator Tahap 2] → Tahap 3 (detail CalHR) | DRAFT → TAHAP1 → TAHAP2 → TAHAP3 → CLOSED → ANALYZED |
| **Time Study** | Log harian (jam & distribusi waktu) | DRAFT → Terbuka → Tertutup → Teranalisis |
| **DCS** | Kuesioner 42 item | DRAFT → Terbuka → Tertutup → Teranalisis |
| **WCP** | Kuesioner 72 item | DRAFT → Terbuka → Tertutup → Teranalisis |

---

## Bagian 1 — Membuka Sesi & Mendaftarkan Responden

1. Buka detail sesi yang telah dibuat (status awal **DRAFT**).
2. **Buka sesi**:
    - **Time Study / DCS / WCP**: klik **Buka Sesi** → status menjadi **Terbuka**.
    - **Task Inventory**: klik **Mulai Tahap 1** → status menjadi **TAHAP1**.
3. **Daftarkan responden** sesuai daftar yang disiapkan saat persiapan. Pilih dari
   partisipan agar nama & label jabatan terisi otomatis, lalu klik **+ Daftarkan**.

!!! note "Kapan responden boleh didaftarkan"
    - **Time Study / DCS / WCP**: responden didaftarkan saat sesi **Terbuka**.
    - **Task Inventory**: responden dapat didaftarkan saat **DRAFT** atau **TAHAP1**.

Langkah teknis: [IK-04 TI](../ik/task-inventory.md) · [IK-05 TS](../ik/time-study.md) ·
[IK-06 DCS](../ik/dcs.md) · [IK-07 WCP](../ik/wcp.md).

---

## Bagian 2 — Menugaskan & Memandu Pengisian

Setelah responden terdaftar pada sesi yang terbuka, alat ukur otomatis muncul di menu
**Kuesioner Saya** milik partisipan tersebut.

1. Informasikan kepada partisipan bahwa alat ukur sudah aktif dan batas waktu pengisiannya.
2. Pandu partisipan sesuai alat ukur:

=== "Task Inventory"

    - **Tahap 1**: tiap anggota panel membuka **Isi Tahap 1** dan menyeleksi tugas relevan
      melalui 3 langkah (Tugas Pokok → Detil Tugas → Uraian Tugas), lalu **Kirim Seleksi**.
    - **Tahap 3**: setelah dibuka, tiap anggota menandai tugas yang dikerjakan dan mengisi
      rincian CalHR, lalu **Kirim Detail**.
    - Pengisian yang sudah dikirim **tidak dapat diubah**.

=== "Time Study"

    - Tiap responden mencatat **log harian** selama periode: tanggal, jam masuk–keluar,
      kategori hari, dan distribusi waktu enam kategori.
    - Log dapat ditambah dan diedit selama sesi masih **Terbuka**.

=== "DCS / WCP"

    - Tiap responden membuka **Isi Sekarang**, menjawab seluruh item pada skala 1–5,
      lalu **Kirim Jawaban**.
    - Tombol kirim baru aktif setelah **semua** item dijawab. Jawaban yang sudah dikirim
      bersifat final (dapat dilihat via **Lihat Jawaban**).

---

## Bagian 3 — Memantau Progres

Pantau kelengkapan dari detail sesi:

- **Time Study / DCS / WCP**: kartu statistik menampilkan **Terdaftar** dan **Sudah Mengisi**
  (atau **Sudah diisi** per baris responden).
- **Task Inventory**: kartu **Selesai Tahap 1** dan **Selesai Tahap 3**; kolom status per
  responden menunjukkan **✓ Selesai** atau **Belum**.

!!! tip "Capai target minimum responden"
    Jangan menutup sesi sebelum jumlah responden yang mengisi memenuhi **Min. Responden**
    yang ditetapkan, agar hasil agregasi sahih.

---

## Bagian 4 — Tahap Koordinator (khusus Task Inventory)

Setelah Tahap 1 cukup terkumpul:

1. Klik **Mulai Tahap 2 — Review Koordinator** (konfirmasikan semua Tahap 1 sudah dikirim).
2. Koordinator membuka **Buka Review Koordinator** dan memutuskan tiap tugas *partial*
   (yang tidak dipilih bulat): **Ya** (setujui) atau **Tidak** (tolak). Tersedia pintasan
   **Setujui Semua** / **Tolak Semua**. Klik **Simpan Keputusan**.
3. Klik **Mulai Tahap 3 — Bekukan Task Relevan**. Tugas final dibekukan =
   *unanimous* ∪ *disetujui koordinator*, lalu sesi masuk **TAHAP3**.

!!! warning "Tugas yang belum diputuskan"
    Saat masuk Tahap 3, tugas partial yang belum diputuskan koordinator **diabaikan**
    (tidak masuk daftar final). Pastikan koordinator menyelesaikan review.

---

## Bagian 5 — Menutup Sesi & Menjalankan Analisis

1. **Tutup sesi** setelah pengisian selesai / batas waktu tercapai:
    - **Time Study / DCS / WCP**: klik **Tutup Sesi** → status **Tertutup**.
    - **Task Inventory**: klik **Tutup Sesi** (dari TAHAP3) → status **CLOSED**.
2. **Jalankan analisis**:
    - **Task Inventory / Time Study**: klik **Jalankan Analisis** → status **Teranalisis**.
    - **DCS / WCP**: analisis diproses dari backend; hasil tersedia setelah sesi tertutup.
3. Tinjau hasil:
    - **Task Inventory**: tabel **Task Terpilih** (relevansi) dan **Hasil Agregasi**
      (jam/minggu, jam/tahun, penanda risiko DCS) sebagai masukan ABK.
    - **Time Study / DCS / WCP**: hasil tersedia di halaman laporan.

!!! danger "Tindakan tidak dapat dibatalkan"
    Penutupan sesi dan transisi tahap bersifat searah. Pastikan data lengkap sebelum
    menutup sesi atau berpindah tahap.

---

## Daftar Periksa (Checklist) Pelaksanaan

- [ ] Sesi dibuka (Terbuka / TAHAP1)
- [ ] Responden didaftarkan sesuai rencana
- [ ] Partisipan diberi tahu & dipandu mengisi
- [ ] Jumlah pengisi memenuhi Min. Responden
- [ ] (TI) Koordinator menyelesaikan review Tahap 2; Tahap 3 dibekukan & diisi
- [ ] Sesi ditutup
- [ ] Analisis dijalankan & hasil ditinjau
