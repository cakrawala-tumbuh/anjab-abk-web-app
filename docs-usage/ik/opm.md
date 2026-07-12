# IK-08 — OPM (Rating Tugas)

Langkah teknis menjalankan kuesioner **OPM** (Occupational Profile Measure — Rating Tugas)
di aplikasi.

Bagian **A–D** untuk **Administrator**, **E** untuk **Partisipan**. Untuk alur, lihat
[SOP Persiapan OPM](../sop/persiapan-opm.md) dan
[SOP Pelaksanaan OPM](../sop/pelaksanaan-opm.md).

OPM menilai **setiap task** hasil **Task Inventory** yang sudah dibekukan (Tahap 3) pada
3 dimensi skala 1–5: **Importance**, **Frequency**, **Criticality**. Status analisis:
`Draft → Terbuka → Tertutup → Teranalisis`.

!!! note "Satu analisis per jabatan"
Setiap jabatan hanya boleh memiliki **satu** Analisis Jabatan OPM. Jabatan harus sudah
memiliki **SME panel** dengan anggota, dan Analisis Jabatan Task Inventory sumbernya
harus sudah dibekukan (status Tahap 3/Tertutup/Teranalisis dengan task terpilih).

---

## A. Memulai Analisis Jabatan

1. Buka **OPM** dari navigasi. Daftar Analisis Jabatan menampilkan **Keterangan**,
   **Jabatan**, **Status**, **Jumlah Task**, **Dibuat**.
2. Klik **+ Mulai Analisis Jabatan**.
3. Isi formulir:
   - **Jabatan** (wajib) — hanya menampilkan jabatan yang sudah memiliki SME panel.
   - **Analisis Jabatan Task Inventory (sumber task)** (wajib) — hanya menampilkan
     Analisis Jabatan TI milik jabatan terpilih yang sudah dibekukan (ditampilkan
     sebagai `periode — N task`).
   - **Periode** (wajib, format `YYYY-MM`, mis. `2026-06`)
   - **Min. Responden** (default 3) dan **Maks. Responden** (default 10, harus ≥ min)
   - **Catatan (opsional)**
4. Klik **Mulai Analisis Jabatan**. Task dari Analisis Jabatan TI sumber di-**snapshot**
   ke Analisis Jabatan OPM, dan **responden dibuat otomatis** dari seluruh anggota SME
   panel jabatan tersebut.

!!! warning "Belum ada Analisis Jabatan TI yang dibekukan"
Jika dropdown **Analisis Jabatan Task Inventory** kosong setelah memilih jabatan, berarti
belum ada Analisis Jabatan TI jabatan tersebut yang mencapai Tahap 3 (task dibekukan).
Selesaikan [IK-04 Task Inventory](task-inventory.md) sampai tahap 3 terlebih dahulu.

---

## B. Membuka & Menutup Analisis, Menjalankan Analisis

Bagian transisi menampilkan tombol sesuai status:

| Status   | Tombol                | Hasil                                              |
| -------- | --------------------- | -------------------------------------------------- |
| Draft    | **Buka Analisis**     | → Terbuka                                          |
| Draft    | **Hapus Analisis**    | Menghapus analisis (_tidak dapat dibatalkan_)      |
| Terbuka  | **Tutup Analisis**    | → Tertutup                                         |
| Tertutup | **Jalankan Analisis** | → Teranalisis, lalu diarahkan ke halaman **Hasil** |

---

## C. Task yang Dinilai (Snapshot)

Detail analisis menampilkan tabel **Task yang Dinilai** — kode, uraian tugas, dan tugas
pokok induk, hasil snapshot dari Analisis Jabatan Task Inventory sumber saat Analisis
Jabatan OPM dibuat. Daftar ini tidak berubah meski Analisis Jabatan TI sumber berubah
setelahnya.

---

## D. Menambah/Menghapus Responden

> Bagian **Tambah Responden**, tersedia saat status **Draft** atau **Terbuka**.

1. Dropdown **Anggota SME Panel** hanya menampilkan partisipan yang merupakan anggota SME
   panel jabatan analisis ini **dan belum terdaftar** sebagai responden.
2. Pilih partisipan, klik **+ Daftarkan**.
3. Untuk menghapus responden yang **belum mengisi**, klik **Hapus** pada baris terkait
   (konfirmasi muncul).

### D.1 Menambah Banyak Responden Sekaligus

Di bawah formulir **Tambah Responden**, tersedia bagian **Atau tugaskan banyak
sekaligus**:

1. Centang anggota SME panel yang belum terdaftar (**Pilih semua**/**Batalkan pilihan**
   tersedia).
2. Klik **Tugaskan Terpilih (N)**. Nama & label jabatan responden diisi otomatis —
   tidak perlu diketik manual seperti formulir tunggal.
3. Aplikasi menampilkan ringkasan berhasil/dilewati. Partisipan dilewati bila: sudah
   terdaftar, duplikat dalam pilihan, bukan anggota SME panel, atau sesi sudah mencapai
   **Maks. Responden**.

---

## E. Mengisi Kuesioner (Partisipan)

1. Buka **Kuesioner Saya** → pada kartu **OPM** yang berstatus terbuka & belum diisi, klik
   **Isi Sekarang**.
2. Kuesioner tersusun **per task**. Untuk setiap task, isi tiga dimensi (skala 1–5):
   - **Importance** — seberapa penting (1 Tidak penting … 5 Sangat penting)
   - **Frequency** — seberapa sering (1 Insidental … 5 Sangat sering/Harian)
   - **Criticality** — dampak jika gagal (1 Dampak minimal … 5 Dampak kritis)
   - **Catatan** (opsional)
3. Pantau penghitung _"{lengkap} / {total} tugas lengkap"_ di bagian bawah — satu task
   dianggap lengkap bila ketiga dimensi terisi.
4. Setelah **semua** task lengkap, klik **Kirim Jawaban**.

!!! success "Setelah dikirim"
Muncul _"Jawaban berhasil dikirim!"_. Jawaban bersifat final; kuesioner dapat dibuka
lagi dalam mode baca-saja.

---

## F. Melihat Hasil

Setelah analisis **Teranalisis**, buka halaman **Hasil** dari detail analisis. Tabel menampilkan
per task: rata-rata (mean) & simpangan baku (SD) tiap dimensi, badge **Selection
Essential** dan **Workload Essential**, serta proporsi responden yang menandai task
tersebut esensial secara individual.

---

<!-- Screenshot: form kuesioner OPM per task dengan 3 dimensi rating -->
