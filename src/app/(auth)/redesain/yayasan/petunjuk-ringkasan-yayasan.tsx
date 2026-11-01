"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";

/**
 * Petunjuk penggunaan halaman Ringkasan Yayasan (Tim Kajian).
 *
 * Ringkasan statis dari IK-10; tidak memanggil API. Tidak terbuka sendiri saat dimuat.
 *
 * @returns Tombol "Petunjuk" dan dialog berisi cara memakai ringkasan dan unduhan.
 */
export function PetunjukRingkasanYayasan() {
  return (
    <PetunjukModal
      title="Petunjuk: Ringkasan Yayasan"
      defaultOpen={false}
      triggerLabel="Petunjuk"
      ctaLabel="Mengerti"
    >
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
        <p>
          Yayasan tidak punya peran input di aplikasi; ia hanya menerima berkas yang diunduh Tim
          Kajian.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Tabel memuat satu baris per masalah. Isian yang belum ada tampil <strong>—</strong>,
            bukan 0 atau Rendah. Pemutus tampil sebagai kode orang, bukan nama.
          </li>
          <li>
            Saring dengan Konteks, Status bukti, Saran otomatis, Prioritas final, atau Status
            penilaian.
          </li>
          <li>
            Klik <strong>Unduh DOCX</strong> pada baris untuk ringkasan satu masalah.
          </li>
          <li>
            Klik <strong>Unduh register (XLSX)</strong> untuk register, atau{" "}
            <strong>Unduh agenda (DOCX)</strong> untuk seluruh masalah berstatus Siap untuk telaah
            yayasan.
          </li>
          <li>Bila unduhan gagal, pesan kesalahan tampil di pojok layar sampai Anda menutupnya.</li>
        </ul>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Panduan lengkap: &quot;IK-10 Redesain Pekerjaan&quot;.
        </p>
      </div>
    </PetunjukModal>
  );
}
