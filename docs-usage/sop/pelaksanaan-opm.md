# SOP Pelaksanaan — OPM (Rating Tugas)

Prosedur baku menjalankan pengambilan data kuesioner **OPM** — dari membuka sesi hingga
hasil tersedia.

**Tujuan:** mengumpulkan rating Importance/Frequency/Criticality atas seluruh task
snapshot dari anggota SME panel jabatan terkait.

**Penanggung jawab:** Administrator studi.

**Prasyarat:** [SOP Persiapan OPM](persiapan-opm.md) telah selesai.

**Langkah teknis:** [IK-08 OPM](../ik/opm.md).

Status sesi: `Draft → Terbuka → Tertutup → Teranalisis`.

---

## Alur Ringkas

```
Buka Sesi → (responden sudah otomatis terisi dari SME panel)
   → anggota panel isi rating tiap task (Importance/Frequency/Criticality)
   → pantau kelengkapan → Tutup Sesi → Jalankan Analisis → Hasil tersedia
```

---

## 1. Membuka Sesi

1. Buka detail sesi OPM (status **Draft**).
2. Klik **Buka Sesi** → status menjadi **Terbuka**.
3. Responden pada sesi ini sudah terisi otomatis dari anggota SME panel jabatan tersebut
   sejak sesi dibuat. Bila ada anggota panel baru yang perlu ditambahkan, gunakan
   **Tambah Responden**.

> Langkah teknis: [IK-08 bagian B & D](../ik/opm.md#b-membuka-menutup-sesi-menjalankan-analisis).

---

## 2. Pengisian Kuesioner oleh Anggota Panel

1. Informasikan ke seluruh anggota SME panel bahwa kuesioner OPM sudah aktif.
2. Tiap anggota membuka **Kuesioner Saya** → kartu **OPM** → **Isi Sekarang**, menilai
   **setiap task** pada 3 dimensi (Importance/Frequency/Criticality, skala 1–5), lalu
   **Kirim Jawaban**.

> Langkah teknis: [IK-08 bagian E](../ik/opm.md#e-mengisi-kuesioner-partisipan).

!!! note "Semua task & dimensi wajib, jawaban final"
Tombol **Kirim Jawaban** aktif hanya bila seluruh task lengkap pada ketiga dimensi.
Setelah dikirim, jawaban final (dapat dilihat kembali dalam mode baca-saja).

---

## 3. Memantau Kelengkapan

Pantau dari detail sesi: kartu **Task**, **Terdaftar**, **Sudah Mengisi**, serta kolom
**Status Isian** per responden. Jangan menutup sesi sebelum jumlah pengisi memenuhi
**Min. Responden**.

---

## 4. Menutup Sesi, Menjalankan Analisis & Hasil

1. Klik **Tutup Sesi** → status **Tertutup**.
2. Klik **Jalankan Analisis** → status **Teranalisis**, otomatis diarahkan ke halaman
   **Hasil**.
3. Halaman **Hasil** menampilkan mean & SD tiap dimensi per task, beserta badge
   **Selection Essential** / **Workload Essential** dan proporsi individual.

> Langkah teknis: [IK-08 bagian B & F](../ik/opm.md#b-membuka-menutup-sesi-menjalankan-analisis).

!!! danger "Tidak dapat dibatalkan"
Penutupan sesi dan menjalankan analisis bersifat searah. Pastikan data lengkap
sebelum menutup sesi.

---

## Daftar Periksa (Checklist) Pelaksanaan OPM

- [ ] Sesi dibuka
- [ ] Anggota SME panel diberi tahu & dipandu mengisi rating tiap task
- [ ] Jumlah pengisi memenuhi Min. Responden
- [ ] Sesi ditutup, analisis dijalankan & hasil tersedia
