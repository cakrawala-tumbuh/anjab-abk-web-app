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
   **Sesi Partisipasi**, **Agenda Yayasan**, **Ringkasan Yayasan**, **Versi Metode**, dan
   **Riwayat Perubahan**.

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
4. Untuk mengubah keterangan, klik **Ubah** pada baris itu, edit kolom **Keterangan peran**, lalu klik
   **Simpan**. Bila data sudah diubah pengguna lain, muncul pesan "Data telah berubah oleh pengguna
   lain. Muat ulang halaman sebelum menyimpan."; isian Anda tidak hilang.

Kode orang tidak dapat dihapus. Di form lain, kode dipilih lewat daftar berlabel
`kode — keterangan peran` (tanpa nama orang). Bila daftar gagal dimuat, tampil pesan
galat — bukan daftar kosong. Pada isian yang wajib (mis. **Catat isian luring**, **Catat
keputusan prioritas**), daftar awalnya menampilkan **— pilih —**; kode harus dipilih sendiri
sebelum bisa disimpan.

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
5. Untuk meminta usulan dari AI, buka **Usulkan dengan AI**, atur **Sertakan masalah
   redesain sebagai sumber** dan **Jumlah kandidat** (1-5, bawaan 3), lalu klik
   **Usulkan dengan AI**. Permintaan hanya **diterima**; tautan **Buka usulan** membuka
   hasilnya di **Usulan AI**. Bila fungsi AI belum aktif, tampil pesan dari server dan
   tidak ada usulan dibuat. Tidak ada konteks tersimpan sebelum kandidat diterapkan (lihat
   IK-18, "Menerapkan kandidat konteks").

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
**Gelombang**, dan **Dibuka untuk konfirmasi** (bernilai **Dibuka** atau **Tertutup**). Di
sebelah judul tersedia tombol **Petunjuk** (ringkasan cara memakai halaman), **Unduh Lembar
Konfirmasi**, **Kembali ke daftar**, dan **Ubah masalah**. Di bawah identitas ada tab bagian:
**Alur** (tampil lebih dulu), **Penilaian**, **Konfirmasi**, **Bukti**, dan **Alternatif**.

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
dan kosong dari konfirmasi sekolah, beserta **Jumlah konfirmasi**. Ini bahan pertimbangan,
bukan rata-rata atau skor.

Hitungan memakai **versi terkirim terakhir** dari setiap konfirmasi. Bila sekolah meralat
isiannya, ralat yang masih **draf** tidak mengubah hitungan: versi terkirim sebelumnya tetap
dihitung sampai ralat itu dikirim, lalu ralat yang terkirim menggantikannya.

### Agenda yayasan

Menu **Redesain Pekerjaan → Agenda Yayasan** menampilkan penilaian berstatus **Siap untuk
telaah yayasan** dalam tabel berkolom **Masalah** (kode masalah; klik untuk membuka
detail), **Status bukti**, **Saran otomatis**, dan **Prioritas final**. Isian yang belum ada
tampil **—**. Bila daftar panjang, gunakan kontrol halaman di bawah tabel. Bila belum ada
penilaian yang siap, tampil pesan **Belum ada penilaian yang siap untuk telaah yayasan.**
Halaman ini hanya dibaca; yayasan tidak mengisi apa pun di aplikasi.

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
   **Tampilkan versi digantikan** (diikuti jumlah versi digantikan) untuk melihat seluruh versi; versi lama bertanda
   **Digantikan** dan tetap terbaca.
2. Klik **Buka** pada sebuah baris untuk melihat seluruh isiannya (cerita, koreksi, masalah
   baru, alasan K, bukti, hal belum jelas, catatan independensi, dan catatan akses). Klik
   **Tutup** untuk menyembunyikannya.
3. Bila konfirmasi sudah terkirim dan sekolah menyebut **masalah baru**, tampil tombol
   **Angkat masalah**. Pilih **Konteks**, tulis **Rumusan hipotesis** (jabatan atau peran,
   bukan nama orang), lalu klik **Angkat masalah**; Anda diarahkan ke detail masalah baru.
   Tombol ini tidak tampil untuk draf atau konfirmasi tanpa masalah baru.

### Bukti per klaim

Buka tab **Bukti** pada detail masalah. Bukti dicatat sebagai **rujukan teks** (tidak ada
unggah berkas) dan boleh ditautkan ke satu langkah alur.

1. Tabel memuat **Kode** (mis. B-0001), **Langkah** (ditulis `kode — tahap`), **Jenis**,
   **Klaim didukung**, **Independen**, **Status pemeriksaan**, dan **Pemeriksa** (kode orang).
2. Klik **+ Tambah bukti**, isi **Unit / periode**, pilih **Jenis**, **Independen**,
   **Klaim didukung**, dan **Tanggal / versi / lokasi** (rujukan teks; jangan mencantumkan
   identitas murid). **Langkah alur** boleh dikosongkan; pilihannya hanya langkah dari proses
   masalah ini. Pilih **Pembuat** dan **Pemeriksa** sebagai kode orang, lalu klik
   **Tambah bukti**.
3. **Status pemeriksaan** punya empat pilihan: **Belum diperiksa**, **Diperiksa terbatas**,
   **Diperiksa sesuai klaim**, dan **Diperselisihkan**.
4. Untuk mengubah, klik **Ubah bukti** pada bukti terkait, sunting, lalu klik **Simpan bukti**.
   Kode bukti dibuat sistem dan tidak dapat diubah. Bukti tidak dapat dihapus.
