# SOP Persiapan — OPM (Rating Tugas)

Prosedur baku menyiapkan prasyarat sebelum pengambilan data kuesioner **OPM**.

**Tujuan:** memastikan jabatan, SME panel, dan Analisis Jabatan Task Inventory sumber siap
sehingga Analisis Jabatan OPM dapat dibuat dan responden dapat menilai task dengan benar.

**Penanggung jawab:** Administrator studi ANJAB-ABK.

---

## Tentang OPM

OPM (**Occupational Profile Measure — Rating Tugas**) menilai **setiap task** hasil
Task Inventory pada 3 dimensi skala 1–5:

| Dimensi         | Makna                                                   |
| --------------- | ------------------------------------------------------- |
| **Importance**  | Seberapa penting (1 Tidak penting … 5 Sangat penting)   |
| **Frequency**   | Seberapa sering (1 Insidental … 5 Sangat sering/Harian) |
| **Criticality** | Dampak jika gagal (1 Dampak minimal … 5 Dampak kritis)  |

Dari rata-rata tiga dimensi tersebut diturunkan dua flag:

- **Selection Essential** = Ya bila Importance ≥ 4 atau Criticality ≥ 4.
- **Workload Essential** = Ya bila (Importance ≥ 3 dan Frequency ≥ 3) atau Criticality ≥ 4.

Status analisis: `DRAFT → Terbuka → Tertutup → Teranalisis`.

!!! note "Satu analisis per jabatan PER CABANG, task berasal dari Task Inventory"
Setiap jabatan boleh memiliki **satu Analisis Jabatan OPM per cabang** (Bandung dan
Semarang berdampingan pada jabatan yang sama) — bukan lagi satu analisis untuk seluruh
jabatan. **Cabang Analisis Jabatan OPM diturunkan dari cabang Analisis Jabatan Task
Inventory sumbernya**, tidak diisi terpisah. Task yang dinilai adalah task yang sudah
**dibekukan** di Analisis Jabatan Task Inventory (Tahap 3) milik jabatan yang sama —
task tersebut di-**snapshot** ke Analisis Jabatan OPM saat dibuat, sehingga tidak
berubah meski Analisis Jabatan TI sumber diubah setelahnya.

---

## Prasyarat

| No  | Prasyarat                                                                           | IK/SOP terkait                                                                                                               |
| --- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Partisipan** (calon anggota SME panel) sudah terdaftar                            | [IK-03 Partisipan](../ik/partisipan.md)                                                                                      |
| 2   | **SME panel** untuk jabatan target sudah dibuat & punya anggota                     | [IK-02 Master Data](../ik/master-data.md#sme-panel)                                                                          |
| 3   | **Task Inventory** jabatan target sudah selesai hingga **Tahap 3** (task dibekukan) | [SOP Persiapan Task Inventory](persiapan-task-inventory.md), [SOP Pelaksanaan Task Inventory](pelaksanaan-task-inventory.md) |

---

## Langkah Persiapan

### 1. Pastikan SME panel jabatan target lengkap

1. Buka **Master Data → SME Panel**.
2. Pastikan jabatan target memiliki panel dengan **minimal 1 anggota** partisipan.
   Bila belum ada, buat panel dan tambahkan anggota terlebih dahulu.

!!! warning "Tanpa SME panel, Analisis Jabatan OPM tidak dapat dibuat"
Backend menolak pembuatan Analisis Jabatan OPM bila jabatan belum memiliki SME panel,
atau panelnya belum memiliki anggota.

### 2. Pastikan Task Inventory jabatan target sudah dibekukan DAN sudah punya cabang

1. Buka **Task Inventory**, cari analisis milik jabatan target (cabang yang akan
   dianalisis OPM-nya).
2. Pastikan analisis sudah mencapai **Tahap 3** (task terpilih final sudah dibekukan) —
   status analisis Tahap 3, Tertutup, atau Teranalisis, dengan **jumlah task > 0**.
3. Pastikan kolom **Cabang** analisis TI tersebut **terisi** (Bandung/Semarang) — sesi
   TI lama ber-cabang kosong tidak dapat dipakai sebagai sumber OPM; web app akan
   menyaringnya dari dropdown "Analisis Jabatan Task Inventory" beserta pesan
   penjelasnya.

Langkah lengkap: [SOP Persiapan Task Inventory](persiapan-task-inventory.md) dan
[SOP Pelaksanaan Task Inventory](pelaksanaan-task-inventory.md).

### 3. Mulai Analisis Jabatan OPM

Mulai analisis dengan parameter berikut (langkah: [IK-08 OPM](../ik/opm.md#a-memulai-analisis-jabatan)):

| Parameter                           | Pedoman pengisian                                                                                                                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Jabatan**                         | Hanya jabatan yang sudah memiliki SME panel.                                                                                                                                           |
| **Analisis Jabatan Task Inventory** | Hanya Analisis Jabatan TI jabatan terpilih yang sudah dibekukan (Tahap 3) **dan sudah punya cabang terisi**. Cabang Analisis Jabatan OPM mengikuti pilihan ini — tidak diisi terpisah. |
| **Periode**                         | Format `YYYY-MM` (mis. `2026-06`).                                                                                                                                                     |
| **Min. Responden**                  | Default 3. Minimum agar hasil layak dianalisis.                                                                                                                                        |
| **Maks. Responden**                 | Default 10. Harus ≥ Min. Responden.                                                                                                                                                    |
| **Catatan**                         | Opsional — keterangan analisis.                                                                                                                                                        |

Saat analisis dibuat, task hasil Task Inventory di-snapshot dan **responden dibuat otomatis**
dari seluruh anggota SME panel jabatan tersebut — tidak perlu didaftarkan manual satu per
satu.

!!! success "Selesai persiapan"
Setelah SME panel lengkap, Task Inventory dibekukan, dan Analisis Jabatan OPM dibuat,
lanjut ke [SOP Pelaksanaan OPM](pelaksanaan-opm.md).

---

## Daftar Periksa (Checklist) Persiapan OPM

- [ ] Partisipan terdaftar
- [ ] SME panel jabatan target dibuat & punya anggota
- [ ] Task Inventory jabatan target sudah dibekukan (Tahap 3, jumlah task > 0) DAN
      cabangnya terisi
- [ ] Analisis Jabatan OPM dibuat dengan jabatan, Analisis Jabatan TI sumber, periode & batas
      responden yang benar
