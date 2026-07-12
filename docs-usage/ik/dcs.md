# IK-06 — DCS (Demand-Control-Support)

Langkah teknis menjalankan kuesioner **DCS** di aplikasi.

Bagian **A–D** untuk **Administrator**, **E** untuk **Partisipan**. Untuk alur, lihat
[SOP Persiapan DCS](../sop/persiapan-dcs.md) dan
[SOP Pelaksanaan DCS](../sop/pelaksanaan-dcs.md).

DCS = 3 sub-skala, 42 item, skala 1–5. **Instrumen tunggal (singleton)** — tidak ada lagi
konsep "sesi" atau "buat sesi": satu baris instrumen tetap untuk seluruh studi, dengan
status `Terbuka → Tertutup → Teranalisis`.

---

## A. Halaman Instrumen DCS

1. Buka **DCS** dari navigasi. Halaman menampilkan **kartu status** (badge status, catatan,
   jumlah responden yang sudah mengisi dari total, dan Min. Responden), **aksi instrumen**,
   form **Tugaskan Responden** (bila status Terbuka), dan **Daftar Responden**.
2. Untuk mengubah **Min. Responden** atau **Catatan**, klik **Ubah pengaturan instrumen**,
   isi field, lalu **Simpan**.

---

## B. Aksi Instrumen

Bagian aksi menampilkan tombol sesuai status:

| Status      | Tombol                | Hasil                                                    |
| ----------- | --------------------- | -------------------------------------------------------- |
| Terbuka     | **Tutup Pengisian**   | → Tertutup (partisipan tidak bisa mengisi lagi)          |
| Tertutup    | **Jalankan Analisis** | → Teranalisis (aktif hanya bila submit ≥ Min. Responden) |
| Tertutup    | **Buka Ulang**        | → Terbuka kembali                                        |
| Teranalisis | **Lihat Hasil**       | Buka halaman hasil agregat (`/dcs/hasil`)                |

!!! note "Jalankan Analisis bisa nonaktif"
Bila jumlah responden ber-submit belum mencapai **Min. Responden**, tombol **Jalankan
Analisis** nonaktif dan alasannya ditampilkan di bawah tombol.

---

## C. Menugaskan Responden

> Hanya saat status **Terbuka**. Bagian **Tugaskan Responden**.

1. Centang satu atau lebih partisipan pada daftar (gunakan **Pilih semua** /
   **Batalkan pilihan** untuk mempercepat). Partisipan yang sudah ditugaskan tidak lagi
   muncul di daftar ini.
2. Klik **Tugaskan Terpilih (N)**. Seluruh partisipan tercentang langsung menjadi responden
   DCS dalam satu kali submit (nama & label jabatan diisi otomatis dari data partisipan).
3. Responden muncul di **Daftar Responden** dengan **Status Isian** = **Belum diisi**.
4. Untuk menghapus responden yang belum mengisi, klik **Hapus** (konfirmasi muncul).

---

## D. Melihat Hasil Agregat (setelah Teranalisis)

1. Dari halaman **DCS**, klik **Lihat Hasil** (atau buka `/dcs/hasil` langsung).
2. Halaman menampilkan **K-Index Psikososial** (dan komponen WCP Risk-nya) di bagian atas,
   lalu tabel skor per **sub-skala**: jumlah responden, mean, standar deviasi, dan
   Cronbach's alpha.
3. Untuk hasil satu responden, klik **Lihat Hasil** pada baris responden di halaman **DCS**.

!!! note "K-Index bergantung pada WCP"
K-Index tampil "—" bila instrumen WCP belum memiliki responden ber-submit — bukan
kesalahan, hanya menunggu data WCP tersedia.

---

## E. Mengisi Kuesioner (Partisipan)

1. Buka **Kuesioner Saya** → pada kartu **DCS** yang berstatus terbuka & belum diisi, klik
   **Isi Sekarang**.
2. Kuesioner tersusun per **sub-skala**. Untuk tiap pernyataan, pilih satu nilai:
   - **1 — Sangat Tidak Setuju**
   - **2 — Tidak Setuju**
   - **3 — Ragu-ragu**
   - **4 — Setuju**
   - **5 — Sangat Setuju**
3. Pantau penghitung _"{terjawab} / {total} pernyataan dijawab"_ di bagian bawah. Klik
   **Simpan** kapan saja untuk menyimpan progres tanpa finalisasi.
4. Setelah **semua** item dijawab, klik **Kirim Jawaban**.

!!! warning "Semua wajib dijawab saat kirim final"
Tombol **Kirim Jawaban** aktif hanya bila seluruh pernyataan terjawab. Jika belum,
muncul _"Semua pernyataan wajib dijawab sebelum mengirim."_ — namun **Simpan** (draft)
dapat dipakai kapan saja meski belum lengkap.

!!! success "Setelah dikirim"
Muncul _"Jawaban berhasil dikirim!"_. Jawaban bersifat final; nanti dapat dibuka lagi
lewat tombol **Lihat Jawaban** (mode baca-saja).

---

<!-- Screenshot: halaman instrumen DCS dengan kartu status, form tugaskan responden, dan daftar responden -->
<!-- Screenshot: halaman hasil DCS dengan K-Index dan tabel skor per sub-skala -->
