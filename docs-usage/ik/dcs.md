# IK-06 — DCS (Demand-Control-Support)

Langkah teknis menjalankan kuesioner **DCS** di aplikasi.

Bagian **A–E** untuk **Administrator**, **F** untuk **Partisipan**. Untuk alur, lihat
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

## E. Demo Pengisian (Administrator)

> Untuk **mencontohkan** cara mengisi kuesioner kepada partisipan — mis. saat sosialisasi —
> tanpa membuat responden atau menyimpan jawaban apa pun.

1. Dari halaman **DCS**, klik tombol **Demo Pengisian** di pojok kanan atas (atau buka
   `/dcs/demo` langsung). Hanya administrator yang dapat membukanya.
2. Halaman menampilkan kuesioner **persis** seperti yang dilihat partisipan (pop-up petunjuk,
   seluruh pernyataan, pilihan skala 1–5) dengan **banner "Mode Demo"** di atas form.
3. Pilih jawaban dan tekan **Simpan** atau **Kirim Jawaban** untuk memperagakan alurnya —
   **tidak ada data yang tersimpan**: tidak ada responden dibuat, tidak ada draft, tidak ada
   submit ke server.
4. Setelah menekan **Kirim Jawaban**, muncul panel **"Peragaan selesai."**. Klik **Ulangi Demo**
   untuk mengosongkan pilihan dan memperagakan lagi, atau **Kembali ke DCS**.

!!! note "Demo tidak memengaruhi hasil"
Mode demo sepenuhnya terpisah dari data studi — aman diperagakan berkali-kali kapan saja,
termasuk saat instrumen sudah berisi responden asli.

---

## F. Mengisi Kuesioner (Partisipan)

1. Buka **Kuesioner Saya** → pada kartu **DCS** yang berstatus terbuka & belum diisi, klik
   **Isi Sekarang**.
2. Selama kuesioner belum dikirim, pop-up **Petunjuk Pengisian** muncul otomatis saat halaman
   dibuka — berisi penjelasan tiga aspek DCS, aturan menjawab, arti skala 1–5, dan dua contoh
   pengisian (ilustrasi statis, bukan bagian jawaban Anda). Tutup dengan tombol **Saya
   Mengerti, Mulai Mengisi**, ikon **X**, klik area luar pop-up, atau tombol **Esc**. Pop-up
   ini dapat dibuka lagi kapan saja lewat tombol **Petunjuk Pengisian** di pojok kanan atas
   halaman.
3. Kuesioner tersusun per **sub-skala**. Untuk tiap pernyataan, pilih satu nilai:
   - **1 — Sangat Tidak Setuju**
   - **2 — Tidak Setuju**
   - **3 — Ragu-ragu**
   - **4 — Setuju**
   - **5 — Sangat Setuju**
4. Pantau penghitung _"{terjawab} / {total} pernyataan dijawab"_ di bagian bawah. Klik
   **Simpan** kapan saja untuk menyimpan progres tanpa finalisasi.
5. Setelah **semua** item dijawab, klik **Kirim Jawaban**.

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
