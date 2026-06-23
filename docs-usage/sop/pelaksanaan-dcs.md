# SOP Pelaksanaan — DCS (Demand-Control-Support)

Prosedur baku menjalankan pengambilan data kuesioner **DCS** — dari membuka sesi hingga
hasil tersedia.

**Tujuan:** mengumpulkan jawaban 42 item DCS dari responden yang tepat secara lengkap.

**Penanggung jawab:** Administrator studi.

**Prasyarat:** [SOP Persiapan DCS](persiapan-dcs.md) telah selesai.

**Langkah teknis:** [IK-06 DCS](../ik/dcs.md).

Status sesi: `Draft → Terbuka → Tertutup → Teranalisis`.

---

## Alur Ringkas

```
Buka Sesi → daftar responden → partisipan isi kuesioner (42 item)
   → pantau kelengkapan → Tutup Sesi → hasil diproses
```

---

## 1. Membuka Sesi & Mendaftarkan Responden

1. Buka detail sesi (status **Draft**).
2. Klik **Buka Sesi** → status menjadi **Terbuka**.
3. Pada **Tambah Responden**, pilih partisipan (mengisi otomatis Nama & Label Jabatan),
   lalu klik **+ Daftarkan**.

> Langkah teknis: [IK-06 bagian B–C](../ik/dcs.md#b-membuka-menutup-sesi).

---

## 2. Pengisian Kuesioner oleh Partisipan

1. Informasikan ke responden bahwa kuesioner sudah aktif dan batas waktunya.
2. Tiap responden membuka **Kuesioner Saya** → kartu **DCS** → **Isi Sekarang**, menjawab
   seluruh item pada skala **1–5**, lalu **Kirim Jawaban**.

> Langkah teknis: [IK-06 bagian D](../ik/dcs.md#d-mengisi-kuesioner-partisipan).

!!! note "Semua item wajib & final"
    Tombol **Kirim Jawaban** aktif hanya bila semua item terjawab. Setelah dikirim,
    jawaban final (dapat dilihat via **Lihat Jawaban**).

---

## 3. Memantau Kelengkapan

Pantau dari detail sesi: kartu **Terdaftar** dan **Sudah Mengisi**, serta kolom
**Status Isian** per responden. Jangan menutup sesi sebelum jumlah pengisi memenuhi
**Min. Responden**.

---

## 4. Menutup Sesi & Hasil

1. Klik **Tutup Sesi** → status **Tertutup**.
2. Analisis diproses dari backend; hasil tersedia di halaman laporan setelah sesi tertutup.

> Langkah teknis: [IK-06 bagian B](../ik/dcs.md#b-membuka-menutup-sesi).

!!! danger "Tidak dapat dibatalkan"
    Penutupan sesi bersifat searah. Pastikan data lengkap sebelum menutup.

---

## Daftar Periksa (Checklist) Pelaksanaan DCS

- [ ] Sesi dibuka & responden didaftarkan
- [ ] Responden diberi tahu & dipandu mengisi
- [ ] Jumlah pengisi memenuhi Min. Responden
- [ ] Sesi ditutup & hasil tersedia
