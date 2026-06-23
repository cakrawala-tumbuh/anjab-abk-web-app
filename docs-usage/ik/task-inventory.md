# IK-04 — Task Inventory (TI)

Langkah teknis menjalankan alat ukur **Task Inventory** di aplikasi.

Bagian **A–C** untuk **Administrator**, **D** untuk **Koordinator**, **E–F** untuk
**Partisipan**. Untuk alur & keputusan, lihat
[SOP Persiapan TI](../sop/persiapan-task-inventory.md) dan
[SOP Pelaksanaan](../sop/pelaksanaan-pengambilan-data.md).

Status sesi: `DRAFT → TAHAP1 → TAHAP2 → TAHAP3 → CLOSED → ANALYZED`.

---

## A. Membuat Sesi

1. Buka **Task Inventory** dari navigasi (atau kartu di Dashboard).
2. Klik **+ Buat Sesi**.
3. Isi formulir:
    - **Unit / Jenjang** (opsional; default `-- Semua unit --`) — memfilter pilihan jabatan.
    - **Jabatan** (wajib) — pilihan menampilkan jumlah task per jabatan.
    - **Periode** (wajib, format `YYYY-MM`).
    - **Min. Responden** (default 3) dan **Maks. Responden** (default 10, harus ≥ min).
    - **Catatan (opsional)**.
4. Klik **Buat Sesi**. Aplikasi membuka detail sesi dengan status **Draft**.

---

## B. Mendaftarkan Responden

> Dapat dilakukan saat status **DRAFT** atau **TAHAP1**.

1. Di detail sesi, bagian **Tambah Responden**:
    - **Pilih Partisipan (opsional)** — pilih dari daftar, atau
    - **Nama (opsional)** — ketik manual (mis. `Budi Santoso, S.Pd.`).
2. Klik **+ Daftarkan**. Responden muncul di tabel **Daftar Responden** dengan status
   **Tahap 1** dan **Tahap 3** = **Belum**.
3. Untuk menghapus responden yang belum mengisi, klik **Hapus** pada kolom **Aksi**
   (konfirmasi *Hapus responden "{nama}" dari sesi ini?*).

---

## C. Transisi Tahap (Administrator)

Bagian **Transisi Sesi** menampilkan tombol sesuai status:

| Status | Tombol | Hasil |
|---|---|---|
| Draft | **Mulai Tahap 1** | Membuka seleksi (→ TAHAP1) |
| Draft | **Hapus Sesi** | Menghapus sesi (*tidak dapat dibatalkan*) |
| TAHAP1 | **Mulai Tahap 2 — Review Koordinator** | → TAHAP2 |
| TAHAP2 | **Mulai Tahap 3 — Bekukan Task Relevan** | Membekukan task final (→ TAHAP3) |
| TAHAP3 | **Tutup Sesi** | → CLOSED |
| CLOSED | **Jalankan Analisis** | → ANALYZED |

!!! warning "Dialog konfirmasi"
    - **Mulai Tahap 2**: OK bila semua partisipan sudah submit Tahap 1; Cancel untuk
      memaksa lanjut walau belum semua.
    - **Mulai Tahap 3**: OK bila koordinator sudah memutuskan semua task partial; Cancel
      memaksa lanjut (task yang belum diputuskan diabaikan).

Saat status **TAHAP2**, muncul kotak *Tahap 2 — Review Koordinator* dengan tombol
**Buka Review Koordinator**.

---

## D. Review Koordinator (Tahap 2)

1. Dari detail sesi (status TAHAP2), klik **Buka Review Koordinator**.
2. Halaman menampilkan tabel task **partial** (kolom **Task**, **Pilih** = jumlah pemilih,
   **Setujui?**).
3. Untuk tiap task, klik **Ya** (setujui) atau **Tidak** (tolak). Tersedia pintasan
   **Setujui Semua** dan **Tolak Semua**.
4. Klik **Simpan Keputusan**.

!!! note
    Jika masih ada task belum diputuskan saat menyimpan, muncul konfirmasi — task yang
    belum diputuskan tidak akan disertakan ke Tahap 3.

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

> Tersedia setelah status sesi **TAHAP3**.

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

Saat status **ANALYZED**, detail sesi menampilkan:

- **Task Terpilih** — kolom **Tugas Pokok**, **Uraian Tugas**, **Relevan** (jumlah & %).
- **Hasil Agregasi (masukan ABK)** — total jam/minggu & jam/tahun, lalu per task:
  **Uraian Tugas**, **Relevan**, **Jam/Minggu**, **Jam/Tahun**, **DCS** (penanda risiko).

---

<!-- Screenshot: detail sesi TI dengan bagian Transisi Sesi dan tabel responden -->
<!-- Screenshot: form seleksi Tahap 1 langkah kaskade -->
