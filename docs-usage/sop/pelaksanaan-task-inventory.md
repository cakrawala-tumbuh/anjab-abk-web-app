# SOP Pelaksanaan — Task Inventory (TI)

Prosedur baku menjalankan pengambilan data **Task Inventory** — dari membuka sesi hingga
menjalankan analisis.

**Tujuan:** mengumpulkan seleksi relevansi tugas (Tahap 1), keputusan koordinator
(Tahap 2), dan rincian beban kerja CalHR (Tahap 3) secara lengkap, lalu memprosesnya.

**Penanggung jawab:** Administrator studi (dibantu koordinator panel).

**Prasyarat:** [SOP Persiapan Task Inventory](persiapan-task-inventory.md) telah selesai.

**Langkah teknis:** [IK-04 Task Inventory](../ik/task-inventory.md).

Status sesi: `DRAFT → TAHAP1 → TAHAP2 → TAHAP3 → CLOSED → ANALYZED`.

---

## Alur Ringkas

```
Mulai Tahap 1 → daftar responden → partisipan isi Tahap 1
   → Mulai Tahap 2 (review koordinator) → Mulai Tahap 3 (bekukan task)
   → partisipan isi Tahap 3 → Tutup Sesi → Jalankan Analisis
```

---

## 1. Membuka Tahap 1 & Mendaftarkan Responden

1. Buka detail sesi (status **DRAFT**).
2. Klik **Mulai Tahap 1** → status menjadi **TAHAP1**.
3. Daftarkan responden sesuai anggota panel (boleh juga saat masih DRAFT). Pilih dari
   partisipan agar nama terisi, lalu klik **+ Daftarkan**.

> Langkah teknis: [IK-04 bagian B](../ik/task-inventory.md#b-mendaftarkan-responden).

---

## 2. Pengisian Tahap 1 oleh Partisipan

1. Informasikan ke anggota panel bahwa seleksi sudah dibuka beserta batas waktunya.
2. Tiap anggota membuka **Isi Tahap 1** dan menyeleksi tugas relevan melalui 3 langkah
   (Tugas Pokok → Detil Tugas → Uraian Tugas), lalu **Kirim Seleksi**.

> Langkah teknis: [IK-04 bagian E](../ik/task-inventory.md#e-mengisi-tahap-1-seleksi-partisipan).

!!! warning "Final setelah dikirim"
Seleksi Tahap 1 yang sudah dikirim tidak dapat diubah. Pantau kolom **Selesai Tahap 1**.

---

## 3. Tahap 2 — Review Koordinator

1. Setelah Tahap 1 cukup terkumpul, klik **Mulai Tahap 2 — Review Koordinator** (OK bila
   semua sudah submit; Cancel untuk memaksa lanjut).
2. Koordinator membuka **Buka Review Koordinator**, memutuskan tiap tugas _partial_
   (**Ya**/**Tidak**, atau **Setujui Semua**/**Tolak Semua**), lalu **Simpan Keputusan**.

> Langkah teknis: [IK-04 bagian D](../ik/task-inventory.md#d-review-koordinator-tahap-2).

---

## 4. Tahap 3 — Detailing

1. Klik **Mulai Tahap 3 — Bekukan Task Relevan** → tugas final dibekukan
   (_unanimous_ ∪ _disetujui koordinator_), status menjadi **TAHAP3**.
2. Tiap anggota membuka **Isi Tahap 3**, menandai tugas yang dikerjakan, mengisi rincian
   CalHR, lalu **Kirim Detail**.

> Langkah teknis: [IK-04 bagian F](../ik/task-inventory.md#f-mengisi-tahap-3-detailing-partisipan).

!!! warning "Tugas belum diputuskan diabaikan"
Tugas partial yang belum diputuskan koordinator tidak masuk daftar final saat masuk
Tahap 3.

---

## 5. Menutup Sesi & Analisis

1. Klik **Tutup Sesi** (dari TAHAP3) → status **CLOSED**.
2. Klik **Jalankan Analisis** → status **ANALYZED**.
3. Tinjau **Task Terpilih** (relevansi) dan **Hasil Agregasi** (jam/minggu, jam/tahun,
   penanda risiko DCS) sebagai masukan ABK.

> Langkah teknis: [IK-04 bagian G](../ik/task-inventory.md#g-melihat-hasil-setelah-analisis).

!!! danger "Tidak dapat dibatalkan"
Penutupan sesi dan transisi tahap bersifat searah. Pastikan data lengkap & jumlah
pengisi memenuhi **Min. Responden** sebelum menutup/berpindah tahap.

---

## Daftar Periksa (Checklist) Pelaksanaan TI

- [ ] Tahap 1 dibuka & responden didaftarkan
- [ ] Anggota panel menyelesaikan seleksi Tahap 1
- [ ] Koordinator menyelesaikan review Tahap 2
- [ ] Tahap 3 dibekukan & rincian CalHR diisi
- [ ] Jumlah pengisi memenuhi Min. Responden
- [ ] Sesi ditutup & analisis dijalankan
- [ ] Hasil agregasi ditinjau
