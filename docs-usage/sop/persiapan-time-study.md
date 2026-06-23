# SOP Persiapan — Time Study (TS)

Prosedur baku menyiapkan prasyarat sebelum pengambilan data **Time Study**.

**Tujuan:** memastikan sesi log harian siap diisi partisipan untuk merekam distribusi
waktu aktivitas kerja per jabatan.

**Penanggung jawab:** Administrator studi ANJAB-ABK.

---

## Tentang Time Study

Time Study (Studi Waktu) merekam **log harian** pegawai: jam masuk–keluar, kategori hari,
dan distribusi waktu ke enam kategori aktivitas. Status sesi:
`DRAFT → Terbuka → Tertutup → Teranalisis`.

Kategori hari yang dicatat:

- **Hijau (Hari Biasa)**
- **Kuning (Hari Sibuk)**
- **Merah (Hari Puncak)**

Enam kategori distribusi waktu per hari:

1. Pekerjaan Inti
2. Asesmen Karakter
3. Pengembangan Diri
4. Pekerjaan Strategis
5. Administrasi
6. Istirahat Terstruktur

---

## Prasyarat

| No | Prasyarat | IK terkait |
|---|---|---|
| 1 | **Jabatan** yang akan disurvei sudah terdaftar | [IK-02 Master Data](../ik/master-data.md#jabatan) |
| 2 | **Partisipan** (pegawai yang akan mencatat log) sudah terdaftar | [IK-03 Partisipan](../ik/partisipan.md) |

---

## Langkah Persiapan

### 1. Tentukan jabatan & periode survei

1. Tetapkan jabatan yang akan disurvei waktunya.
2. Tetapkan **periode** pencatatan (format `YYYY-MM`) dan rentang hari pencatatan yang
   diharapkan (mis. dua minggu kerja). Sosialisasikan rentang ini ke partisipan.

### 2. Buat sesi Time Study

Buat sesi dengan parameter berikut (langkah: [IK-05 Time Study](../ik/time-study.md#a-membuat-sesi)):

| Parameter | Pedoman pengisian |
|---|---|
| **Jabatan** | Wajib. Pilih jabatan target. |
| **Periode** | Format `YYYY-MM` (mis. `2026-06`). |
| **Catatan** | Opsional — instruksi/rentang pencatatan. |

### 3. Siapkan daftar responden

Identifikasi pegawai yang akan mencatat log untuk jabatan tersebut. Responden didaftarkan
**setelah sesi dibuka** (pada tahap pelaksanaan).

!!! tip "Pre-isi dari partisipan"
    Saat mendaftarkan responden, memilih partisipan akan mengisi otomatis **Nama** dan
    **Label Jabatan**, sehingga lebih cepat dan konsisten.

!!! success "Selesai persiapan"
    Setelah sesi dibuat dan daftar responden disiapkan, lanjut ke
    [SOP Pelaksanaan Pengambilan Data](pelaksanaan-pengambilan-data.md).

---

## Daftar Periksa (Checklist) Persiapan TS

- [ ] Jabatan target terdaftar di Master Data
- [ ] Partisipan terdaftar
- [ ] Periode & rentang hari pencatatan ditetapkan dan disosialisasikan
- [ ] Sesi TS dibuat dengan jabatan & periode yang benar
- [ ] Daftar responden disiapkan
