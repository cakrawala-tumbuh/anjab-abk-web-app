# IK-16 — Tinjauan Narasi

Langkah memeriksa satu draf narasi terhadap sumbernya, lalu mencatat satu keputusan. Akses:
**Tim Kajian**.

Buka **Narasi → Antrean**, lalu klik status pada baris kasus yang akan ditinjau.

!!! note "Batas tinjauan ini"
Hasil tertinggi dari tinjauan ini adalah status **TEAM_VERIFIED**: artinya Tim Kajian sudah
memeriksa, belum lebih dari itu. Tidak ada aksi massal, tidak ada "terima semua", dan tidak ada
perpindahan otomatis ke kasus berikutnya. Halaman ini tidak meminta draf AI dan tidak menyalakan AI.

---

## Membaca kasus

1. Di layar lebar, **Draf** ada di kiri dan **Sumber** di kanan; di layar sempit keduanya bertumpuk.
2. Draf yang berasal dari AI diberi catatan **Kandidat dari AI, bukan fakta**.
3. Tiap sumber menampilkan judul, versi, kutipan, hash, hubungan terhadap draf, dan teks sumbernya.
4. Panel **Ketidakpastian** memuat kontradiksi, hal yang belum diketahui, fakta yang hilang,
   pemetaan klaim ke sumber, dan cakupan tinjauan yang disarankan.
5. Versi tanpa teks dinyatakan "Versi ini belum punya teks".

## Mencatat keputusan

Keputusan selalu berlaku atas versi yang sedang tampil di layar.

1. **Terima**: klik, lalu konfirmasi. Tombol nonaktif bila versi tidak punya teks.
2. **Tolak** atau **Butuh sumber**: isi **Catatan** (minimal 5 karakter), lalu klik tombolnya.
   Tanpa catatan yang cukup, keputusan tidak terkirim.
3. **Koreksi**: klik **Koreksi**, isi **Teks koreksi** dan minimal satu baris sumber (sumber,
   hubungan, kutipan), lalu klik **Kirim koreksi**. Catatan tidak wajib.
4. Setelah tercatat, Anda kembali ke antrean dengan pesan yang menyebut status baru kasus itu.

## Bila versi sudah berubah

Bila server menjawab bahwa versi yang Anda lihat sudah basi, isian Anda tetap dipertahankan.
Klik **Muat ulang versi terbaru**, baca versi yang baru, lalu kirim ulang.

Bila kasus ternyata tidak lagi berada dalam antrean, halaman menampilkan keterangan dan tautan
**Kembali ke antrean**.

## Minta kritik AI atas draf (P09)

Pada versi yang bertulis teks, bagian **Kritik AI atas draf** menyediakan tombol **Minta kritik AI**.
Hasilnya usulan yang membantu Anda menemukan kelemahan draf; ia tidak menggantikan tinjauan Anda.
Klik **Buka usulan** setelah "Permintaan diterima" untuk membacanya. Versi tanpa teks tidak
menampilkan tombol ini.

## Pencatatan menit aktif

Selama Anda meninjau, aplikasi mencatat **menit aktif** di latar belakang: satu detak per menit,
hanya bila tab terlihat dan ada interaksi (ketik, klik, gulir, tombol) dalam 60 detik terakhir.
Waktu saat tab tersembunyi atau layar dibiarkan tanpa interaksi tidak dihitung. Tidak ada tombol atau
pesan untuk ini, dan kegagalan pencatatan tidak mengganggu tinjauan. Hasilnya dibaca di
[IK-21 Metrik Alur Narasi](narasi-metrik.md).
