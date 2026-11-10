# IK-18 — Usulan AI

Langkah menelusuri, membaca, dan memutus usulan yang dihasilkan fungsi AI mana pun. Akses:
**Tim Kajian**.

Buka **Usulan AI** di sidebar kiri. Pengguna tanpa peran Tim Kajian (termasuk Administrator)
melihat panel "Tidak berhak mengakses halaman ini".

!!! note "Yang perlu diketahui"
Usulan hanyalah kandidat dari AI. Tidak ada yang berlaku sebelum diputus oleh manusia.
Halaman ini tidak menyalakan AI dan tidak mengajukan permintaan baru. Usulan konteks (P11)
diajukan dari halaman Konteks redesain; normalisasi tugas (P02) dan tag peran (P03) diajukan
dari halaman katalog Task Inventory per jabatan; hipotesis proses (P05), opsi redesain (P06), dan
kartu keputusan (P07) diajukan dari tab **AI** pada detail masalah redesain; sintesis bukti
riset (P08) diajukan dari detail protokol riset yang sudah terkunci.

---

## Membaca daftar

1. Daftar memuat usulan dari semua fungsi AI, yang terbaru di atas.
2. Kolom **Fungsi** berisi kode fungsi (mis. P09, P02 Normalisasi tugas, P03 Tag peran, P05 Hipotesis proses, P06 Opsi redesain, P07 Kartu keputusan, P08 Sintesis bukti riset) dan namanya bila dikenal; kode yang belum
   dikenal tampil apa adanya. Klik untuk membuka detail.
3. Kolom **Sasaran** menunjukkan jenis objek (termasuk **Jabatan** untuk P02 dan P03, **Masalah redesain** untuk P05-P07, serta **Protokol riset** untuk P08). Untuk kasus narasi dan masalah redesain,
   tautan **(buka)** membuka kasus atau masalahnya.
4. Kolom **Hasil serap** menyatakan apakah keluaran AI sudah diserap; **Belum diserap** berarti
   belum ada isi usulan.
5. Kolom **Putusan terakhir** menampilkan putusan terbaru, atau **Belum diputus**.

## Menyaring daftar

1. Isi **Fungsi** lalu klik **Terapkan**, dan/atau pilih **Sasaran** (langsung berlaku).
2. Filter dan nomor halaman tersimpan di alamat halaman.
3. Daftar belum dapat disaring menurut status putusan.

## Membaca detail

1. **Isi usulan** ditampilkan apa adanya sebagai daftar label dan nilai, apa pun fungsinya.
2. **Amplop keluaran** memuat rujukan sumber, kutipan, hal yang belum diketahui, kontradiksi,
   dan penanda perlunya tinjauan manusia.
3. **Riwayat putusan** mencatat siapa memutus apa dan kapan.

## Memberi putusan

1. Pilih **Putusan**:
   - **APPROVE**: tanpa tingkat koreksi dan tanpa teks koreksi.
   - **REVISE**: wajib **Tingkat koreksi** dan **Teks koreksi**.
   - **REJECT**: wajib **Tingkat koreksi** dan **Catatan** minimal 5 karakter.
2. Klik **Kirim putusan**. Kombinasi yang tidak sah ditolak di layar dengan pesan.
3. Setelah berhasil, halaman dimuat ulang dan putusan muncul di riwayat. Bila server menolak
   (mis. konflik), pesannya tampil dan isian Anda dipertahankan.

## Menerapkan kandidat konteks

Berlaku hanya untuk usulan **P11 Pengusul Konteks** yang putusan terakhirnya **APPROVE**
atau **REVISE**. Panel **Terapkan kandidat** muncul di atas form putusan.

1. Tiap kandidat punya bagian sendiri. Isi **Kode (K-NN)** (mis. `K-15`) dan periksa
   **Gelombang** (terisi saran AI), **Tema**, **Ruang dugaan**, **Sumber draf**, dan
   **Batas pemeriksaan**. Keempat isian boleh disunting dan semuanya wajib terisi.
2. Klik **Terapkan kandidat**. Setelah berhasil tampil **Konteks K-NN dibuat** dan konteks
   baru muncul di halaman Konteks.
3. Kandidat yang sudah diterapkan menampilkan **Sudah diterapkan sebagai K-NN** dan tidak
   dapat diterapkan lagi.
4. Bila server menolak (mis. kode sudah dipakai, usulan belum diterima), pesannya tampil
   dan isian dipertahankan.
