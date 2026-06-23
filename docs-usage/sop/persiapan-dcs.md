# SOP Persiapan — DCS (Demand-Control-Support)

Prosedur baku menyiapkan prasyarat sebelum pengambilan data kuesioner **DCS**.

**Tujuan:** memastikan instrumen DCS, partisipan, dan sesi survei siap sehingga partisipan
dapat mengisi kuesioner dengan benar.

**Penanggung jawab:** Administrator studi ANJAB-ABK.

---

## Tentang DCS

DCS (**Demand-Control-Support**) adalah kuesioner yang mengukur tuntutan pekerjaan,
kendali atas pekerjaan, dan dukungan. Instrumen terdiri dari **3 sub-skala** dengan total
**42 item pernyataan**. Setiap item dijawab pada skala Likert 1–5:

| Nilai | Makna |
|---|---|
| 1 | Sangat Tidak Setuju |
| 2 | Tidak Setuju |
| 3 | Ragu-ragu |
| 4 | Setuju |
| 5 | Sangat Setuju |

Status sesi: `DRAFT → Terbuka → Tertutup → Teranalisis`.

!!! note "Sesi tidak terikat jabatan"
    Sesi DCS tidak memerlukan pemilihan jabatan saat dibuat. Partisipan dengan jabatan
    apapun dapat ditugaskan ke sesi yang sama.

---

## Prasyarat

| No | Prasyarat | IK terkait |
|---|---|---|
| 1 | **Partisipan** (calon responden) sudah terdaftar | [IK-03 Partisipan](../ik/partisipan.md) |
| 2 | **Instrumen DCS** (3 sub-skala, 42 item) sudah ditinjau dan sesuai | [IK-02 Master Data](../ik/master-data.md#instrumen-dcs) |

---

## Langkah Persiapan

### 1. Tinjau instrumen DCS

1. Buka **Master Data → Instrumen DCS**.
2. Tinjau ketiga sub-skala dan teks item. Bila perlu, sunting pernyataan, arah penilaian
   (F/UF), atau urutan item (langkah: [IK-02](../ik/master-data.md#instrumen-dcs)).

!!! warning "Bekukan instrumen sebelum sesi berjalan"
    Hindari mengubah item setelah responden mulai mengisi, agar jawaban tetap konsisten
    dan dapat dibandingkan.

### 2. Buat sesi DCS

Buat sesi dengan parameter berikut (langkah: [IK-06 DCS](../ik/dcs.md#a-membuat-sesi)):

| Parameter | Pedoman pengisian |
|---|---|
| **Periode** | Format `YYYY-MM` (mis. `2026-06`). |
| **Min. Responden** | Default 6. Minimum agar hasil layak dianalisis. |
| **Maks. Responden** | Default 8. Harus ≥ Min. Responden. |
| **Catatan** | Opsional — keterangan sesi. |

### 3. Siapkan daftar responden

Identifikasi partisipan yang akan menjadi responden. Responden didaftarkan **setelah sesi
dibuka** (pada tahap pelaksanaan).

!!! success "Selesai persiapan"
    Setelah instrumen ditinjau, sesi dibuat, dan daftar responden disiapkan, lanjut ke
    [SOP Pelaksanaan Pengambilan Data](pelaksanaan-pengambilan-data.md).

---

## Daftar Periksa (Checklist) Persiapan DCS

- [ ] Partisipan terdaftar
- [ ] Instrumen DCS (3 sub-skala, 42 item) ditinjau & final
- [ ] Sesi DCS dibuat dengan periode & batas responden yang benar
- [ ] Daftar responden disiapkan
