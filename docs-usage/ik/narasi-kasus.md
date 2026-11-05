# IK-14 — Kasus Narasi

Langkah membuat kasus narasi, melihat riwayatnya, dan menulis versi manual bersumber. Akses:
**Tim Kajian**.

Buka grup **Narasi → Kasus** di sidebar kiri. Pengguna tanpa peran Tim Kajian (termasuk
Administrator) melihat panel "Tidak berhak mengakses halaman ini".

!!! note "Yang TIDAK bisa dilakukan di halaman ini"
Halaman ini tidak meninjau, menyetujui, atau meminta draf AI, dan tidak menyalakan AI.
Hanya jenis **F1_FORMAL** dan kelas **NONPRIBADI** yang dibuka; keduanya tampil hanya-baca.

---

## Membuat kasus

1. **Narasi → Kasus**, klik **+ Buat kasus**.
2. Isi **Instrumen**, **Kunci isian**, **Peran**, **Periode**, **Tujuan pemakaian**, dan
   **Lingkup izin** (wajib). **Sekolah**, **Penugasan**, **Subjek sasaran**, dan **Kode konteks**
   boleh dikosongkan. Baca peringatan privasi: jangan menulis nama orang atau data pribadi.
3. Klik **Buat kasus**. Pesan sukses muncul setelah server menjawab sukses, lalu halaman detail
   terbuka. Kasus baru berstatus `SOURCE_CHECKED`.
4. Bila muncul pesan bahwa lingkup yang sama sudah ada, klik **Telusuri kasus berlingkup sama**
   untuk membuka kasus yang sudah ada.

## Menelusuri kasus

1. Di daftar, pilih **Status** dan/atau isi **Instrumen** dan **Periode**, lalu **Terapkan**.
2. Status tampil sebagai nama internal beserta keterangan Indonesia.
3. "Belum ada kasus narasi" berarti belum ada data; "Tidak ada kasus yang cocok dengan filter"
   berarti filter terlalu sempit.

## Menulis revisi manual

1. Klik kasus untuk membuka detail. Bagian **Riwayat** memuat versi dan event berurutan waktu.
2. Di **Tulis revisi manual**, isi **Teks revisi** (maksimal 200.000 karakter).
3. Pilih minimal satu **Sumber**, hubungannya (`DIRECT`, `CONTEXT`, `CONTRADICTS`, `UNKNOWN`),
   dan kutipan bila perlu. Klik **+ Tambah sumber** untuk sumber lain. Tanpa sumber, revisi tidak
   terkirim.
4. Klik **Simpan revisi**. Bila ada orang lain yang menambah versi lebih dulu, muncul pesan
   bahwa versi sudah berubah; teks Anda tetap ada, klik **Muat ulang versi terbaru**, lalu
   simpan lagi.
5. Bila daftar sumber gagal dimuat, halaman menampilkan galat, bukan pilihan kosong.
