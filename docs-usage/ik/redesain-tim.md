# IK-10 — Redesain Pekerjaan (Tim Kajian)

Langkah teknis membuka menu **Redesain Pekerjaan** dan membaca **Riwayat Perubahan**.
Akses: pengguna dengan peran **Tim Kajian**.

!!! warning "Administrator tidak otomatis berhak"
Peran **Administrator** saja **tidak** memberi akses ke Redesain Pekerjaan. Menu tidak
muncul di sidebar, dan mengetik alamat `/redesain` langsung menampilkan
**Tidak berhak mengakses halaman ini**. Akses hanya untuk pengguna yang berperan
**Tim Kajian** (diatur oleh administrator sistem identitas, bukan di aplikasi ini).

---

## Membuka Menu

1. Masuk ke aplikasi, lihat sidebar kiri.
2. Klik **Redesain Pekerjaan** — grup menu terbuka berisi **Beranda**,
   **Kode Orang**, **Cakupan 19 Jabatan**, **Konteks**, **Masalah**, **Eskalasi**,
   **Sesi Partisipasi**, **Agenda Yayasan**, dan **Riwayat Perubahan**.

## Banner PROTOTIPE

Di bagian atas setiap halaman Redesain Pekerjaan tampil banner kuning:

> PROTOTIPE — metode Paket Validasi & Prioritas Redesain v1.3 belum disahkan. Isi register
> BELUM MENJADI TEMUAN.

Banner ini selalu tampil dan tidak bisa ditutup. Isi register di halaman-halaman ini
bukan temuan resmi sampai metodenya disahkan.

## Orang Ditampilkan sebagai Kode

Di seluruh layar Redesain Pekerjaan, orang **tidak pernah** ditampilkan dengan nama atau
email — hanya **kode orang** (contoh `O-0001`). Pada kolom **Pelaku**, tanda `—` berarti
data berasal dari seed/sistem, bukan dari seseorang.

## Membaca Riwayat Perubahan

1. **Redesain Pekerjaan → Riwayat Perubahan**.
2. Tabel menampilkan kolom **Waktu**, **Entitas**, **ID Entitas**, **Aksi**, **Pelaku**,
   **Sebelum**, dan **Sesudah**.
