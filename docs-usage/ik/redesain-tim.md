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
2. Klik **Redesain Pekerjaan** — grup menu terbuka berisi **Beranda** dan
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
