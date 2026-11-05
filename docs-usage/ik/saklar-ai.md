# IK-12 — Saklar & Run AI

Langkah menghentikan atau menghidupkan kembali layanan AI dan menelusuri catatan tiap
pemanggilan AI. Akses: **Administrator**.

Buka **Saklar & Run AI** di sidebar kiri (grup menu admin, di bawah **Backup & Restore**).
Pengguna selain Administrator melihat panel "Tidak berhak mengakses halaman ini".

!!! note "Yang TIDAK bisa dilakukan di halaman ini"
Halaman ini tidak menyalakan AI. Menyalakan atau mematikan flag layanan adalah pengaturan
deployment di server, bukan tombol di layar ini. Isi masukan dan keluaran AI juga tidak
pernah ditampilkan, hanya catatan teknis tiap run.

---

## Mematikan layanan AI

1. **Saklar & Run AI → Saklar AI**. Baca status: **Flag env**, **Saklar**, **Boleh jalan**.
2. Isi **Alasan** (minimal 5 karakter).
3. Klik **Matikan**. Tidak ada konfirmasi tambahan supaya penghentian saat insiden cepat.
4. Setelah server menjawab sukses, status **Saklar** berubah menjadi **Dimatikan**.
   Bila layanan sudah dimatikan, muncul pesan penolakan dan tidak ada yang berubah.

## Menghidupkan kembali saklar

1. Isi **Alasan** (minimal 5 karakter), lalu klik **Hidupkan**.
2. Status **Saklar** kembali **Hidup**. Bila **Flag env** masih **Mati**, panel menyatakan
   bahwa AI tetap tidak berjalan walau saklar hidup.

---

## Register run

Tabel **Register Run** di bawah panel saklar memuat satu baris per pemanggilan AI.

1. Isi **Fungsi** dan/atau pilih **Status QA**, lalu klik **Terapkan**. Filter ikut tertulis
   di alamat halaman.
2. Klik kode di kolom **Run** untuk membuka **Detail Run AI** (versi prompt, model, token,
   sumber data beserta hash-nya).