5. Bila penyimpanan ditolak, muncul pemberitahuan gagal dan formulir tetap terbuka.
6. Di tab **Alur**, tiap langkah menampilkan **Bukti**: kode bukti yang ditautkan ke langkah itu.

### Alternatif redesain

Buka tab **Alternatif** pada detail masalah. Judul bagian selalu memuat teks **BUKAN BAGIAN
DARI SKOR K1–K4**: alternatif ditelaah terpisah dari skor, dan prioritas tinggi **bukan izin
memindahkan tugas**.

1. Tabel memuat **Kode** (mis. U-001), **Opsi**, **Asal → Penerima** (nama jabatan, bukan
   kode atau id), **Gap penerima**, dan **Status telaah**.
2. Klik **+ Tambah alternatif**, pilih **Opsi**, isi **Alur kini vs usulan**, pilih **Pihak
   asal** dan **Pihak penerima** dari daftar jabatan, lalu isi kesiapan penerima (komitmen,
   jadwal puncak, keterampilan/akses, tambahan bersih, risiko layanan) dan **Gap penerima**.
   Tulis dengan jabatan atau peran, bukan nama orang.
3. **Status telaah** tidak pernah berubah otomatis; hanya berubah bila Anda memilihnya:
   **Belum ditelaah**, **Siap telaah**, **Bersyarat**, **Tunda gap material**, **Ditolak**,
   atau **Uji disetujui terpisah**.
4. Aturan wajib: status **Uji disetujui terpisah** menuntut **Keputusan** dan **Pemutus**
   (kode orang); opsi **Alihkan tugas bersyarat** menuntut **Pihak penerima**. Bila belum
   terpenuhi, muncul pesan merah dan data tidak disimpan.
5. Untuk mengubah, klik **Ubah alternatif**, sunting, lalu klik **Simpan alternatif**. Kode
   dibuat sistem dan tidak dapat diubah. Alternatif tidak dapat dihapus.
6. Bila penyimpanan ditolak, muncul pemberitahuan gagal dan formulir tetap terbuka.

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

## Ringkasan yayasan & unduhan DOCX

Yayasan **tidak punya peran input** di aplikasi; ia hanya menerima berkas ringkasan yang
diunduh Tim Kajian. Halaman ini membantu Tim membaca ringkasan dan mengunduh berkasnya.

1. Klik **Redesain Pekerjaan → Ringkasan Yayasan**. Tabel memuat satu baris per masalah:
   kode masalah, konteks, sekolah, rumusan hipotesis, sumber awal dan keterbatasan, status
   bukti, **K1** sampai **K4**, indikasi kritis, saran otomatis, prioritas final, alasan,
   pemutus, dan tindak lanjut. Isian yang belum ada tampil **—**, bukan 0, Tidak, atau
   Rendah. Pemutus tampil sebagai kode orang dan jabatan, bukan nama. Halaman ini tidak
   memuat isi konfirmasi per orang.
2. Bila ada **peringatan** atas prioritas final, ia tampil sebagai lencana kuning di kolom
   **Peringatan**; arahkan kursor untuk membaca penjelasannya.
3. Untuk menyaring, pilih **Konteks**, **Status bukti**, **Saran otomatis**,
   **Prioritas final**, atau **Status penilaian**. Filter langsung berlaku.
4. Klik kode masalah untuk membuka **detail ringkasan** satu masalah.
5. Klik **Unduh DOCX** pada baris (atau di halaman detail) untuk mengunduh ringkasan satu
   masalah.
6. Klik **Unduh agenda (DOCX)** di bagian atas untuk mengunduh ringkasan seluruh masalah
   berstatus **Siap untuk telaah yayasan**. Bila belum ada satu pun, muncul pemberitahuan
   **Tidak ada masalah di agenda**.
7. Untuk **Lembar Konfirmasi** pra-isi (diserahkan ke yayasan atau sekolah), buka
   **Masalah**, klik kode masalah, lalu klik **Unduh Lembar Konfirmasi** di bagian atas
   halaman detail.
8. Bila unduhan gagal, pesan kesalahan tampil di pojok layar dan tidak hilang sendiri;
   tutup dengan tombol silang.

## Register XLSX & versi metode

### Mengunduh register (XLSX)

1. Buka **Redesain Pekerjaan → Beranda** atau **Ringkasan Yayasan**.
2. Klik **Unduh register (XLSX)**. Berkas `register-redesain-<tanggal>.xlsx` (14 sheet,
   berisi nilai tanpa rumus) tersimpan di perangkat Anda.
3. Berkas ini hanya arsip/QA untuk Tim Kajian. Sumber kebenaran tetap aplikasi — jangan
   menggandakan jawaban sekolah ke berkas lain. Orang tampil sebagai kode, bukan nama.

Bila gagal, muncul notifikasi galat; coba lagi atau masuk kembali bila sesi berakhir.

### Mengelola log versi metode

1. Buka **Redesain Pekerjaan → Versi Metode**. Daftar urut menurut tanggal, versi, bagian.
2. Untuk menambah, isi **Versi**, **Tanggal**, **Bagian**, **Apa yang diperbarui**,
   **Alasan / risiko**, **Status dan hasil uji**, **Pemeriksa / pemutus**, lalu **Tambah**.
   Isi pemeriksa dengan jabatan/peran, **bukan nama orang**.
3. Bila muncul **Versi dan bagian ini sudah tercatat**, pasangan versi + bagian sudah ada;
   ubah catatan yang ada atau gunakan bagian lain.
4. Untuk mengubah, klik **Ubah** pada baris, sunting, lalu **Simpan perubahan**.
5. Catatan versi tidak dapat dihapus.