3. Klik **Lihat** pada kolom **Sebelum**/**Sesudah** untuk membuka isi (JSON terformat);
   klik lagi untuk menutup.
4. Untuk menyaring, isi **Entitas** dan/atau **ID entitas**, lalu klik **Terapkan**.
5. Gunakan tombol halaman di bawah tabel bila catatan lebih dari satu halaman.

Halaman ini hanya untuk membaca — tidak ada tombol ubah atau hapus. Riwayat bersifat
catatan tambah-saja (tidak dapat diedit).

!!! note "Bila muncul pesan error"
Jika server menolak (misalnya 403) atau gagal (5xx), halaman menampilkan pesan error
dengan tombol **Coba lagi** — bukan tabel kosong. Tabel kosong berarti memang belum ada
riwayat (atau tidak ada yang cocok dengan filter).

---

## Kode Orang

Kode orang (contoh `O-0001`) adalah identitas narasumber di seluruh register redesain.
Halaman ini satu-satunya layar redesain yang menampilkan **nama** partisipan, karena
peta kode ↔ partisipan hanya untuk Tim Kajian.

1. **Redesain Pekerjaan → Kode Orang**. Tabel memuat **Kode**, **Keterangan peran**,
   **Partisipan**, dan **Dibuat**.
2. Untuk menambah narasumber, isi **Keterangan peran** (tulis jabatan/peran, bukan nama),
   pilih **Partisipan** bila ada (boleh dikosongkan), lalu klik **Tambah**.
3. Bila partisipan itu sudah punya kode, tampil pesan **Partisipan ini sudah punya kode**
   dan tidak ada yang tersimpan.
4. Untuk mengubah keterangan, edit kolom **Keterangan peran** lalu klik **Simpan**.

Kode orang tidak dapat dihapus. Di form lain, kode dipilih lewat daftar berlabel
`kode — keterangan peran` (tanpa nama orang). Bila daftar gagal dimuat, tampil pesan
galat — bukan daftar kosong.

## Cakupan 19 Jabatan

1. **Redesain Pekerjaan → Cakupan 19 Jabatan**. Tabel menampilkan 19 role, masing-masing
   dengan kolom **Bandung** dan **Semarang**.
2. Sel bertanda **Belum dipetakan ke master jabatan** berarti role cabang itu belum
   dihubungkan ke jabatan di master data — cakupan belum lengkap.
3. Klik **Ubah Bandung** / **Ubah Semarang** pada sel untuk membuka form: **Jabatan master**,
   **Status unit**, **Pemegang diperiksa**, **Inventori ditinjau**, **Peta diperkuat**,
   **Gap / variasi** (jangan menulis nama orang), dan **PIC (kode orang)**. Klik **Simpan**.
4. Bila jabatan yang dipilih ternyata sudah tidak ada, server menolak dan tampil pesan galat.

Baris cakupan tidak dapat ditambah atau dihapus dari layar ini.

---

## Konteks

Konteks adalah katalog tema yang menjadi dasar hipotesis masalah. Judul halaman memuat
label tetap **BELUM MENJADI TEMUAN** — isi katalog bukan temuan resmi.

1. **Redesain Pekerjaan → Konteks**. Tabel memuat **Kode**, **Tema**, **Gelombang**,
   **Aktif**, dan **Aksi**.
2. Untuk menambah konteks, buka **Tambah konteks**, isi **Kode (K-NN)** (mis. `K-15`),
   **Tema**, **Gelombang**, **Ruang dugaan**, **Sumber draf**, dan **Batas pemeriksaan**,
   lalu klik **Tambah konteks**. Bila kode sudah dipakai, tampil pesan
   **Kode konteks sudah dipakai**.
3. Untuk mengubah, klik **Ubah** pada baris konteks, sunting isinya, lalu klik
   **Simpan perubahan**. Kode tidak dapat diubah.
4. Untuk menonaktifkan konteks, hilangkan centang **Aktif**. Konteks tidak bisa dihapus.

Jangan menulis nama orang atau data pribadi di isian teks; tulis jabatan atau peran.

## Masalah

Register masalah memuat hipotesis masalah per sekolah dan periode.

1. **Redesain Pekerjaan → Masalah**. Tabel memuat **Kode**, **Konteks**, **Sekolah**,
   **Periode acuan**, **Status awal**, **Gelombang**, dan **Dibuka**. Bila sekolah belum
   ditetapkan, kolom Sekolah menampilkan keterangan sekolah atau **Belum ditetapkan**.
2. Untuk menyaring, pilih **Konteks**, **Sekolah**, **Status awal**, **Gelombang**, atau
   **Dibuka untuk konfirmasi**. Filter langsung berlaku dan tersimpan di alamat halaman.
3. Klik **+ Tambah masalah**, isi formulir (konteks, sekolah atau keterangan sekolah,
   periode acuan, rumusan hipotesis, sumber awal dan keterbatasan, status awal, gelombang,
   penjelasan alternatif, penanggung jawab berupa kode orang, serta uraian tugas yang
   tertaut), lalu klik **Tambah masalah**. Pilih **Belum ditetapkan** pada Sekolah bila
   sekolahnya belum diketahui, lalu isi **Keterangan sekolah**.
4. Klik kode masalah pada tabel untuk membuka halaman detail (lihat bagian berikutnya).
   Untuk mengubah isian masalah, klik **Ubah masalah** di halaman detail, lalu klik
   **Simpan perubahan**.

### Detail masalah & peta alur

Halaman detail memperlihatkan satu masalah dari berbagai sisi. Di bagian atas tampil
identitas masalah: **Konteks**, **Sekolah**, **Periode acuan**, **Status awal**,
**Gelombang**, dan status **Dibuka untuk konfirmasi**. Di bawahnya ada tab bagian; saat ini
tersedia **Alur**, **Penilaian**, dan **Konfirmasi**; bagian lain (bukti, alternatif) akan
ditambahkan pada tab yang sama.

Bagian **Alur** menampilkan proses beserta langkahnya. Proses milik sekolah berbeda tampil
terpisah dan tidak pernah digabung: jangan menuliskan proses sekolah B sebagai fakta dari
catatan sekolah A.

1. **Menambah proses**: klik **+ Tambah proses**, isi **Periode** dan **Nama proses**, lalu
   klik **Tambah proses**. Bila masalah sudah punya sekolah, pilihan **Sekolah** terkunci ke
   sekolah itu; bila belum, pilih sekolahnya. Kode proses (mis. P-001) dibuat otomatis.
   Untuk mengubah, klik **Ubah proses** pada proses yang dimaksud.
2. **Menambah langkah**: klik **+ Tambah langkah** pada proses, isi **Tahap**, **Pemicu /
   masukan**, **Pelaksana**, **Pekerjaan / sistem**, **Keluaran & penerima**, serta
   (opsional) **Urutan**, **Pemeriksa / pemutus**, **Hambatan**, dan **Status langkah**
   (Hipotesis, Keterangan kasus, Diperkuat untuk klaim, Diperselisihkan, Tidak berlaku).
   Kosongkan **Urutan** agar langkah ditaruh di akhir. Langkah tampil terurut menurut
   urutan. Klik **Ubah langkah** untuk mengubahnya; kode langkah tidak dapat diubah.
3. Isi **Pelaksana** dan **Pemeriksa / pemutus** dengan jabatan atau peran, bukan nama
   orang.
4. **Koreksi**: di bawah tiap langkah tampil koreksi yang masuk, berurutan menurut waktu,
   dengan **Kode orang** (mis. O-0001, tanpa nama) dan **Asal**: **Konfirmasi** bila datang
   dari konfirmasi sekolah, atau **Tim** bila ditulis Tim Kajian. Untuk menambah koreksi
   Tim, tulis di kotak **Isi koreksi** lalu klik **Tambah koreksi Tim**. Koreksi tidak dapat
   diubah atau dihapus; bila koreksi sekolah mengubah gambaran alur, ubah langkahnya secara
   manual.

### Penilaian & saran triase

Buka tab **Penilaian** pada detail masalah. Satu masalah punya satu penilaian, diisi Tim
sesudah pemeriksaan.

1. Bila masalah belum dinilai, klik **Mulai penilaian**. Penilaian dibuat dengan isian awal
   netral (Hipotesis, Belum tahu); bila ternyata sudah dibuat orang lain, halaman cukup
   dimuat ulang.
2. Isi **Status bukti**, **Gap material**, dan **Indikasi kritis**, lalu **K1** sampai
   **K4** (Tinggi, Sedang, Rendah, Belum tahu). Pilihan **— belum diisi —** berarti kosong
   dan tidak sama dengan **Belum tahu** ataupun **Rendah**.
3. Isi kolom teks (alasan rentang beda, diluruskan sekolah, pemeriksa sekolah / konteks,
   tindak lanjut, catatan sumber / versi) dengan jabatan atau peran, bukan nama orang.
4. Klik **Simpan penilaian**.
5. Di sebelah kanan, panel **Saran sistem — bukan keputusan** menampilkan saran triase
   beserta **versi aturan**-nya, dihitung oleh sistem dan diperbarui setelah Anda
   menyimpan. Saran hanyalah masukan; Anda tidak dapat mengubahnya di sini.

### Mencatat prioritas final

Pada tab **Penilaian** terdapat panel **Keputusan prioritas** yang menampilkan **Saran
otomatis** berdampingan dengan **Prioritas final**. Prioritas final dicatat oleh Tim Kajian
atas keputusan pemutus; yayasan tidak mengisi di aplikasi.

1. Klik **Catat keputusan prioritas**.
2. Pilih **Prioritas final** (P0 - Eskalasi, K - Klarifikasi, P1 - Utama, P2 - Berikutnya,
   P3 - Pantau, atau Ditunda).
3. Isi **Alasan keputusan** — selalu wajib, juga bila prioritasnya sama dengan saran.
4. Pilih **Kode orang pemutus**, isi **Jabatan pemutus**, dan **Tanggal keputusan** (tidak
   boleh di masa depan). Pemutus tampil sebagai kode dan jabatan, tidak pernah nama.
5. Bila Anda memilih P1–P3 sedangkan status bukti belum **Diperkuat untuk klaim**, tampil
   peringatan: alasan wajib menjelaskannya. Peringatan ini tidak memblokir simpan.
6. Klik **Simpan keputusan**. Sesudah tersimpan, tampil alasan, pemutus, tanggal, dan saran
   saat keputusan. Badge **Berbeda dari saran** muncul bila keputusan berbeda dari saran.

Keputusan boleh dicatat ulang. Di bawahnya, pilihan **Status penilaian** (Belum ditelaah,
Perlu klarifikasi, Siap untuk telaah yayasan, Ditunda) mengatur kesiapan penilaian; status
**Telah diputuskan** hanya muncul lewat pencatatan keputusan, tidak ada di pilihan.

Tabel **Sebaran K1–K4** menampilkan hitungan jawaban Tinggi, Sedang, Rendah, Belum tahu,
dan kosong dari konfirmasi sekolah. Ini bahan pertimbangan, bukan rata-rata atau skor.

### Agenda yayasan

Menu **Agenda Yayasan** menampilkan penilaian berstatus **Siap untuk telaah yayasan**:
kode masalah (klik untuk membuka detail), status bukti, saran otomatis, dan prioritas
final. Halaman ini hanya dibaca; yayasan tidak mengisi apa pun di aplikasi.

### Membuka masalah untuk konfirmasi sekolah

Pada kolom **Dibuka**, klik **Buka untuk konfirmasi sekolah** agar masalah muncul di daftar
sekolah, atau **Tutup** untuk menyembunyikannya kembali. Perubahan langsung terlihat.

### Status awal dibekukan

Setelah konfirmasi pertama dari sekolah terkirim, **Status awal** dibekukan: pilihannya
nonaktif dan tampil keterangan **Dibekukan sejak <tanggal> (konfirmasi pertama terkirim)**.
Field lain tetap dapat diubah.

### Membaca konfirmasi sekolah

Buka tab **Konfirmasi** pada detail masalah. Tabel menampilkan keterangan sekolah apa
adanya (hanya dibaca; tidak ada tombol ubah atau hapus): **Kode orang**, **Peran**,
**Sumber** (daring atau luring), **Status**, **Dikirim**, **Dugaan diperlihatkan** (Ya atau
Belum), **Kesesuaian**, **K1** sampai **K4**, dan **Indikasi risiko**.

1. Versi yang sudah **Digantikan** oleh ralat disembunyikan secara default. Centang
   **Tampilkan versi digantikan** untuk melihat seluruh versi; versi lama bertanda
   **Digantikan** dan tetap terbaca.
2. Klik **Buka** pada sebuah baris untuk melihat seluruh isiannya (cerita, koreksi, masalah
   baru, alasan K, bukti, hal belum jelas, catatan independensi, dan catatan akses). Klik
   **Tutup** untuk menyembunyikannya.
3. Bila konfirmasi sudah terkirim dan sekolah menyebut **masalah baru**, tampil tombol
   **Angkat masalah**. Pilih **Konteks**, tulis **Rumusan hipotesis** (jabatan atau peran,
   bukan nama orang), lalu klik **Angkat masalah**; Anda diarahkan ke detail masalah baru.
   Tombol ini tidak tampil untuk draf atau konfirmasi tanpa masalah baru.

### Eskalasi

Bila konfirmasi sekolah menyatakan **Ada indikasi** risiko serius, masalahnya otomatis
tereskalasi tanpa menunggu penilaian. Penandanya hanya tampil di layar (tidak ada
pemberitahuan email atau Telegram):

1. Badge **Eskalasi** muncul di samping kode masalah pada halaman detail dan pada kolom
   **Eskalasi** di tabel Masalah.
2. **Redesain Pekerjaan → Eskalasi** menampilkan semua masalah tereskalasi, yang terbaru
   di atas. Klik kode masalah untuk membuka tab Konfirmasi.

### Mencatat isian luring

Bila pemberi keterangan mengisi lembar kertas, Tim mencatatnya atas nama mereka.

1. Pada tab **Konfirmasi**, klik **Catat isian luring**.
2. Pilih **Kode orang pemberi keterangan** dan **Sekolah**, isi **Tanggal isian** (kosong =
   hari ini) dan **Jabatan/peran**. Jangan menulis nama orang di isian teks.
3. Isi **Kesesuaian dugaan**, **K1** sampai **K4**, **Indikasi risiko**, serta kolom lain
   sesuai lembar kertas.
4. Klik **Simpan isian luring**. Konfirmasi tercatat dengan sumber **luring** dan langsung
   berstatus terkirim. Bila ada isian wajib yang kurang, pesan menyebut nama fieldnya dan
   formulir tetap terbuka. Pasangan masalah dan kode orang yang sudah punya konfirmasi
   ditolak.

## Sesi partisipasi & rekap

Halaman ini mencatat keterlibatan satu orang pada satu sesi kegiatan redesain. Catatan ini
**BUKAN Time Study**. Orang tampil sebagai kode (mis. O-0001), bukan nama.

1. **Redesain Pekerjaan → Sesi Partisipasi**. Tabel memuat **Kode sesi**, **Kode orang**,
   **Sekolah**, **Peran**, **Jenis kegiatan**, **Menit rencana**, **Menit disepakati**, dan
   **Status izin**. Menit yang belum diisi tampil **—**.
2. Untuk menyaring, isi **Kode sesi** atau **Kode orang** (tekan Enter), atau pilih
   **Jenis kegiatan** atau **Status izin**. Filter langsung berlaku dan tersimpan di alamat
   halaman.
3. Klik **+ Tambah sesi**, isi **Kode sesi** (dibagi semua peserta satu kegiatan),
   **Kode orang**, **Peran**, **Jenis kegiatan**, serta menit, lalu klik **Catat sesi**.
   Menit boleh dikosongkan, tetapi tidak boleh negatif. Pilih satu atau lebih **Masalah
   tertaut** bila relevan.
4. **Status izin** hanya informasi; tidak menghalangi pencatatan. Sesi dengan status
   **Tidak diotorisasi** tetap dapat disimpan.
5. Bila pasangan kode sesi dan kode orang sudah ada, tampil pesan **Orang ini sudah
   tercatat di sesi tersebut**.
6. Untuk mengubah, klik kode sesi pada tabel, sunting isinya, lalu klik **Simpan
   perubahan**.

### Rekap per orang

Klik **Rekap per orang** untuk melihat, per kode orang, **Jumlah sesi**, **Total menit
rencana**, dan **Total menit disepakati**. Total yang belum ada isinya tampil **—**, bukan 0.

Jangan menulis nama orang atau data pribadi di isian teks; tulis jabatan atau peran.
