# FAQ

Pertanyaan yang sering muncul saat menggunakan aplikasi ANJAB-ABK.

---

## Umum

??? question "Apa beda SOP dan IK di dokumentasi ini?"
**SOP** menjelaskan _apa_ yang dilakukan dan _urutannya_ (alur & keputusan). **IK
(Instruksi Kerja)** menjelaskan _bagaimana_ langkah teknis penginputan di aplikasi.
Mulai dari [SOP](../sop/index.md), buka [IK](../ik/index.md) saat butuh detail.

??? question "Saya login tapi tidak melihat menu apapun."
Akun Anda kemungkinan belum tergabung ke grup (peran). Dashboard akan menampilkan
_"Akun Anda belum tergabung ke grup manapun. Hubungi administrator."_ Hubungi
administrator agar akun diberi peran Administrator atau Partisipan.

??? question "Apa saja kelima alat ukurnya?"
**Task Inventory (TI)**, **Time Study (TS)**, **DCS** (Demand-Control-Support, 42 item),
**WCP** (Workplace Climate/Characteristics Profile, 72 item), dan **OPM** (Occupational
Profile Measure — Rating Tugas, 3 dimensi per task). Lihat
[Beranda](../index.md#lima-alat-ukur).

---

## Administrator

??? question "Apa urutan mengisi Master Data?"
Jenjang Pendidikan → Sekolah → Mata Pelajaran → Jabatan → SME Panel → Tugas Pokok →
Uraian/Detil Tugas. Partisipan dibuat setelah Sekolah & Jabatan ada. Lihat
[IK-02](../ik/master-data.md#urutan-pengisian-dependensi).

??? question "Kenapa sesi DCS/WCP tidak meminta jabatan?"
Sesi DCS dan WCP tidak terikat jabatan; partisipan dengan jabatan apapun dapat
ditugaskan ke sesi yang sama.

??? question "Kapan responden bisa didaftarkan?"
**Time Study/DCS/WCP**: saat sesi **Terbuka**. **Task Inventory**: saat **DRAFT** atau
**TAHAP1**. **OPM**: responden terisi **otomatis** dari anggota SME panel saat sesi dibuat;
penambahan manual dilakukan lewat **Tambah Responden** di detail sesi.

??? question "Apakah penutupan sesi bisa dibatalkan?"
Tidak. Penutupan sesi dan transisi tahap bersifat searah. Pastikan data lengkap
sebelum menutup atau berpindah tahap.

??? question "Berapa responden minimum agar hasil sahih?"
Ikuti nilai **Min. Responden** pada sesi (default TI = 3; DCS/WCP = 6; OPM = 3). Jangan
menutup sesi sebelum jumlah pengisi memenuhi minimum.

---

## Task Inventory

??? question "Apa itu Tahap 2 — Review Koordinator?"
Koordinator panel memutuskan relevansi tugas yang **tidak dipilih bulat** oleh semua
anggota (partial). Tugas final = unanimous ∪ yang disetujui koordinator. Lihat
[IK-04 bagian D](../ik/task-inventory.md#d-review-koordinator-tahap-2).

??? question "Tugas partial yang belum diputuskan koordinator, bagaimana?"
Jika belum diputuskan saat masuk Tahap 3, tugas itu **diabaikan** (tidak masuk daftar
final). Pastikan koordinator menyelesaikan review.

??? question "Saya anggota di lebih dari satu panel."
Anda harus mengisi Tahap 1 **terpisah** untuk tiap panel.

---

## Partisipan

??? question "Di mana saya mengisi alat ukur?"
Buka **Kuesioner Saya** dari Dashboard. Alat ukur muncul otomatis saat administrator
membuka sesi dan mendaftarkan Anda sebagai responden.

??? question "Tombol Kirim Jawaban tidak aktif."
Pada DCS/WCP, semua pernyataan wajib dijawab dulu. Periksa penghitung _"{terjawab} /
{total} pernyataan dijawab"_. Pada **OPM**, ketiga dimensi (Importance, Frequency,
Criticality) untuk **setiap task** wajib terisi.

??? question "Bisakah saya mengubah jawaban setelah dikirim?" - **DCS/WCP, OPM & Task Inventory**: tidak — jawaban final (DCS/WCP & OPM dapat dilihat
lagi dalam mode hanya-baca). - **Time Study**: log dapat diedit selama sesi masih **Terbuka**.

??? question "Apa arti warna hari di Time Study?"
**Hijau** = Hari Biasa, **Kuning** = Hari Sibuk, **Merah** = Hari Puncak.

---

!!! info "Masih ada kendala?"
Hubungi administrator studi ANJAB-ABK di yayasan/satuan pendidikan Anda.
