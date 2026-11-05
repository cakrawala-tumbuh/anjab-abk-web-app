# IK-17 — Penyedia AI

Langkah memilih penyedia model AI (Anthropic API atau langganan Anthropic), mengatur model dan
effort, serta memasang atau menghapus kunci API. Akses: **Administrator**.

Buka **Penyedia AI** di sidebar kiri (grup menu admin, di bawah **Saklar & Run AI**), atau klik
tautan **Pengaturan penyedia AI** di halaman **Saklar & Run AI**. Pengguna selain Administrator
melihat panel "Tidak berhak mengakses halaman ini".

!!! note "Yang TIDAK terjadi di halaman ini"
Memilih penyedia **tidak menyalakan AI**. AI berjalan hanya bila flag layanan di server
aktif dan saklar hidup; kolom **Boleh jalan (saklar)** menampilkan keadaannya. Lokasi
inferensi dan refusal fallback tampil baca-saja karena diatur di deployment.

---

## Membaca status

Bagian **Status penyedia** menampilkan mode, model, effort, status kunci API (hanya
**Terpasang …** dan empat karakter terakhir), status CLI langganan (**Terpasang** beserta versi
atau **Belum terpasang**, dan **Sudah masuk** atau **Belum masuk**), serta siapa yang terakhir
mengubah.

## Mengganti mode

1. Pilih **Mode**: **Mati**, **Anthropic API**, atau **Langganan Anthropic (Pro/Max)**.
2. Isi **Alasan perubahan mode** (minimal 5 karakter), lalu klik **Ganti mode**.
3. Bila mode yang dipilih sama dengan yang berlaku, server menolak dan pesan penolakan tampil.

Di bawah pilihan mode terdapat keterangan tentang mode langganan beserta tiga tautan rujukan
(pengaturan akun, pemakaian data, hukum dan kepatuhan). Baca sebelum memakai mode itu.

Bila mode langganan dipilih tetapi CLI langganan belum terpasang atau belum masuk, muncul
peringatan bahwa panggilan model akan gagal. Operator server masuk di dalam kontainer dengan
perintah `claude auth login`. Aplikasi ini tidak menerima token atau langkah login langganan.

## Mengganti model dan effort

1. Isi **Model** (nilai bawaan tampil di bawah kolom; kosongkan untuk memakai bawaan) dan pilih
   **Effort**.
2. Isi **Alasan perubahan model**, lalu klik **Simpan model dan effort**.
3. Nama model yang tidak sah ditolak server dengan pesan penolakan (`MODEL_DITOLAK`).

## Memasang kunci API

1. Tempel kunci di **Kunci API** (minimal 20 karakter), isi **Alasan perubahan kunci**, lalu
   klik **Pasang kunci**.
2. Kolom kunci **selalu dikosongkan** setelah ada jawaban dari server, berhasil maupun gagal.
   Kunci tidak pernah ditampilkan kembali; layar hanya menunjukkan empat karakter terakhir.
3. Bila kolom kunci nonaktif, penyimpanan belum siap: operator server harus mengisi
   `AI_KREDENSIAL_KUNCI_INDUK` pada deployment, lalu memulai ulang layanan.
4. Bila muncul peringatan bahwa kunci tersimpan tidak dapat dibaca, pasang ulang kunci.

## Menghapus kunci API

Isi **Alasan perubahan kunci**, lalu klik **Hapus kunci** (hanya ada bila kunci terpasang).
