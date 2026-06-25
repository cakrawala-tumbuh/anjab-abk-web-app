# IK-03 — Partisipan

Langkah teknis mengelola data partisipan (pegawai yang menjadi responden alat ukur).
Akses: **Administrator**.

**Prasyarat:** **Sekolah** dan **Jabatan** sudah terdaftar di
[Master Data](master-data.md).

---

## A. Melihat Daftar Partisipan

1. Buka **Partisipan** dari bilah navigasi (atau kartu **Kelola Partisipan** di Dashboard).
2. Daftar menampilkan kolom: **Nama**, **Email**, **Satuan Pendidikan**,
   **Jabatan Utama**, **Masa Kerja**, **Status**.
3. Klik **Nama** untuk membuka halaman detail partisipan.

---

## B. Menambah Partisipan

1. Klik **+ Tambah Partisipan**.
2. Isi formulir:
   - **Nama** (wajib, mis. `Siti Rahayu, S.Pd.`)
   - **Email** (wajib). _Email ini dipakai membuat akun login Authentik._
   - **Sekolah** (wajib, pilih dari dropdown)
   - **Jabatan Utama** (wajib, pilih dari dropdown)
   - **Jabatan Tambahan (opsional)** — centang jabatan lain bila ada
   - **Masa Kerja (tahun)** (wajib, 0–50) dan **(bulan)** (opsional, 0–11)
   - **Mata Pelajaran Utama (opsional, untuk guru)** — bila relevan
3. Klik **Tambah Partisipan**. (Untuk membatalkan, klik **Batal**.)

!!! info "Akun login otomatis"
Saat partisipan dibuat, akun Authentik dibuat otomatis. Partisipan dapat langsung
login dengan email yang didaftarkan dan akan melihat menu **Kuesioner Saya**.

!!! tip "Email harus benar"
Pastikan email valid dan unik — email menjadi identitas login partisipan.

---

## C. Hubungan dengan Alat Ukur

Setelah partisipan terdaftar, ia dapat:

- Dijadikan **anggota SME Panel** (untuk Task Inventory) — lihat
  [IK-02 → SME Panel](master-data.md#sme-panel).
- Didaftarkan sebagai **responden** di sesi Task Inventory, Time Study, DCS, atau WCP —
  lihat IK masing-masing alat ukur.

---

<!-- Screenshot: formulir Tambah Partisipan terisi -->
