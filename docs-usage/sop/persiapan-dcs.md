# SOP Persiapan — DCS (Demand-Control-Support)

Prosedur baku menyiapkan prasyarat sebelum pengambilan data kuesioner **DCS**.

**Tujuan:** memastikan instrumen DCS dan partisipan siap sehingga partisipan dapat mengisi
kuesioner dengan benar.

**Penanggung jawab:** Administrator studi ANJAB-ABK.

---

## Tentang DCS

DCS (**Demand-Control-Support**) adalah kuesioner yang mengukur tuntutan pekerjaan,
kendali atas pekerjaan, dan dukungan. Instrumen terdiri dari **3 sub-skala** dengan total
**42 item pernyataan**. Setiap item dijawab pada skala Likert 1–5:

| Nilai | Makna               |
| ----- | ------------------- |
| 1     | Sangat Tidak Setuju |
| 2     | Tidak Setuju        |
| 3     | Ragu-ragu           |
| 4     | Setuju              |
| 5     | Sangat Setuju       |

**Instrumen tunggal (singleton):** DCS tidak lagi memakai konsep sesi — satu baris
instrumen tetap untuk seluruh studi, berstatus `Terbuka → Tertutup → Teranalisis`.

---

## Prasyarat

| No  | Prasyarat                                                          | IK terkait                                              |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| 1   | **Partisipan** (calon responden) sudah terdaftar                   | [IK-03 Partisipan](../ik/partisipan.md)                 |
| 2   | **Instrumen DCS** (3 sub-skala, 42 item) sudah ditinjau dan sesuai | [IK-02 Master Data](../ik/master-data.md#instrumen-dcs) |

---

## Langkah Persiapan

### 1. Tinjau instrumen DCS

1. Buka **Master Data → Instrumen DCS**.
2. Tinjau ketiga sub-skala dan teks item. Bila perlu, sunting pernyataan, arah penilaian
   (F/UF), atau urutan item (langkah: [IK-02](../ik/master-data.md#instrumen-dcs)).

!!! warning "Bekukan instrumen sebelum pengisian berjalan"
Hindari mengubah item setelah responden mulai mengisi, agar jawaban tetap konsisten
dan dapat dibandingkan.

### 2. Tinjau pengaturan instrumen DCS

Buka halaman **DCS** — instrumen sudah tersedia sejak awal (berstatus **Terbuka**), tanpa
perlu dibuat. Sesuaikan pengaturan bila perlu (langkah: [IK-06 DCS](../ik/dcs.md#a-halaman-instrumen-dcs)):

| Parameter          | Pedoman pengisian                               |
| ------------------ | ----------------------------------------------- |
| **Min. Responden** | Default 6. Minimum agar hasil layak dianalisis. |
| **Catatan**        | Opsional — keterangan instrumen.                |

### 3. Siapkan daftar responden

Identifikasi partisipan yang akan menjadi responden. Responden ditugaskan (assign)
langsung dari halaman **DCS** pada tahap pelaksanaan — satu kali submit untuk banyak
partisipan sekaligus.

!!! success "Selesai persiapan"
Setelah instrumen ditinjau dan daftar responden disiapkan, lanjut ke
[SOP Pelaksanaan DCS](pelaksanaan-dcs.md).

---

## Daftar Periksa (Checklist) Persiapan DCS

- [ ] Partisipan terdaftar
- [ ] Instrumen DCS (3 sub-skala, 42 item) ditinjau & final
- [ ] Pengaturan instrumen (Min. Responden/Catatan) sesuai
- [ ] Daftar responden disiapkan
