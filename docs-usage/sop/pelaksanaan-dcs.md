# SOP Pelaksanaan — DCS (Demand-Control-Support)

Prosedur baku menjalankan pengambilan data kuesioner **DCS** — dari menugaskan responden
hingga hasil tersedia.

**Tujuan:** mengumpulkan jawaban 42 item DCS dari responden yang tepat secara lengkap.

**Penanggung jawab:** Administrator studi.

**Prasyarat:** [SOP Persiapan DCS](persiapan-dcs.md) telah selesai.

**Langkah teknis:** [IK-06 DCS](../ik/dcs.md).

Status instrumen: `Terbuka → Tertutup → Teranalisis` (instrumen tunggal, tanpa sesi).

---

## Alur Ringkas

```
Tugaskan responden → partisipan isi kuesioner (42 item)
   → pantau kelengkapan → Tutup Pengisian → Jalankan Analisis → hasil tersedia
```

---

## 1. Menugaskan Responden

1. Buka halaman **DCS** (status **Terbuka** sejak awal — tidak perlu dibuka manual).
2. Pada **Tugaskan Responden**, centang satu atau lebih partisipan, lalu klik
   **Tugaskan Terpilih (N)**. Seluruh partisipan tercentang langsung menjadi responden
   dalam satu kali submit.

> Langkah teknis: [IK-06 bagian C](../ik/dcs.md#c-menugaskan-responden).

---

## 2. Pengisian Kuesioner oleh Partisipan

1. Informasikan ke responden bahwa kuesioner sudah aktif dan batas waktunya.
2. Tiap responden membuka **Kuesioner Saya** → kartu **DCS** → **Isi Sekarang**, menjawab
   seluruh item pada skala **1–5**, lalu **Kirim Jawaban**. Progres dapat disimpan
   sewaktu-waktu lewat **Simpan** sebelum finalisasi.

> Langkah teknis: [IK-06 bagian E](../ik/dcs.md#e-mengisi-kuesioner-partisipan).

!!! note "Semua item wajib saat kirim final"
Tombol **Kirim Jawaban** aktif hanya bila semua item terjawab. Setelah dikirim,
jawaban final (dapat dilihat via **Lihat Jawaban**).

---

## 3. Memantau Kelengkapan

Pantau dari halaman **DCS**: kartu status menampilkan jumlah responden yang sudah mengisi
dari total, dan Min. Responden. Jangan menutup pengisian sebelum jumlah pengisi memenuhi
**Min. Responden**.

---

## 4. Menutup Pengisian & Menjalankan Analisis

1. Klik **Tutup Pengisian** → status **Tertutup**.
2. Klik **Jalankan Analisis** (aktif hanya bila submit ≥ Min. Responden) → status
   **Teranalisis**, langsung diarahkan ke halaman hasil.
3. Bila ternyata perlu tambahan responden, klik **Buka Ulang** untuk kembali ke status
   **Terbuka** (hanya bila belum Teranalisis).

> Langkah teknis: [IK-06 bagian B & D](../ik/dcs.md#b-aksi-instrumen).

!!! danger "Analisis tidak dapat dibatalkan"
Setelah **Jalankan Analisis** berhasil (status Teranalisis), instrumen tidak dapat
dibuka ulang lagi. Pastikan data lengkap sebelum menjalankan analisis.

---

## Daftar Periksa (Checklist) Pelaksanaan DCS

- [ ] Responden ditugaskan
- [ ] Responden diberi tahu & dipandu mengisi
- [ ] Jumlah pengisi memenuhi Min. Responden
- [ ] Pengisian ditutup & analisis dijalankan
- [ ] Hasil (K-Index & skor sub-skala) diverifikasi di `/dcs/hasil`
