# IK-02 — Master Data

Langkah teknis mengelola data referensi yang dipakai di seluruh aplikasi.
Akses: **Administrator**.

Buka **Master Data** dari bilah navigasi. Tab tersedia: **Jenjang Pendidikan**,
**Sekolah**, **Jabatan**, **SME Panel**, **Mata Pelajaran**, **Instrumen DCS**,
**Instrumen WCP**, **Instrumen TI**, **Tugas Pokok**, **Detil Tugas**, **Uraian Tugas**.

---

## Urutan Pengisian (Dependensi)

Isi master data sesuai urutan ini agar pilihan dropdown saling tersedia:

1. **Jenjang Pendidikan** (tanpa dependensi)
2. **Sekolah** (butuh Jenjang Pendidikan)
3. **Mata Pelajaran** (tanpa dependensi)
4. **Jabatan** (opsional menautkan Sekolah sebagai unit kerja)
5. **SME Panel** (butuh Jabatan)
6. **Tugas Pokok** (tanpa dependensi)
7. **Uraian Tugas** & **Detil Tugas** (butuh Tugas Pokok)

> Partisipan (butuh Sekolah + Jabatan) dibahas di [IK-03 Partisipan](partisipan.md).

---

## Jenjang Pendidikan

1. **Master Data → Jenjang Pendidikan**. Daftar menampilkan kolom **Kode**, **Nama**,
   **Urutan**, **Status**.
2. Klik **+ Tambah Jenjang**.
3. Isi formulir:
   - **Kode** (wajib, mis. `SD`, `SMP`, `SMA`)
   - **Nama** (wajib, mis. `Sekolah Dasar`)
   - **Urutan** (angka; makin kecil makin atas)
   - **Aktif** (centang; default aktif)
4. Klik **Tambah Jenjang**.

---

## Sekolah

1. **Master Data → Sekolah**. Kolom: **Nama**, **Jenjang**, **NPSN**, **Kota**, **Status**.
2. Klik **+ Tambah Sekolah**.
3. Isi formulir:
   - **Nama** (wajib, mis. `SD Negeri 1 Bandung`)
   - **Jenjang Pendidikan** (wajib, pilih dari dropdown)
   - **NPSN** (opsional, 8 digit)
   - **Kota**, **Provinsi** (opsional)
   - **Aktif** (centang)
4. Klik **Tambah Sekolah**.

---

## Mata Pelajaran

1. **Master Data → Mata Pelajaran**. Kolom: **Kode**, **Nama**, **Kelompok**,
   **Deskripsi**, **Status**.
2. Klik **+ Tambah Mata Pelajaran**.
3. Isi formulir:
   - **Kode** (wajib, mis. `MTK`)
   - **Nama** (wajib, mis. `Matematika`)
   - **Kelompok** (wajib: **Umum**, **Peminatan**, **Muatan Lokal**, **Kejuruan**)
   - **Deskripsi** (opsional)
   - **Aktif** (centang)
4. Klik **Tambah Mata Pelajaran**.

---

## Jabatan

1. **Master Data → Jabatan**. Kolom: **Kode**, **Nama**, **Jenis**, **Deskripsi**, **Status**.
2. Klik **+ Tambah Jabatan**.
3. Isi formulir:
   - **Kode** (wajib, mis. `KS-001`)
   - **Nama** (wajib, mis. `Kepala Sekolah`)
   - **Jenis** (wajib: **Struktural**, **Fungsional**, **Teknisi**)
   - **Unit Kerja / Sekolah** (opsional; default `-- Tidak spesifik --`)
   - **Deskripsi** (opsional)
   - **Aktif** (centang)
4. Klik **Tambah Jabatan**.

---

## SME Panel

Panel ahli (Subject Matter Expert) untuk sebuah jabatan, dipakai pada Task Inventory.

1. **Master Data → SME Panel**. Kolom: **Jabatan**, **Jenis**, **Anggota**, **Status**, **Aksi**.
2. Klik **+ Tambah SME Panel**.
3. Isi formulir:
   - **Jabatan** (wajib). _Setiap jabatan hanya dapat memiliki satu SME panel._
   - **Aktif** (centang)
4. Klik **Tambah SME Panel**.
5. Untuk mengisi anggota, pada baris panel klik **Kelola anggota →**, lalu tambahkan
   partisipan sebagai anggota. Tetapkan koordinator panel sesuai kebutuhan Task Inventory.

---

## Tugas Pokok

1. **Master Data → Tugas Pokok**. Kolom: **Nama Tugas Pokok**, **ID**, **Aksi**.
2. Klik **+ Tambah Tugas Pokok**, isi nama tugas pokok, lalu simpan.
3. Gunakan **Edit / Hapus** pada kolom **Aksi** untuk mengubah.

---

## Uraian Tugas

1. **Master Data → Uraian Tugas**. Kolom: **Kode**, **Uraian**, **Unit**, **Jabatan ID**,
   **Tugas Pokok**, **Aksi**.
2. Klik **+ Tambah Uraian Tugas**, isi formulir (termasuk pilih **Tugas Pokok**), simpan.

---

## Detil Tugas

1. **Master Data → Detil Tugas**. Kolom: **Nama Detil Tugas**, **Tugas Pokok**, **Aksi**.
2. Klik **+ Tambah Detil Tugas**, isi nama dan pilih **Tugas Pokok**, simpan.

---

## Instrumen DCS

Tinjau & sunting item kuesioner DCS (3 sub-skala, 42 item).

1. **Master Data → Instrumen DCS**. Tampil 3 kartu sub-skala.
2. Klik kartu sub-skala (**Kelola item →**) untuk membuka daftar item.
3. Pada tiap item, klik **Ubah** untuk menyunting **pernyataan**, **arah penilaian (F/UF)**,
   atau **urutan**.

!!! warning "Jangan ubah saat sesi berjalan"
Hindari menyunting item setelah responden mulai mengisi sesi.

---

## Instrumen WCP

Tinjau & sunting item kuesioner WCP (12 dimensi, 72 item).

1. **Master Data → Instrumen WCP**. Tampil 12 kartu dimensi dengan label **Dimensi risiko**
   atau **Dimensi protektif**.
2. Klik kartu dimensi (**Kelola item →**) untuk membuka daftar item.
3. Pada tiap item, klik **Ubah** untuk menyunting **pernyataan**, **tipe scoring**, atau **urutan**.

---

## Instrumen Task Inventory (Catalog)

Catalog tugas per kombinasi unit × jabatan. **Bersifat read-only** (data bawaan sistem).

1. **Master Data → Instrumen TI**. Tampil kartu per kombinasi **unit × jabatan** beserta
   jumlah task.
2. Klik **Lihat task →** pada sebuah kombinasi.
3. Tinjau task yang dikelompokkan per **Tugas Pokok** (klik untuk membuka), berisi
   **Detil Tugas** dan **Uraian Tugas**.

!!! note
Catalog tidak dapat diedit dari aplikasi. Gunakan halaman ini untuk memastikan
kombinasi unit × jabatan yang akan disurvei sudah memiliki task.

---

<!-- Screenshot: tab navigasi Master Data dan salah satu formulir tambah data -->
