# IK-20 — Klarifikasi Narasi

Langkah menyusun, menyetujui, mencatat jawaban, dan membatalkan **pertanyaan klarifikasi**
material untuk satu klaim pada kasus narasi. Akses: **Tim Kajian**.

Buka grup **Narasi → Klarifikasi** di sidebar kiri. Pengguna tanpa peran Tim Kajian (termasuk
Administrator) melihat panel "Tidak berhak mengakses halaman ini".

!!! note "Pengiriman dilakukan di luar aplikasi"
Aplikasi ini **tidak mengirim** pertanyaan ke responden dan tidak punya tombol kirim WhatsApp
atau email. Pertanyaan disusun di sini, dikirim **fasilitator di luar aplikasi**, lalu
jawabannya dicatat kembali dengan rujukan jawaban (ResponseRef).

---

## A. Membaca daftar klarifikasi

1. Halaman **Klarifikasi Narasi** menampilkan klarifikasi **Terbuka** lebih dulu. Kolom: pertanyaan,
   klaim, peran penerima, persetujuan, disposisi, dan waktu dibuat.
2. Ubah **Disposisi** untuk melihat yang Terjawab, Dibatalkan, Ditolak, atau pilih **Semua
   disposisi**. Isi **ID kasus narasi** lalu klik **Terapkan** untuk menyaring satu kasus.
3. "Belum ada klarifikasi terbuka" berarti register kosong; "Tidak ada klarifikasi yang cocok
   dengan filter" berarti filter terlalu sempit, klik **Hapus filter**.
4. Bila server gagal menjawab, halaman menampilkan galat dengan tombol **Coba lagi**, bukan daftar kosong.

## B. Mengajukan pertanyaan baru

Ada dua jalan.

**Dari kasus narasi.**

1. Buka **Narasi → Kasus**, pilih kasus, lalu klik **Ajukan klarifikasi**.
2. Isi klaim yang ditanyakan, peran penerima, periode (terisi dari kasus, boleh diubah), alasan
   material, hipotesis alternatif, keputusan yang dibantu, pemicu batas waktu, dan pertanyaan.
3. Centang minimal satu **sumber yang sudah dicek**.
4. **Paparan (Exposure)** tampil sebagai keterangan dan tidak dapat diubah: nilainya diambil dari
   kasus. Kasus yang belum masuk antrean tinjauan berpaparan "Tidak diketahui".
5. Pertanyaan boleh memuat **paling banyak satu tanda tanya**.
6. Klik **Ajukan klarifikasi**. Setelah berhasil Anda dibawa ke halaman detailnya, berstatus
   _Menunggu persetujuan_.

**Dari usulan AI P04.** Lihat [IK-18 Usulan AI](usulan-ai.md): setelah usulan P04 yang material
diterima, panel **Terapkan ke register klarifikasi** memasukkan pertanyaannya ke register.
Anda hanya mengisi klaim dan pemicu batas waktu; keputusan yang dibantu boleh dikosongkan (diisi
dari alasan bertanya pada usulan). Setelah berhasil muncul tautan ke klarifikasinya. Bila usulan
itu sudah pernah diterapkan, muncul tautan ke klarifikasi yang sudah ada.

## C. Menyetujui atau menolak

1. Buka klarifikasi yang berstatus _Menunggu persetujuan_.
2. Klik **Setujui**, atau isi **Catatan penolakan** (minimal 5 karakter) lalu klik **Tolak**.
3. Penyusun pertanyaan **tidak boleh menyetujui pertanyaannya sendiri**; aplikasi menampilkan
   pesan dan Anda perlu meminta reviewer lain.
4. Pertanyaan yang ditolak ditutup dengan disposisi _Ditolak_.

## D. Mengirim (di luar aplikasi) dan mencatat jawaban

1. Pada klarifikasi yang sudah _Disetujui_ dan masih _Terbuka_, klik **Salin pertanyaan**, lalu
   fasilitator mengirimnya di luar aplikasi.
2. Setelah jawaban diterima, isi **Rujukan jawaban (ResponseRef)** dan **Jawaban mentah** (apa
   adanya dari responden). Keduanya wajib. Klik **Catat jawaban**.
3. Disposisi berubah menjadi _Terjawab_; jawaban tampil pada rincian dan tercatat di riwayat.

## E. Membatalkan

Pada klarifikasi yang masih _Terbuka_, isi **Catatan pembatalan** (minimal 5 karakter) lalu klik
**Batalkan klarifikasi**. Disposisi menjadi _Dibatalkan_.

## F. Membaca halaman detail

- Teks pertanyaan tampil di atas, diikuti **13 metadata** register (nama metadata dalam kurung):
  ID pertanyaan, klaim, sumber yang dicek, alasan material, hipotesis alternatif, keputusan yang
  dibantu, peran penerima, periode, paparan, pemicu batas waktu, persetujuan reviewer, rujukan
  jawaban, dan disposisi.
- **Riwayat** memuat setiap aksi (dibuat, disetujui, ditolak, jawaban dicatat, dibatalkan) urut
  dari yang terlama, lengkap dengan pelaku, waktu, dan catatan.
- Bila ada konflik (mis. sudah ada klarifikasi terbuka untuk klaim yang sama, atau halaman sudah
  usang), aplikasi menampilkan pesan yang menjelaskan sebabnya; isian Anda tidak dibuang.
