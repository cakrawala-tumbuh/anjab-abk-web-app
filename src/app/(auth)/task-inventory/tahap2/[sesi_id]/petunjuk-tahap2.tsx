"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";

interface Props {
  defaultOpen: boolean;
}

export function PetunjukTahap2({ defaultOpen }: Props) {
  return (
    <PetunjukModal
      title="Petunjuk — Tahap 2: Review Koordinator"
      defaultOpen={defaultOpen}
      ctaLabel="Saya Mengerti"
    >
      <p>
        Sebagai <strong>koordinator panel</strong>, pada Tahap 2 Anda memutuskan{" "}
        <strong>task partial</strong> — yaitu task yang{" "}
        <strong>tidak dipilih secara unanimous</strong> (bulat) oleh seluruh anggota panel di Tahap
        1. Task yang unanimous otomatis lolos tanpa review.
      </p>

      <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-950/40">
        <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-200">Petunjuk Umum</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-blue-900/90 dark:text-blue-200/90">
          <li>
            Tiap baris menampilkan sebuah task beserta <strong>rasio anggota</strong> yang
            menilainya relevan (mis. <strong>2/5</strong> berarti 2 dari 5 anggota memilihnya).
          </li>
          <li>
            Tetapkan <strong>Ya</strong> (task masuk ke Tahap 3) atau <strong>Tidak</strong> (task
            ditolak) untuk tiap baris.
          </li>
          <li>
            Tersedia tombol &ldquo;Setujui Semua&rdquo; / &ldquo;Tolak Semua&rdquo; untuk
            mempercepat.
          </li>
          <li>Task yang belum Anda putuskan tidak akan disertakan.</li>
          <li>
            Keputusan Anda <strong>digabung dengan task unanimous</strong> saat sesi masuk Tahap 3.
          </li>
        </ul>
      </div>

      <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
        Bagi anggota panel yang bukan koordinator, halaman ini bersifat <strong>hanya-baca</strong>.
      </div>
    </PetunjukModal>
  );
}
