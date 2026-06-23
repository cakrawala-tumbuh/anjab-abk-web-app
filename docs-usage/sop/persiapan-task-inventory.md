# SOP Persiapan — Task Inventory (TI)

Prosedur baku menyiapkan segala prasyarat sebelum pengambilan data **Task Inventory**.

**Tujuan:** memastikan catalog tugas, panel ahli, koordinator, dan sesi telah siap
sehingga partisipan dapat menyeleksi relevansi tugas (Tahap 1) dan merinci beban kerja
(Tahap 3) dengan benar.

**Penanggung jawab:** Administrator studi ANJAB-ABK.

---

## Tentang Task Inventory

Task Inventory mengukur, per jabatan, **tugas mana yang relevan** dan **berapa beban
kerjanya** (komponen CalHR). Alurnya **3 tahap**:

| Tahap | Aktor | Aktivitas |
|---|---|---|
| **Tahap 1 — Seleksi** | Anggota SME panel | Memilih tugas yang relevan untuk jabatannya (kaskade Tugas Pokok → Detil Tugas → Uraian Tugas). |
| **Tahap 2 — Review Koordinator** | Koordinator SME panel | Memutuskan relevansi tugas yang **tidak dipilih bulat** (partial) oleh semua anggota. |
| **Tahap 3 — Detailing** | Anggota SME panel | Mengisi rincian beban kerja (CalHR) untuk tugas final. |

Status sesi: `DRAFT → TAHAP1 → TAHAP2 → TAHAP3 → CLOSED → ANALYZED`.

!!! note "Pembekuan tugas"
    Pada transisi **Tahap 2 → Tahap 3**, daftar tugas dibekukan =
    *tugas yang dipilih bulat (unanimous)* **∪** *tugas partial yang disetujui koordinator*.

---

## Prasyarat

| No | Prasyarat | IK terkait |
|---|---|---|
| 1 | Jenjang pendidikan, sekolah, dan **jabatan** sudah terdaftar | [IK-02 Master Data](../ik/master-data.md) |
| 2 | **Catalog Task Inventory** tersedia untuk kombinasi unit × jabatan (Tugas Pokok, Detil Tugas, Uraian Tugas) | [IK-02 Master Data](../ik/master-data.md#instrumen-task-inventory-catalog) |
| 3 | **Partisipan** yang menjadi anggota panel sudah terdaftar | [IK-03 Partisipan](../ik/partisipan.md) |
| 4 | **SME Panel** untuk jabatan terkait sudah dibuat & anggotanya diisi | [IK-02 Master Data](../ik/master-data.md#sme-panel) |

!!! warning "Catalog tugas bersifat read-only"
    Catalog Task Inventory bersumber dari data bawaan sistem dan hanya dapat ditinjau,
    bukan dibuat dari aplikasi. Pastikan kombinasi unit × jabatan yang akan disurvei
    sudah memiliki task di catalog sebelum membuat sesi.

---

## Langkah Persiapan

### 1. Verifikasi catalog tugas

1. Buka **Master Data → Instrumen TI**.
2. Pastikan kombinasi **unit × jabatan** yang akan disurvei muncul dan memiliki jumlah
   task yang memadai. Tinjau daftar Tugas Pokok → Detil Tugas → Uraian Tugas.

### 2. Tentukan anggota panel & koordinator

1. Pastikan **SME Panel** jabatan terkait berisi anggota yang tepat (para ahli/pelaku jabatan).
2. Tetapkan **satu koordinator** panel. Koordinator yang akan menjalankan **Tahap 2**.

!!! tip "Partisipan di lebih dari satu panel"
    Partisipan yang menjadi anggota di lebih dari satu panel harus mengisi Tahap 1
    secara terpisah untuk tiap panel.

### 3. Buat sesi Task Inventory

Buat sesi dengan parameter berikut (detail langkah: [IK-04 Task Inventory](../ik/task-inventory.md#a-membuat-sesi)):

| Parameter | Pedoman pengisian |
|---|---|
| **Unit / Jenjang** | Pilih unit yang disurvei (boleh "Semua unit"). |
| **Jabatan** | Wajib. Pilih jabatan target; jumlah task per jabatan ditampilkan. |
| **Periode** | Format `YYYY-MM` (mis. `2026-06`). |
| **Min. Responden** | Default 3. Jumlah minimum responden agar hasil layak diagregasi. |
| **Maks. Responden** | Default 10. Harus ≥ Min. Responden. |
| **Catatan** | Opsional — keterangan sesi. |

### 4. Daftarkan responden

1. Buka detail sesi (status **DRAFT**).
2. Daftarkan responden dari daftar partisipan, sesuai anggota panel.
   (Langkah: [IK-04 Task Inventory](../ik/task-inventory.md#b-mendaftarkan-responden).)

!!! success "Selesai persiapan"
    Setelah catalog terverifikasi, panel & koordinator ditetapkan, sesi dibuat, dan
    responden terdaftar — sesi siap dibuka. Lanjut ke
    [SOP Pelaksanaan Pengambilan Data](pelaksanaan-pengambilan-data.md).

---

## Daftar Periksa (Checklist) Persiapan TI

- [ ] Jabatan target terdaftar di Master Data
- [ ] Catalog tugas tersedia untuk kombinasi unit × jabatan
- [ ] SME Panel dibuat & anggota diisi
- [ ] Koordinator panel ditetapkan
- [ ] Partisipan/anggota panel terdaftar
- [ ] Sesi TI dibuat dengan periode & batas responden yang benar
- [ ] Responden terdaftar di sesi
