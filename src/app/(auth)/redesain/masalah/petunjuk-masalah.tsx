"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";

/**
 * Petunjuk penggunaan register Masalah Redesain (Tim Kajian).
 *
 * Ringkasan statis dari IK-10; tidak memanggil API. Tidak terbuka sendiri saat dimuat.
 *
 * @returns Tombol "Petunjuk" dan dialog berisi cara memakai register masalah.
 */
export function PetunjukMasalah() {
  return (
    <PetunjukModal
      title="Petunjuk: Masalah Redesain"
      defaultOpen={false}
      triggerLabel="Petunjuk"
      ctaLabel="Mengerti"
    >
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
        <p>Register memuat hipotesis masalah per sekolah dan periode.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Tabel memuat <strong>Kode</strong>, <strong>Konteks</strong>, <strong>Sekolah</strong>,{" "}
            <strong>Periode acuan</strong>, <strong>Status awal</strong>, <strong>Gelombang</strong>
            , dan <strong>Dibuka</strong>.
          </li>
          <li>
            Saring dengan Konteks, Sekolah, Status awal, Gelombang, atau Dibuka untuk konfirmasi;
            filter langsung berlaku.
          </li>
          <li>
            Klik <strong>+ Tambah masalah</strong>, isi formulir, lalu klik{" "}
            <strong>Tambah masalah</strong>. Pilih Belum ditetapkan bila sekolah belum diketahui,
            lalu isi Keterangan sekolah.
          </li>
          <li>
            Klik kode masalah untuk membuka halaman detail; ubah isian lewat{" "}
            <strong>Ubah masalah</strong>.
          </li>
        </ul>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Panduan lengkap: &quot;IK-10 Redesain Pekerjaan&quot;.
        </p>
      </div>
    </PetunjukModal>
  );
}
