"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";

/**
 * Petunjuk penggunaan halaman Konteks Redesain (Tim Kajian).
 *
 * Ringkasan statis dari IK-10; tidak memanggil API. Tidak terbuka sendiri saat dimuat.
 *
 * @returns Tombol "Petunjuk" dan dialog berisi cara memakai halaman Konteks.
 */
export function PetunjukKonteks() {
  return (
    <PetunjukModal
      title="Petunjuk: Konteks Redesain"
      defaultOpen={false}
      triggerLabel="Petunjuk"
      ctaLabel="Mengerti"
    >
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
        <p>
          Konteks adalah katalog tema dasar hipotesis masalah. Isinya bukan temuan resmi (label{" "}
          <strong>BELUM MENJADI TEMUAN</strong>).
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Tabel memuat <strong>Kode</strong>, <strong>Tema</strong>, <strong>Gelombang</strong>,{" "}
            <strong>Aktif</strong>, dan <strong>Aksi</strong>.
          </li>
          <li>
            Buka <strong>Tambah konteks</strong>, isi Kode (K-NN), Tema, Gelombang, Ruang dugaan,
            Sumber draf, dan Batas pemeriksaan, lalu klik <strong>Tambah konteks</strong>.
          </li>
          <li>
            Klik <strong>Ubah</strong> pada baris untuk menyunting, lalu{" "}
            <strong>Simpan perubahan</strong>. Kode tidak dapat diubah.
          </li>
          <li>
            Untuk menonaktifkan, hilangkan centang <strong>Aktif</strong>. Konteks tidak bisa
            dihapus.
          </li>
          <li>Jangan menulis nama orang atau data pribadi; tulis jabatan atau peran.</li>
        </ul>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Panduan lengkap: &quot;IK-10 Redesain Pekerjaan&quot;.
        </p>
      </div>
    </PetunjukModal>
  );
}
