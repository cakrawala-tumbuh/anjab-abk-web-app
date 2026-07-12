# SOP Pelaksanaan — Time Study (TS)

Prosedur baku menjalankan pengambilan data **Time Study** — dari penugasan partisipan
hingga pencatatan log harian selesai.

**Tujuan:** mengumpulkan log harian (jam masuk–keluar, kategori hari, distribusi waktu)
secara lengkap selama rentang pencatatan.

**Penanggung jawab:** Administrator studi.

**Prasyarat:** [SOP Persiapan Time Study](persiapan-time-study.md) telah selesai.

**Langkah teknis:** [IK-05 Time Study](../ik/time-study.md).

Time Study tidak memakai sesi maupun tahap analisis — hanya status penugasan
**Aktif**/**Nonaktif**.

---

## Alur Ringkas

```
Tugaskan partisipan (langsung Aktif) → partisipan catat log harian (selama rentang)
   → pantau kelengkapan → Nonaktifkan penugasan setelah rentang selesai
```

---

## 1. Menugaskan Partisipan

1. Buka **Time Study**, klik **+ Tugaskan Partisipan**.
2. Pilih partisipan (jabatan ditampilkan otomatis), isi **Catatan** bila perlu, klik
   **Tugaskan**. Penugasan langsung berstatus **Aktif** — tidak perlu dibuka manual.

> Langkah teknis: [IK-05 bagian A](../ik/time-study.md#a-menugaskan-partisipan).

---

## 2. Pencatatan Log oleh Partisipan

1. Informasikan ke partisipan **rentang hari pencatatan** (mis. dua minggu kerja) dan
   batas waktunya.
2. Tiap partisipan membuka **Time Study** dari **Kuesioner Saya**, lalu **+ Tambah Log**
   setiap hari kerja: tanggal, waktu masuk–keluar, kategori hari
   (**Hijau**/**Kuning**/**Merah**), dan distribusi waktu enam kategori.
3. Log dapat diedit selama penugasan masih **Aktif**.

> Langkah teknis: [IK-05 bagian C–D](../ik/time-study.md#c-mengisi-log-harian-partisipan).

!!! tip "Catat harian, jangan menumpuk"
Dorong partisipan mengisi log di hari yang sama agar estimasi waktu lebih akurat.

---

## 3. Memantau Kelengkapan

Pantau dari detail penugasan: statistik **Log Harian Terisi** menunjukkan jumlah hari
yang sudah dicatat. Pastikan jumlah hari pencatatan memadai sebelum menonaktifkan
penugasan.

---

## 4. Menonaktifkan Penugasan Setelah Selesai

Setelah rentang pencatatan selesai, klik **Nonaktifkan Penugasan** pada detail
penugasan → status **Nonaktif**. Partisipan tidak dapat lagi menambah/mengedit log,
tetapi data log yang sudah ada tetap dapat dilihat. Bila rentang perlu diperpanjang,
klik **Aktifkan Kembali**.

> Langkah teknis: [IK-05 bagian B](../ik/time-study.md#b-mengelola-penugasan-aktifnonaktif-hapus).

!!! note "Tidak ada tahap analisis di aplikasi ini"
Berbeda dari TI/OPM/DCS/WCP, Time Study tidak memiliki tombol "Jalankan Analisis" atau
halaman hasil agregat di aplikasi ini — log harian yang terkumpul diolah lebih lanjut
di luar alur penugasan (mis. untuk kebutuhan ABK).

---

## Daftar Periksa (Checklist) Pelaksanaan TS

- [ ] Partisipan ditugaskan (penugasan berstatus Aktif)
- [ ] Rentang & batas waktu pencatatan disosialisasikan
- [ ] Partisipan mencatat log harian sepanjang rentang
- [ ] Kelengkapan log dipantau
- [ ] Penugasan dinonaktifkan setelah rentang pencatatan selesai
