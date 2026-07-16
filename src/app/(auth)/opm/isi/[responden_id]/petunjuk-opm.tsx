"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";
import { cn } from "@/lib/utils";

// Selaras DIMENSI_LABEL di opm-form.tsx (anchor 1 & 5).
const DIMENSI = [
  {
    title: "Importance — Seberapa Penting",
    anchor1: "Tidak penting",
    anchor5: "Sangat penting",
  },
  {
    title: "Frequency — Seberapa Sering",
    anchor1: "Insidental",
    anchor5: "Sangat sering/Harian",
  },
  {
    title: "Criticality — Dampak Jika Gagal",
    anchor1: "Dampak minimal",
    anchor5: "Dampak kritis",
  },
] as const;

// Contoh non-interaktif: satu kartu tugas dengan I=5, F=4, C=4.
const CONTOH: { dimensi: string; nilai: 1 | 2 | 3 | 4 | 5 }[] = [
  { dimensi: "Importance", nilai: 5 },
  { dimensi: "Frequency", nilai: 4 },
  { dimensi: "Criticality", nilai: 4 },
];

interface Props {
  defaultOpen: boolean;
}

export function PetunjukOpm({ defaultOpen }: Props) {
  return (
    <PetunjukModal
      title="Petunjuk Pengisian Kuesioner OPM — Rating Tugas"
      defaultOpen={defaultOpen}
    >
      <p>
        Pada kuesioner <strong>OPM</strong> Anda menilai <strong>setiap tugas jabatan</strong> pada{" "}
        <strong>tiga dimensi</strong>, masing-masing dengan skala 1–5. Ini bukan tes; jawablah
        sesuai keadaan pekerjaan Anda yang sebenarnya.
      </p>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Arti Tiga Dimensi</h3>
        <ul className="space-y-2">
          {DIMENSI.map((d) => (
            <li key={d.title}>
              <strong>{d.title}</strong> — skala 1 ({d.anchor1}) hingga 5 ({d.anchor5}).
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-950/40">
        <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-200">Petunjuk Umum</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-blue-900/90 dark:text-blue-200/90">
          <li>
            Setiap tugas <strong>wajib dinilai pada ketiga dimensi</strong> (Importance, Frequency,
            Criticality) agar terhitung lengkap.
          </li>
          <li>Isi catatan bila perlu — bersifat opsional.</li>
          <li>
            <strong>Perhatian:</strong> saat Anda menekan &ldquo;Simpan&rdquo; (draft), tugas yang{" "}
            <strong>belum lengkap ketiga dimensinya tidak ikut tersimpan</strong>. Pastikan tiap
            tugas yang ingin Anda simpan sudah dinilai penuh.
          </li>
          <li>
            Tombol &ldquo;Kirim Jawaban&rdquo; baru aktif bila <strong>semua tugas</strong> sudah
            dinilai lengkap.
          </li>
          <li>
            Jawaban <strong>rahasia</strong>, dipakai untuk analisis jabatan/beban kerja.
          </li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Cara Menjawab</h3>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Untuk tiap kartu tugas, pilih satu nilai 1–5 pada Importance, Frequency, dan
            Criticality.
          </li>
          <li>Isi catatan bila perlu.</li>
          <li>Ulangi hingga semua tugas terisi lengkap, lalu kirim.</li>
        </ol>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">
          Contoh Pengisian (ilustrasi)
        </h3>
        <div className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-sm text-gray-800 dark:text-gray-200">
            <span className="mr-2 font-medium text-gray-400">Contoh.</span>
            &ldquo;Menyusun rencana pembelajaran mingguan.&rdquo;
          </p>
          <div className="mt-3 space-y-2">
            {CONTOH.map((c) => (
              <div key={c.dimensi} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-gray-500 dark:text-gray-400">
                  {c.dimensi}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {([1, 2, 3, 4, 5] as const).map((nilai) => (
                    <span
                      key={nilai}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
                        nilai === c.nilai
                          ? "border-blue-500 bg-blue-50 font-medium text-blue-700 dark:border-blue-400 dark:bg-blue-950/60 dark:text-blue-300"
                          : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400",
                      )}
                    >
                      {nilai}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Ketiga dimensi terisi (I=5, F=4, C=4) sehingga tugas ini terhitung lengkap.
          </p>
        </div>
        <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
          Contoh di atas hanya ilustrasi — nilailah tiap tugas sesuai keadaan Anda sendiri.
        </p>
      </div>
    </PetunjukModal>
  );
}
