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

> Dropdown **Pilih Partisipan** hanya memuat anggota SME panel yang **belum** menjadi
> responden analisis ini — partisipan yang sudah terdaftar tidak ditawarkan lagi, sehingga
> tidak bisa ditambahkan dua kali. Bila seluruh anggota panel sudah menjadi responden,
> bagian **Tambah Responden** menampilkan pesan **"Seluruh anggota panel SME sudah menjadi
> responden."** menggantikan kedua formulir (satuan & massal).

### B.1 Mendaftarkan Banyak Responden Sekaligus

Di bawah formulir **Tambah Responden**, tersedia bagian **Atau tugaskan banyak
sekaligus** — daftar centangnya memakai kandidat yang sama dengan dropdown di atas (sudah
dikurangi anggota panel yang sudah jadi responden):

1. Centang anggota SME panel yang akan didaftarkan sebagai responden (**Pilih
   semua**/**Batalkan pilihan** tersedia).
2. Klik **Tugaskan Terpilih (N)**.
3. Aplikasi menampilkan ringkasan berhasil/dilewati. Partisipan dilewati bila: duplikat
   dalam pilihan, **bukan anggota SME panel** jabatan ini, atau sudah terdaftar sebagai
   responden oleh proses lain di saat yang bersamaan.

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
3. Bila ada peserta yang menuliskan **usulan tugas tambahan** di Tahap 1 (lihat bagian E),
   blok **Usulan tugas tambahan dari peserta** tampil **di atas** tabel task partial —
   menampilkan teks usulan, hierarki induknya (tugas pokok · detil tugas), dan nama pengusul.
   Kontrol **Ya/Tidak** untuk tiap usulan bekerja persis seperti task partial di bawahnya.
4. Halaman menampilkan tabel task **partial** (kolom **Task**, **Pilih** = jumlah pemilih,
   **Setujui?**). Kolom **Task** menampilkan **nama uraian tugas** (mis. _"Menyusun evaluasi
   karyawan"_) dengan kode task kecil di sampingnya sebagai keterangan.
5. Untuk tiap task maupun usulan, klik **Ya** (setujui) atau **Tidak** (tolak). Tersedia
   pintasan **Setujui Semua** dan **Tolak Semua** yang berlaku ke keduanya sekaligus.
6. Klik **Simpan Keputusan** — keputusan task partial dan usulan dikirim dalam satu kali
   simpan yang sama.

!!! note
Jika masih ada task/usulan belum diputuskan saat menyimpan, muncul konfirmasi — yang
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
   - **Langkah 3 — Uraian Tugas**: centang uraian tugas yang relevan. Bila ada tugas yang
     benar-benar Anda kerjakan tetapi tidak ada di daftar, klik **Tambah tugas yang tidak
     ada di daftar** pada grup detil tugas yang sesuai, tuliskan uraiannya di kotak teks yang
     muncul, lalu klik **Simpan Usulan** — usulan tersimpan **seketika** (tidak menunggu
     **Kirim Seleksi**) dan langsung tampil di grup yang sama beserta tombol **Hapus** untuk
     membatalkannya selama Tahap 1 masih berjalan. Usulan **tidak** ikut tercentang sebagai
     uraian tugas terpilih — keputusannya ditentukan koordinator di Tahap 2 (lihat bagian D).
4. Klik **Kirim Seleksi**.

!!! danger "Tidak dapat diubah"
Setelah dikirim, seleksi Tahap 1 terkunci — begitu juga kontrol tambah/hapus usulan tugas
tambahan, yang ikut disembunyikan. Status responden menjadi **✓ Selesai**.

---

## F. Mengisi Tahap 3 — Detailing (Partisipan)

> Tersedia setelah status analisis **TAHAP3**.

1. Buka **Isi Tahap 3** dari tabel responden (atau dari **Kuesioner Saya**).
2. Selama detail belum dikirim (dan status masih `TAHAP3`), pop-up **Petunjuk** muncul
   otomatis — menjelaskan **makna tiap nilai** dari empat isian yang perlu Anda lengkapi
   (bukan sekadar daftar opsi): **Sumber Bukti** (Formal (tertulis di jobdesk/regulasi) /
   Aktual (dikerjakan di lapangan) / Keduanya), **Kondisi** (Rutin (hari biasa) / Puncak
   (masa sibuk tertentu) / Keduanya (rutin & puncak)), **Frekuensi**, dan **Durasi/kali** —
   ditutup blok **Contoh Pengisian (ilustrasi)** satu kartu tugas dengan keempat kolom
   terisi. Juga menjelaskan isian standar yang otomatis terpakai saat task dicentang, dan
   bahwa **Kirim Detail** mengunci isian. Tutup dengan tombol **Saya Mengerti, Mulai Mengisi**,
   ikon **X**, klik area luar pop-up, atau tombol **Esc**; dapat dibuka lagi lewat tombol
   **Petunjuk Pengisian** di pojok kanan atas halaman.
3. Untuk tiap task yang Anda kerjakan, **centang** kotaknya. Formulir rincian menampilkan
   **empat** isian (disederhanakan dari tujuh — feedback workshop SME panel guru TK
   2026-07-25 menunjukkan sebagian kolom lama tidak dapat dijawab partisipan):
   - **Sumber Bukti**: Formal (tertulis di jobdesk/regulasi) / Aktual (dikerjakan di
     lapangan) / Keduanya
   - **Kondisi**: Rutin (hari biasa) / Puncak (masa sibuk tertentu) / Keduanya (rutin &
     puncak)
   - **Frekuensi** (default `Mingguan`)
   - **Durasi/kali (menit)** — **wajib diisi manual**, tidak diprefill dari standar (petunjuk
     standar tampil sebagai teks pembanding di samping input, mis. _"petunjuk standar: 1-2
     jam"_); field ini tetap dapat diedit meski field lain terkunci saat "Setuju dengan isian
     standar" dicentang
   - **Jenis Nilai Tambah (VA)** — **hanya muncul** bila katalog standar tugas ini belum
     final (kosong atau bertanda `Context-Dependent`). Bila muncul, kolom tampil **belum
     terisi** ("— wajib dipilih") dan Anda wajib memilih salah satu dari VA-Core / VA-Enable
     / NVA-Residual sebelum tugas ini bisa dikirim. Bila katalog standar tugas ini sudah
     final, kolom ini **tidak ditampilkan sama sekali** — nilainya terkirim otomatis.
   - "Jam/minggu" dan "Jam peak (4 minggu)" **tidak lagi ditanyakan ke partisipan** — nilainya
     terisi otomatis dari data standar master (0 bila tidak ada standarnya).
   - **Catatan (opsional)** — kotak teks bebas maks. 500 karakter di bawah keempat isian di
     atas, muncul untuk setiap task yang dicentang. Gunakan untuk menuliskan keberatan atau
     penjelasan, mis. bila task ini **ternyata bukan tugas Anda** meski sudah masuk hasil
     konsensus Tahap 2 — kolom ini **tidak ikut terkunci** saat "Setuju dengan isian standar"
     dicentang, jadi tetap bisa diisi walau kolom lain terkunci.
4. **Tombol Kirim Detail baru aktif setelah SELURUH task final dicentang dan terisi valid.**
   Selama masih ada yang kosong — belum dicentang, atau dicentang tapi ada isian yang belum
   valid (mis. Durasi/kali kosong, atau Jenis Nilai Tambah masih `Context-Dependent`) — tombol
   nonaktif dan di sampingnya tertulis jumlah task yang belum lengkap, mis. _"2 task belum
   dilengkapi — lengkapi semuanya sebelum mengirim."_ Tombol **Simpan** tetap bisa dipakai
   kapan saja untuk menyimpan draf, walau baru sebagian task terisi.

!!! danger "Tidak dapat diubah"
Setelah dikirim, detail Tahap 3 terkunci. Seluruh task final wajib dicentang & terisi valid
sebelum tombol Kirim Detail aktif.

---

## G. Melihat Hasil (Setelah Analisis)

Saat status **ANALYZED**, detail analisis menampilkan:

- **Task Terpilih** — kolom **Tugas Pokok**, **Uraian Tugas**, **Relevan** (jumlah & %).
- **Hasil Agregasi (masukan ABK)** — total jam/minggu & jam/tahun, lalu per task:
  **Uraian Tugas**, **Relevan**, **Jam/Minggu**, **Jam/Tahun**, **DCS** (penanda risiko).

---

<!-- Screenshot: detail analisis TI dengan bagian transisi status dan tabel responden -->
<!-- Screenshot: form seleksi Tahap 1 langkah kaskade -->
