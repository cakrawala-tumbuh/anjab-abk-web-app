# IK-04 — Task Inventory (TI)

Langkah teknis menjalankan alat ukur **Task Inventory** di aplikasi.

Bagian **A–C** untuk **Administrator**, **D** untuk **Koordinator**, **E–F** untuk
**Partisipan**. Untuk alur & keputusan, lihat
[SOP Persiapan TI](../sop/persiapan-task-inventory.md) dan
[SOP Pelaksanaan Task Inventory](../sop/pelaksanaan-task-inventory.md).

Status analisis: `DRAFT → TAHAP1 → TAHAP2 → TAHAP3 → CLOSED → ANALYZED`.

---

## A. Memulai Analisis Jabatan

1. Buka **Task Inventory** dari navigasi (atau kartu di Dashboard).
2. Klik **+ Mulai Analisis Jabatan**.
3. Isi formulir:
   - **Jabatan** (wajib) — daftar berisi nama jabatan yang tersedia di catalog Task Inventory.
   - **Periode** (wajib, format `YYYY-MM`).
   - **Min. Responden** (default 3) dan **Maks. Responden** (default 10, harus ≥ min).
   - **Catatan (opsional)**.
4. Klik **Mulai Analisis Jabatan**. Aplikasi membuka detail analisis dengan status **Draft**.

---

## B. Mendaftarkan Responden

> Dapat dilakukan saat status **DRAFT** atau **TAHAP1**.

1. Di detail analisis, bagian **Tambah Responden**:
   - **Pilih Partisipan (opsional)** — pilih dari daftar, atau
   - **Nama (opsional)** — ketik manual (mis. `Budi Santoso, S.Pd.`).
2. Klik **+ Daftarkan**. Responden muncul di tabel **Daftar Responden** dengan status
   **Tahap 1** dan **Tahap 3** = **Belum**.
3. Untuk menghapus responden yang belum mengisi, klik **Hapus** pada kolom **Aksi**
   (konfirmasi _Hapus responden "{nama}" dari analisis ini?_).

---

## C. Transisi Tahap (Administrator)

Bagian transisi status menampilkan tombol sesuai status:

| Status | Tombol                                   | Hasil                                         |
| ------ | ---------------------------------------- | --------------------------------------------- |
| Draft  | **Mulai Tahap 1**                        | Membuka seleksi (→ TAHAP1)                    |
| Draft  | **Hapus Analisis**                       | Menghapus analisis (_tidak dapat dibatalkan_) |
| TAHAP1 | **Mulai Tahap 2 — Review Koordinator**   | → TAHAP2                                      |
| TAHAP2 | **Mulai Tahap 3 — Bekukan Task Relevan** | Membekukan task final (→ TAHAP3)              |
| TAHAP3 | **Tutup Analisis**                       | → CLOSED                                      |
| CLOSED | **Jalankan Analisis**                    | → ANALYZED                                    |

!!! warning "Dialog konfirmasi" - **Mulai Tahap 2**: OK bila semua partisipan sudah submit Tahap 1; Cancel untuk
memaksa lanjut walau belum semua. - **Mulai Tahap 3**: OK bila koordinator sudah memutuskan semua task partial; Cancel
memaksa lanjut (task yang belum diputuskan diabaikan).

Saat status **TAHAP2**, muncul kotak _Tahap 2 — Review Koordinator_ dengan tombol
**Buka Review Koordinator**.

---

## D. Review Koordinator (Tahap 2)

