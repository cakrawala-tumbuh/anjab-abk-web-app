"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";

/**
 * Petunjuk penggunaan halaman Agenda Yayasan (Tim Kajian).
 *
 * Ringkasan statis dari IK-10; tidak memanggil API. Tidak terbuka sendiri saat dimuat.
 *
 * @returns Tombol "Petunjuk" dan dialog berisi cara membaca agenda yayasan.
 */
export function PetunjukAgendaYayasan() {
  return (
    <PetunjukModal
      title="Petunjuk: Agenda Yayasan"
      defaultOpen={false}
      triggerLabel="Petunjuk"
      ctaLabel="Mengerti"
    >
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
        <p>
          Halaman ini menampilkan penilaian berstatus <strong>Siap untuk telaah yayasan</strong>.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Kolomnya: kode masalah (klik untuk membuka detail), status bukti, saran otomatis, dan
            prioritas final.
          </li>
          <li>Halaman hanya dibaca; yayasan tidak mengisi apa pun di aplikasi.</li>
          <li>
            Untuk mengunduh agenda, pakai <strong>Ringkasan Yayasan</strong>.
          </li>
        </ul>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Panduan lengkap: &quot;IK-10 Redesain Pekerjaan&quot;.
        </p>
      </div>
    </PetunjukModal>
  );
}
