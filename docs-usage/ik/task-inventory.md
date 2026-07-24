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
   - **Cabang** (wajib) — pilih lokasi kajian: **Bandung** atau **Semarang**.
   - **Catatan (opsional)**.
4. Klik **Mulai Analisis Jabatan**. Aplikasi membuka detail analisis dengan status **Draft**.

!!! note "Responden otomatis dari SME Panel"
Bila jabatan yang dipilih sudah memiliki **SME Panel** berisi anggota, seluruh
anggota panel otomatis muncul sebagai responden begitu analisis dibuat — tanpa
langkah tambahan. Bagian B di bawah tetap dipakai untuk menambah anggota yang
bergabung belakangan, atau bila jabatan belum punya panel saat analisis dibuat.

### A.1 Menetapkan Koordinator (Administrator)

1. Di detail analisis, temukan kartu **Koordinator SME Panel**.
2. Pada dropdown **Pilih koordinator**, pilih salah satu **anggota SME panel** jabatan ini
   (hanya anggota panel yang muncul di daftar). Klik **Simpan Koordinator**.
3. Untuk mengosongkan: pilih **— Tidak ada koordinator —**, lalu klik **Simpan Koordinator**.

!!! note "Hubungan dengan koordinator SME Panel"
Koordinator sesi **secara default mengikuti** koordinator SME panel jabatan (lihat
[IK-02 Master Data → SME Panel](master-data.md#sme-panel)). Kartu ini memungkinkan admin
**mengubahnya khusus untuk sesi ini**, kapan saja — termasuk setelah sesi berjalan. Bila
SME panel jabatan ini belum dibuat, atau belum punya anggota, kartu menampilkan pesan dan
koordinator belum dapat ditentukan.

Koordinator yang ditetapkan di sini bertugas menjalankan review Tahap 2 setelah analisis
mencapai status **TAHAP2** — lihat [bagian D. Review Koordinator (Tahap 2)](#d-review-koordinator-tahap-2).

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

### B.1 Mendaftarkan Banyak Responden Sekaligus

Di bawah formulir **Tambah Responden**, tersedia bagian **Atau tugaskan banyak
sekaligus**:

1. Centang anggota SME panel yang akan didaftarkan sebagai responden (**Pilih
   semua**/**Batalkan pilihan** tersedia).
2. Klik **Tugaskan Terpilih (N)**.
3. Aplikasi menampilkan ringkasan berhasil/dilewati. Partisipan dilewati bila: sudah
   terdaftar sebagai responden, duplikat dalam pilihan, atau **bukan anggota SME panel**
   jabatan ini.

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

!!! warning "Dialog konfirmasi"
**OK** = lanjutkan transisi, **Cancel** = batal (status analisis tidak berubah). Ini
berlaku sama untuk semua tombol transisi — Cancel **tidak pernah** memaksa apa pun.

    Untuk **Mulai Tahap 2** dan **Mulai Tahap 3**, bila masih ada yang belum selesai
    (partisipan belum submit Tahap 1, atau task partial belum diputuskan koordinator),
    muncul **checkbox terpisah** di bawah tombol — "Lanjutkan walau … belum …". Checkbox
    ini hanya tampil saat memang masih ada yang belum selesai, dan harus dicentang secara
    eksplisit sebelum menekan tombol bila ingin memaksa lanjut; klik OK pada dialog
    konfirmasi tanpa mencentangnya akan tetap menolak transisi di sisi server bila syarat
    belum terpenuhi.

Saat status **TAHAP2**, muncul kotak _Tahap 2 — Review Koordinator_ dengan tombol
**Buka Review Koordinator**.

---

## D. Review Koordinator (Tahap 2)

1. Dari detail analisis (status TAHAP2), klik **Buka Review Koordinator**.
2. Bagi koordinator (atau admin) saat status masih `TAHAP2`, pop-up **Petunjuk** muncul
   otomatis — menjelaskan bahwa yang direview adalah task **partial** (tidak unanimous), blok
   **Arti Rasio & Cara Memutuskan** (makna `N/M`, kapan memilih Ya vs Tidak), serta blok
   **Contoh Pengisian (ilustrasi)** berisi dua baris contoh (_"Menyusun laporan bulanan wali
   kelas"_ 4/5 → Ya, _"Mengelola inventaris laboratorium"_ 1/5 → Tidak). Tutup dengan tombol
   **Saya Mengerti**, ikon **X**, klik area luar pop-up, atau tombol **Esc**; dapat dibuka lagi
   lewat tombol **Petunjuk Pengisian** di pojok kanan atas halaman.
3. Halaman menampilkan tabel task **partial** (kolom **Task**, **Pilih** = jumlah pemilih,
   **Setujui?**). Kolom **Task** menampilkan **nama uraian tugas** (mis. _"Menyusun evaluasi
   karyawan"_) dengan kode task kecil di sampingnya sebagai keterangan.
4. Untuk tiap task, klik **Ya** (setujui) atau **Tidak** (tolak). Tersedia pintasan
   **Setujui Semua** dan **Tolak Semua**.
5. Klik **Simpan Keputusan**.

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
2. Selama seleksi belum dikirim (dan status masih `TAHAP1`), pop-up **Petunjuk** muncul
   otomatis — menjelaskan seleksi bertingkat 3 level (Tugas Pokok → Detil Tugas → Uraian
   Tugas), blok **Kapan Mencentang** (centang bila benar-benar bagian pekerjaan Anda walau
   jarang; jangan centang bila milik rekan/jabatan lain; bila ragu, centang), blok **Contoh
   Pengisian (ilustrasi)** berupa kaskade tiga level ber-checkbox statis, dan bahwa
   **Kirim Seleksi** mengunci pilihan. Tutup dengan tombol **Saya Mengerti, Mulai Mengisi**,
   ikon **X**, klik area luar pop-up, atau tombol **Esc**; dapat dibuka lagi lewat tombol
   **Petunjuk Pengisian** di pojok kanan atas halaman.
3. Seleksi dilakukan dalam **3 langkah kaskade**:
   - **Langkah 1 — Tugas Pokok**: centang tugas pokok yang relevan, klik
     **Lanjut ke Detil Tugas**.
   - **Langkah 2 — Detil Tugas**: centang detil tugas (hanya dari tugas pokok terpilih),
     klik **Lanjut ke Uraian Tugas**. (Tombol **Kembali** untuk mundur.)
   - **Langkah 3 — Uraian Tugas**: centang uraian tugas yang relevan.
4. Klik **Kirim Seleksi**.

!!! danger "Tidak dapat diubah"
Setelah dikirim, seleksi Tahap 1 terkunci. Status responden menjadi **✓ Selesai**.

---

## F. Mengisi Tahap 3 — Detailing (Partisipan)

> Tersedia setelah status analisis **TAHAP3**.

1. Buka **Isi Tahap 3** dari tabel responden (atau dari **Kuesioner Saya**).
2. Selama detail belum dikirim (dan status masih `TAHAP3`), pop-up **Petunjuk** muncul
   otomatis — menjelaskan **makna tiap nilai** kolom CalHR satu per satu (bukan sekadar
   daftar opsi): Sumber Bukti (Formal/Aktual/Keduanya), Kondisi (Baseline/Peak/Both), Durasi,
   Jam/minggu, Jam peak (total 4 pekan periode puncak, bukan per pekan), dan VA Type
   (VA-Core/VA-Enable/NVA-Residual/Context-Dependent/Needs Validation) — ditutup blok
   **Contoh Pengisian (ilustrasi)** satu kartu tugas dengan ketujuh kolom terisi. Juga
   menjelaskan isian standar yang otomatis terpakai saat task dicentang, dan bahwa
   **Kirim Detail** mengunci isian. Tutup dengan tombol **Saya Mengerti, Mulai Mengisi**,
   ikon **X**, klik area luar pop-up, atau tombol **Esc**; dapat dibuka lagi lewat tombol
   **Petunjuk Pengisian** di pojok kanan atas halaman.
3. Untuk tiap task yang Anda kerjakan, **centang** kotaknya. Formulir rincian muncul:
   - **Sumber Bukti**: Formal / Aktual / Keduanya
   - **Kondisi**: Baseline / Peak / Both
   - **Frekuensi** (default `Mingguan`)
   - **Durasi/kali (menit)** — **wajib diisi manual**, tidak diprefill dari standar (petunjuk
     standar tampil sebagai teks pembanding di samping input, mis. _"petunjuk standar: 1-2
     jam"_); field ini tetap dapat diedit meski field lain terkunci saat "Setuju dengan isian
     standar" dicentang
   - **Jam/minggu** (default 1)
   - **Jam peak (4 minggu)** (default 0)
   - **VA Type**: VA-Core / VA-Enable / NVA-Residual
4. Klik **Kirim Detail**.

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
