# Daftar SOP

**SOP (Standard Operating Procedure)** adalah prosedur baku yang menjelaskan _apa_ yang
harus dilakukan dan dalam _urutan_ apa, agar pengambilan data tiap alat ukur berjalan
konsisten dan hasilnya sahih.

SOP di sini dibagi menjadi dua kelompok:

## 1. SOP Persiapan (per Alat Ukur)

Prosedur menyiapkan prasyarat sebelum data diambil — master data, panel SME, partisipan,
dan (untuk TI/OPM) pembuatan sesi/analisis. DCS, WCP, dan Time Study tidak memiliki
langkah pembuatan sesi: DCS/WCP karena instrumennya tunggal (singleton, tersedia sejak
awal), Time Study karena partisipan langsung ditugaskan (1 partisipan = 1 penugasan).

| SOP                                                     | Alat Ukur | Ringkas                                                                                |
| ------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------- |
| [Persiapan Task Inventory](persiapan-task-inventory.md) | TI        | Catalog tugas per jabatan, panel SME, koordinator, analisis 3 tahap                    |
| [Persiapan Time Study](persiapan-time-study.md)         | TS        | Partisipan, penugasan langsung (tanpa sesi, tanpa tahap analisis)                      |
| [Persiapan DCS](persiapan-dcs.md)                       | DCS       | Instrumen 3 sub-skala, partisipan, penugasan responden (instrumen tunggal, tanpa sesi) |
| [Persiapan WCP](persiapan-wcp.md)                       | WCP       | Instrumen 12 dimensi, partisipan, penugasan responden (instrumen tunggal, tanpa sesi)  |
| [Persiapan OPM](persiapan-opm.md)                       | OPM       | Jabatan ber-SME panel, Task Inventory dibekukan, analisis rating                       |

## 2. SOP Pelaksanaan Pengambilan Data (per Alat Ukur)

Prosedur menjalankan pengambilan data — menugaskan/mendaftarkan responden, memandu
partisipan, memantau, menutup pengisian, dan analisis. Untuk TI/OPM langkah ini juga
mencakup membuka sesi (DCS/WCP sudah terbuka sejak awal; Time Study tidak memiliki
status buka/tutup maupun tahap analisis sama sekali — hanya toggle Aktif/Nonaktif).
Dibuat **terpisah per alat ukur** karena pelaksanaannya dapat berlangsung pada **waktu
yang berbeda**.

| SOP                                                         | Alat Ukur | Ringkas                                                      |
| ----------------------------------------------------------- | --------- | ------------------------------------------------------------ |
| [Pelaksanaan Task Inventory](pelaksanaan-task-inventory.md) | TI        | 3 tahap: seleksi → review koordinator → detailing → analisis |
| [Pelaksanaan Time Study](pelaksanaan-time-study.md)         | TS        | Pencatatan log harian sepanjang periode → analisis           |
| [Pelaksanaan DCS](pelaksanaan-dcs.md)                       | DCS       | Pengisian kuesioner 42 item → hasil                          |
| [Pelaksanaan WCP](pelaksanaan-wcp.md)                       | WCP       | Pengisian kuesioner 72 item → hasil                          |
| [Pelaksanaan OPM](pelaksanaan-opm.md)                       | OPM       | Rating tiap task (3 dimensi) oleh anggota SME panel → hasil  |

---

!!! info "SOP vs IK"
SOP menjelaskan **alur dan keputusan**. Untuk langkah teknis penginputan di aplikasi
(klik tombol, isi formulir), setiap SOP menautkan ke **Instruksi Kerja (IK)** terkait.

---

## Prasyarat Umum Semua Alat Ukur

Sebelum menjalankan SOP Persiapan alat ukur manapun, pastikan:

1. Akun administrator sudah dapat login dan masuk Dashboard.
2. **Master Data** dasar telah terisi sesuai urutan dependensi
   (lihat [IK-02 Master Data](../ik/master-data.md)).
3. **Partisipan** yang akan menjadi responden sudah terdaftar
   (lihat [IK-03 Partisipan](../ik/partisipan.md)).
