"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";
import { cn } from "@/lib/utils";

interface ContohBaris {
  task: string;
  rasio: string;
  keputusan: "Ya" | "Tidak";
}

const CONTOH: ContohBaris[] = [
  { task: "Menyusun laporan bulanan wali kelas", rasio: "4/5", keputusan: "Ya" },
  { task: "Mengelola inventaris laboratorium", rasio: "1/5", keputusan: "Tidak" },
];

interface Props {
  defaultOpen: boolean;
}

/**
 * Konten petunjuk pengisian Tahap 2 Task Inventory (review koordinator atas
 * task partial), dirender di dalam {@link PetunjukModal}.
 *
 * Setara kedalaman dengan `PetunjukDcs`/`PetunjukWcp` (issue backlog #36): di
 * samping "Petunjuk Umum" yang sudah ada sejak backlog 049, komponen ini
 * menambahkan blok "Arti Rasio & Cara Memutuskan" (makna `N/M` + pedoman
 * Ya/Tidak) dan blok "Contoh Pengisian (ilustrasi)" — dua baris statis dengan
 * tombol Ya/Tidak tersorot, meniru gaya kartu contoh non-interaktif
 * `PetunjukDcs`.
 *
 * Isi teks & data contoh mengikuti `## Keputusan Desain` issue #36 apa adanya
 * — bukan konten yang boleh dikarang ulang.
 */
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

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">
          Arti Rasio &amp; Cara Memutuskan
        </h3>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>N/M</strong> berarti N dari M anggota panel menilai task tersebut relevan.
          </li>
          <li>
            Pilih <strong>Ya</strong> bila task memang bagian dari jabatan ini secara umum, meski
            tidak semua anggota mengalaminya.
          </li>
          <li>
            Pilih <strong>Tidak</strong> bila task itu milik jabatan lain atau jelas keliru dipilih.
          </li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">
          Contoh Pengisian (ilustrasi)
        </h3>
        <div className="space-y-3">
          {CONTOH.map((c) => (
            <div
              key={c.task}
              className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  &ldquo;{c.task}&rdquo;{" "}
                  <span className="text-xs text-gray-500 dark:text-gray-400">({c.rasio})</span>
                </p>
                <div className="flex shrink-0 gap-2">
                  {(["Ya", "Tidak"] as const).map((opsi) => (
                    <span
                      key={opsi}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium",
                        opsi === c.keputusan
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/60 dark:text-blue-300"
                          : "border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400",
                      )}
                    >
                      {opsi}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
          Contoh di atas hanya ilustrasi — putuskan sesuai keadaan jabatan yang sebenarnya.
        </p>
      </div>

      <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
        Bagi anggota panel yang bukan koordinator, halaman ini bersifat <strong>hanya-baca</strong>.
      </div>
    </PetunjukModal>
  );
}
