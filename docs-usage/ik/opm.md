# IK-08 — OPM (Rating Tugas)

Langkah teknis menjalankan kuesioner **OPM** (Occupational Profile Measure — Rating Tugas)
di aplikasi.

Bagian **A–D** untuk **Administrator**, **E** untuk **Partisipan**. Untuk alur, lihat
[SOP Persiapan OPM](../sop/persiapan-opm.md) dan
[SOP Pelaksanaan OPM](../sop/pelaksanaan-opm.md).

OPM menilai **setiap task** hasil **Task Inventory** yang sudah dibekukan (Tahap 3) pada
3 dimensi skala 1–5: **Importance**, **Frequency**, **Criticality**. Status analisis:
`Draft → Terbuka → Tertutup → Teranalisis`.

!!! note "Satu analisis per jabatan PER CABANG"
Setiap jabatan boleh memiliki **satu Analisis Jabatan OPM per cabang** (Bandung dan
Semarang berdampingan) — bukan lagi satu analisis untuk seluruh jabatan. **Cabang
Analisis Jabatan OPM mengikuti cabang Analisis Jabatan Task Inventory sumbernya**,
tidak diisi terpisah saat membuat analisis. Jabatan harus sudah memiliki **SME panel**
dengan anggota, dan Analisis Jabatan Task Inventory sumbernya harus sudah dibekukan
(status Tahap 3/Tertutup/Teranalisis dengan task terpilih) **dan sudah punya cabang
terisi**.

---

## A. Memulai Analisis Jabatan

1. Buka **OPM** dari navigasi. Daftar Analisis Jabatan menampilkan **Keterangan**,
   **Jabatan**, **Cabang**, **Status**, **Jumlah Task**, **Dibuat**.
2. Klik **+ Mulai Analisis Jabatan**.
3. Isi formulir:
   - **Jabatan** (wajib) — hanya menampilkan jabatan yang sudah memiliki SME panel.
     Setelah dipilih, aplikasi menampilkan **jumlah anggota SME panel** jabatan itu.
   - **Analisis Jabatan Task Inventory (sumber task)** (wajib) — hanya menampilkan
     Analisis Jabatan TI milik jabatan terpilih yang sudah dibekukan **dan sudah punya
     cabang terisi** (ditampilkan sebagai `cabang — N task`). Tidak ada field cabang
     terpisah — cabang Analisis Jabatan OPM mengikuti cabang sesi TI yang dipilih di
     sini.
   - **Periode** (wajib, format `YYYY-MM`, mis. `2026-06`)
   - **Min. Responden** (default 3) dan **Maks. Responden** (harus ≥ min). **Maks. Responden**
     terisi otomatis sebesar jumlah anggota SME panel jabatan terpilih.
   - **Catatan (opsional)**
4. Klik **Mulai Analisis Jabatan**. Task dari Analisis Jabatan TI sumber di-**snapshot**
   ke Analisis Jabatan OPM, dan **responden dibuat otomatis** dari seluruh anggota SME
   panel jabatan tersebut.

!!! warning "Maks. Responden tidak boleh lebih kecil dari jumlah anggota panel"
Karena seluruh anggota SME panel otomatis menjadi responden, aplikasi **menolak**
pembuatan analisis bila **Maks. Responden** diturunkan di bawah jumlah anggota panel —
mis. _"Jumlah anggota SME panel (11) melebihi max_responden (10)."_ Naikkan
**Maks. Responden** (minimal sebesar jumlah anggota panel) atau kurangi anggota panelnya.

!!! warning "Belum ada Analisis Jabatan TI yang dibekukan"
Jika dropdown **Analisis Jabatan Task Inventory** kosong setelah memilih jabatan, berarti
belum ada Analisis Jabatan TI jabatan tersebut yang mencapai Tahap 3 (task dibekukan).
Selesaikan [IK-04 Task Inventory](task-inventory.md) sampai tahap 3 terlebih dahulu.

!!! warning "Cabang sesi TI masih kosong"
Bila dropdown **Analisis Jabatan Task Inventory** kosong padahal Analisis Jabatan TI
jabatan itu sudah dibekukan, kemungkinan cabangnya belum terisi (sesi TI lama). Isi
cabang Analisis Jabatan TI tersebut terlebih dahulu (lihat [IK-04 Task
Inventory](task-inventory.md)), lalu kembali ke sini.

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
   terdaftar, duplikat dalam pilihan, bukan anggota SME panel, atau analisis jabatan ini
   sudah mencapai **Maks. Responden**.