1. Dari detail analisis (status TAHAP2), klik **Buka Review Koordinator**.
2. Halaman menampilkan tabel task **partial** (kolom **Task**, **Pilih** = jumlah pemilih,
   **Setujui?**). Kolom **Task** menampilkan **nama uraian tugas** (mis. _"Menyusun evaluasi
   karyawan"_) dengan kode task kecil di sampingnya sebagai keterangan.
3. Untuk tiap task, klik **Ya** (setujui) atau **Tidak** (tolak). Tersedia pintasan
   **Setujui Semua** dan **Tolak Semua**.
4. Klik **Simpan Keputusan**.

!!! note
Jika masih ada task belum diputuskan saat menyimpan, muncul konfirmasi — task yang
belum diputuskan tidak akan disertakan ke Tahap 3.

!!! info "Akses anggota panel"
**Anggota panel** (responden selain koordinator) dapat membuka halaman ini dalam mode
**hanya-baca** — tabel dan keputusan ditampilkan, tetapi tombol Ya/Tidak/Simpan tidak
muncul, dan banner biru "Anda melihat hasil Tahap 2 sebagai anggota panel" ditampilkan.
Hanya **koordinator** (atau admin) yang dapat menyimpan keputusan saat status `TAHAP2`.
Partisipan yang bukan anggota panel akan mendapat halaman 404.

    **Cara anggota panel masuk ke Tahap 2:** buka **Kuesioner Saya**, cari kartu
    Task Inventory yang berstatus _Tahap 2 — Review Koordinator_, lalu klik tombol
    **Lihat Tahap 2** (warna ungu). Koordinator melihat tombol **Review Koordinator**
    (warna kuning-oranye) di kartu yang sama.

---

## E. Mengisi Tahap 1 — Seleksi (Partisipan)

1. Buka **Isi Tahap 1** dari tabel responden (atau dari **Kuesioner Saya**).
2. Seleksi dilakukan dalam **3 langkah kaskade**:
   - **Langkah 1 — Tugas Pokok**: centang tugas pokok yang relevan, klik
     **Lanjut ke Detil Tugas**.
   - **Langkah 2 — Detil Tugas**: centang detil tugas (hanya dari tugas pokok terpilih),
     klik **Lanjut ke Uraian Tugas**. (Tombol **Kembali** untuk mundur.)
   - **Langkah 3 — Uraian Tugas**: centang uraian tugas yang relevan.
3. Klik **Kirim Seleksi**.

!!! danger "Tidak dapat diubah"
Setelah dikirim, seleksi Tahap 1 terkunci. Status responden menjadi **✓ Selesai**.

---

## F. Mengisi Tahap 3 — Detailing (Partisipan)

> Tersedia setelah status analisis **TAHAP3**.

1. Buka **Isi Tahap 3** dari tabel responden (atau dari **Kuesioner Saya**).
2. Untuk tiap task yang Anda kerjakan, **centang** kotaknya. Formulir rincian muncul:
   - **Sumber Bukti**: Formal / Aktual / Keduanya
   - **Kondisi**: Baseline / Peak / Both
   - **Frekuensi** (default `Mingguan`)
   - **Durasi/kali (menit)** (default 60)
   - **Jam/minggu** (default 1)
   - **Jam peak (4 minggu)** (default 0)
   - **AI Mode**: Human-led / Co-Pilot / AI-assisted
   - **VA Type**: VA-Core / VA-Enable / NVA-Residual
   - **Ada risiko DCS** (centang bila ada)
3. Klik **Kirim Detail**.

!!! danger "Tidak dapat diubah"
Setelah dikirim, detail Tahap 3 terkunci. Tandai minimal satu tugas sebelum mengirim.

---

## G. Melihat Hasil (Setelah Analisis)

Saat status **ANALYZED**, detail analisis menampilkan:

- **Task Terpilih** — kolom **Tugas Pokok**, **Uraian Tugas**, **Relevan** (jumlah & %).
- **Hasil Agregasi (masukan ABK)** — total jam/minggu & jam/tahun, lalu per task:
  **Uraian Tugas**, **Relevan**, **Jam/Minggu**, **Jam/Tahun**, **DCS** (penanda risiko).

---

<!-- Screenshot: detail analisis TI dengan bagian transisi status dan tabel responden -->
<!-- Screenshot: form seleksi Tahap 1 langkah kaskade -->
