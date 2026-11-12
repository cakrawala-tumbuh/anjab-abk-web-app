# IK-21 — Metrik Alur Narasi

Langkah membaca ringkasan kerja alur narasi: keputusan Tim Kajian, cakupan sumber, dan menit aktif
tinjauan pada satu rentang tanggal. Akses: **Tim Kajian**.

Buka **Narasi → Metrik** di sidebar kiri. Pengguna tanpa peran Tim Kajian (termasuk Administrator)
melihat panel "Tidak berhak mengakses halaman ini".

!!! warning "Bukan klaim penghematan waktu"
Angka di halaman ini **tidak boleh dipakai sebagai klaim penghematan waktu**. Waktu diukur sebagai
**menit aktif** (lihat bawah), bukan selisih waktu buka sampai kirim, dan metrik false negative
**belum dihitung** (menunggu keputusan OD-13). Kotak "Metrik yang belum dihitung" di halaman
mencantumkannya.

---

## Memilih rentang

1. Isi **Dari** dan **Sampai** (tanggal inklusif, hari UTC). Bawaannya **30 hari terakhir** sampai
   hari ini.
2. Bila perlu, pilih **Jenis narasi** (F1 sampai F5); bawaannya **Semua jenis**.
3. Klik **Terapkan**.

Rentang paling panjang **366 hari** dan tanggal awal tidak boleh melewati tanggal akhir. Rentang yang
melanggar ditolak langsung di layar, tanpa menghubungi server.

## Membaca kartu

| Kartu                        | Arti                                                                       |
| ---------------------------- | -------------------------------------------------------------------------- |
| Jumlah keputusan Tim         | Keputusan Terima, Koreksi, Tolak, dan Butuh sumber dalam rentang.          |
| Tingkat koreksi              | Keputusan Koreksi dibagi jumlah keputusan.                                 |
| Tingkat penolakan            | Keputusan Tolak dibagi jumlah keputusan.                                   |
| Cakupan sumber               | Proporsi versi narasi yang dibuat dalam rentang dan bertautan ke sumber.   |
| Menit aktif total            | Jumlah menit saat tinjauan benar-benar aktif.                              |
| Median menit aktif per kasus | Nilai tengah menit aktif atas kasus yang punya menit aktif lebih dari nol. |

Persentase tampil dengan satu desimal, mis. **33,3%**. Kartu bertulis **Belum ada data** berarti
penyebutnya nol (belum ada keputusan atau versi pada rentang itu); itu **bukan** 0%. Angka **0,0%**
berarti ada data dan hasilnya memang nol.

## Apa itu menit aktif

Layar **Tinjauan Narasi** ([IK-16](narasi-tinjauan.md)) mencatat satu detak per menit hanya selama
Anda benar-benar aktif: tab sedang terlihat **dan** ada interaksi (ketik, klik, gulir, tombol) dalam
60 detik terakhir. Tab yang tersembunyi atau layar yang dibiarkan tanpa interaksi lebih dari 60 detik
tidak dihitung. Pencatatan berjalan di latar belakang; bila gagal, tinjauan Anda tidak terganggu dan
tidak ada pesan galat.

## Bila halaman gagal dimuat

Pesan galat dari server tampil apa adanya dengan tombol **Coba lagi**. Halaman tidak pernah
menampilkan angka nol sebagai pengganti kegagalan.