---

## E. Mengisi Kuesioner (Partisipan)

1. Buka **Kuesioner Saya** → pada kartu **OPM** yang berstatus terbuka & belum diisi, klik
   **Isi Sekarang**.
2. Selama kuesioner belum dikirim, pop-up **Petunjuk Pengisian** muncul otomatis saat halaman
   dibuka — berisi **deskripsi lengkap kelima titik skala (1–5)** pada tiap dimensi
   (Importance/Frequency/Criticality), penegasan bahwa **"gagal" pada Criticality berarti
   tugas tidak terlaksana** (bukan sekadar hasilnya mengecewakan pihak lain), aturan bahwa
   tiap task wajib dinilai ketiga dimensinya, peringatan bahwa **Simpan** melewati task yang
   belum lengkap, dan **dua contoh pengisian kontras** (Contoh A bernilai tinggi, Contoh B
   bernilai rendah — menegaskan bahwa nilai rendah adalah jawaban yang sah, bukan kesalahan
   pengisian). Tutup dengan tombol **Saya Mengerti, Mulai Mengisi**, ikon **X**, klik area
   luar pop-up, atau tombol **Esc**. Pop-up ini dapat dibuka lagi kapan saja lewat tombol
   **Petunjuk Pengisian** di pojok kanan atas halaman.
3. Kuesioner tersusun **per task**. Untuk setiap task, isi tiga dimensi (skala 1–5) — kelima
   titik skala tiap dimensi kini bertanda label singkat (bukan lagi angka telanjang untuk
   nilai 2–4), deskripsi lengkapnya ada di pop-up Petunjuk Pengisian:
   - **Importance** — seberapa penting (1 Tidak penting … 2 Kurang penting … 3 Cukup penting
     … 4 Penting … 5 Sangat penting)
   - **Frequency** — seberapa sering (1 Insidental … 2 Kadang-kadang … 3 Rutin … 4 Sering …
     5 Harian)
   - **Criticality** — dampak jika gagal (1 Dampak minimal … 2 Dampak kecil … 3 Dampak sedang
     … 4 Dampak besar … 5 Dampak kritis)
   - **Catatan** (opsional)

!!! info "Nilai bawaan (prefill)"
Sebagian task mungkin sudah **terisi otomatis** saat halaman dibuka — nilai standar dari
Task Bank (bila tersedia untuk task itu), ditandai badge **"Nilai bawaan"** di pojok
kanan atas kartu task. Ini bukan jawaban final Anda: periksa dan **ubah bila menurut
Anda tidak sesuai** keadaan pekerjaan Anda yang sebenarnya. Badge hilang otomatis begitu
salah satu dari ketiga dimensi task itu diubah. Task tanpa nilai standar tetap tampil
kosong seperti biasa.

4. Pantau penghitung _"{lengkap} / {total} tugas lengkap"_ di bagian bawah — satu task
   dianggap lengkap bila ketiga dimensi terisi (termasuk yang masih nilai bawaan).
5. Setelah **semua** task lengkap, klik **Kirim Jawaban**. Bila masih ada task bertanda
   **"Nilai bawaan"** yang belum Anda ubah, muncul dialog konfirmasi yang menyebutkan
   jumlahnya (_"N dari M task masih memakai nilai bawaan"_) — klik **OK** untuk tetap
   mengirim apa adanya, atau **Batal** untuk kembali memeriksa task tersebut terlebih
   dahulu (tidak ada apa pun yang terkirim bila Batal).

!!! success "Setelah dikirim"
Muncul _"Jawaban berhasil dikirim!"_. Jawaban bersifat final; kuesioner dapat dibuka
lagi dalam mode baca-saja.

---

## F. Melihat Hasil

Setelah analisis **Teranalisis**, buka halaman **Hasil** dari detail analisis. Header
halaman menampilkan **cabang** analisis (mengikuti cabang Analisis Jabatan TI sumbernya)
di samping periode dan jumlah responden — penting untuk membedakan hasil Bandung vs
Semarang pada jabatan yang sama. Tabel menampilkan per task: rata-rata (mean) &
simpangan baku (SD) tiap dimensi, badge **Selection Essential** dan **Workload
Essential**, serta proporsi responden yang menandai task tersebut esensial secara
individual.

---

<!-- Screenshot: form kuesioner OPM per task dengan 3 dimensi rating -->
