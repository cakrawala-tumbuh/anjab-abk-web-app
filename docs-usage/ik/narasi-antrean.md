# IK-15 — Antrean Tinjauan Narasi

Langkah melihat kasus narasi yang menunggu tinjauan dan membukanya satu per satu. Akses:
**Tim Kajian**.

Buka grup **Narasi → Antrean** di sidebar kiri. Pengguna tanpa peran Tim Kajian (termasuk
Administrator) melihat panel "Tidak berhak mengakses halaman ini".

!!! note "Yang TIDAK bisa dilakukan di halaman ini"
Halaman ini hanya daftar. Tidak ada kotak centang dan tidak ada aksi massal; kasus ditinjau satu
per satu. Halaman ini tidak meminta draf AI dan tidak menyalakan AI.

---

## Membaca antrean

1. Antrean hanya memuat kasus berstatus `AI_DRAFT`, `TEAM_REVIEW`, atau `NEED_FACT`. Urutannya
   dari yang paling lama tidak diperbarui; urutan ini ditentukan server dan tidak diubah di layar.
2. Kolom **Sumber** menunjukkan jumlah sumber pada versi terbaru. Tanda **Draf AI** muncul bila
   versi terbaru berasal dari draf AI. Tanda peringatan **kontradiksi** muncul bila ada sumber
   yang bertentangan dengan isi versi.
3. Kode instrumen, isian, dan peran tampil apa adanya sebagaimana dicatat pada kasus.
4. Klik status pada sebuah baris untuk membuka kasus tersebut.

## Menyaring antrean

1. Pilih **Status**: antrean langsung disaring.
2. Isi **Instrumen** dan/atau **Periode**, lalu klik **Terapkan**.
3. Filter dan nomor halaman tersimpan di alamat halaman, sehingga dapat disalin atau dimuat ulang.
4. "Antrean kosong" berarti belum ada kasus yang menunggu; kasus baru masuk antrean setelah punya
   versi. "Tidak ada kasus dalam antrean yang cocok dengan filter" berarti filter terlalu sempit;
   klik **Hapus filter**.
5. Bila server gagal menjawab, halaman menampilkan galat dengan tombol **Coba lagi**, bukan
   antrean kosong.
