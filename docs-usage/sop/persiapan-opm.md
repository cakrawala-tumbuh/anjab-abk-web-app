# SOP Persiapan — OPM (Rating Tugas)

Prosedur baku menyiapkan prasyarat sebelum pengambilan data kuesioner **OPM**.

**Tujuan:** memastikan jabatan, SME panel, dan sesi Task Inventory sumber siap sehingga
sesi OPM dapat dibuat dan responden dapat menilai task dengan benar.

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

Status sesi: `DRAFT → Terbuka → Tertutup → Teranalisis`.

!!! note "Satu sesi per jabatan, task berasal dari Task Inventory"
Setiap jabatan hanya boleh memiliki **satu** sesi OPM. Task yang dinilai adalah task
yang sudah **dibekukan** di sesi Task Inventory (Tahap 3) milik jabatan yang sama —
task tersebut di-**snapshot** ke sesi OPM saat dibuat, sehingga tidak berubah meski
sesi TI sumber diubah setelahnya.

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

!!! warning "Tanpa SME panel, sesi OPM tidak dapat dibuat"
Backend menolak pembuatan sesi OPM bila jabatan belum memiliki SME panel, atau
panelnya belum memiliki anggota.

### 2. Pastikan Task Inventory jabatan target sudah dibekukan

1. Buka **Task Inventory**, cari sesi milik jabatan target.
2. Pastikan sesi sudah mencapai **Tahap 3** (task terpilih final sudah dibekukan) —
   status sesi Tahap 3, Tertutup, atau Teranalisis, dengan **jumlah task > 0**.

Langkah lengkap: [SOP Persiapan Task Inventory](persiapan-task-inventory.md) dan
[SOP Pelaksanaan Task Inventory](pelaksanaan-task-inventory.md).

### 3. Buat sesi OPM

Buat sesi dengan parameter berikut (langkah: [IK-08 OPM](../ik/opm.md#a-membuat-sesi)):

| Parameter               | Pedoman pengisian                                              |
| ----------------------- | -------------------------------------------------------------- |
| **Jabatan**             | Hanya jabatan yang sudah memiliki SME panel.                   |
| **Sesi Task Inventory** | Hanya sesi TI jabatan terpilih yang sudah dibekukan (Tahap 3). |
| **Periode**             | Format `YYYY-MM` (mis. `2026-06`).                             |
| **Min. Responden**      | Default 3. Minimum agar hasil layak dianalisis.                |
| **Maks. Responden**     | Default 10. Harus ≥ Min. Responden.                            |
| **Catatan**             | Opsional — keterangan sesi.                                    |

Saat sesi dibuat, task hasil Task Inventory di-snapshot dan **responden dibuat otomatis**
dari seluruh anggota SME panel jabatan tersebut — tidak perlu didaftarkan manual satu per
satu.

!!! success "Selesai persiapan"
Setelah SME panel lengkap, Task Inventory dibekukan, dan sesi OPM dibuat, lanjut ke
[SOP Pelaksanaan OPM](pelaksanaan-opm.md).

---

## Daftar Periksa (Checklist) Persiapan OPM

- [ ] Partisipan terdaftar
- [ ] SME panel jabatan target dibuat & punya anggota
- [ ] Task Inventory jabatan target sudah dibekukan (Tahap 3, jumlah task > 0)
- [ ] Sesi OPM dibuat dengan jabatan, sesi TI sumber, periode & batas responden yang benar
