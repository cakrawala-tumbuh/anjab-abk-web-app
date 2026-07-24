"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";
import { cn } from "@/lib/utils";

/**
 * Makna nilai 1–5 untuk satu dimensi rating OPM (Importance, Frequency, atau
 * Criticality). Nilai 1 dan 5 memuat frasa anchor persis seperti
 * `DIMENSI_LABEL` di `opm-form.tsx`, diikuti penjelasan tambahan; nilai 2–4
 * (kosong di form) diberi makna eksplisit di sini supaya partisipan tidak
 * menumpuk rating di ujung skala karena nilai tengah tampak tanpa arti.
 */
interface MaknaNilai {
  nilai: 1 | 2 | 3 | 4 | 5;
  importance: string;
  frequency: string;
  criticality: string;
}

/** Tabel makna nilai 1–5 ketiga dimensi OPM — lihat Keputusan Desain issue #37. */
const MAKNA_NILAI: MaknaNilai[] = [
  {
    nilai: 1,
    importance: "Tidak penting — bisa ditiadakan tanpa pengaruh berarti",
    frequency: "Insidental — hanya bila ada kejadian tertentu",
    criticality: "Dampak minimal — kekeliruan mudah diperbaiki",
  },
  {
    nilai: 2,
    importance: "Kurang penting",
    frequency: "Beberapa kali dalam setahun",
    criticality: "Dampak kecil",
  },
  {
    nilai: 3,
    importance: "Cukup penting",
    frequency: "Bulanan",
    criticality: "Dampak sedang",
  },
  {
    nilai: 4,
    importance: "Penting",
    frequency: "Mingguan",
    criticality: "Dampak besar",
  },
  {
    nilai: 5,
    importance: "Sangat penting — jabatan ini kehilangan maknanya bila tugas ini tidak dikerjakan",
    frequency: "Sangat sering/Harian",
    criticality: "Dampak kritis — kegagalannya merugikan murid/sekolah dan sulit dipulihkan",
  },
];

/**
 * Tiga dimensi rating OPM. `key` menunjuk kolom yang sesuai di
 * {@link MAKNA_NILAI}; `title` disalin persis dari `DIMENSI_LABEL[dim].title`
 * di `opm-form.tsx` supaya petunjuk dan form tidak melenceng.
 */
const DIMENSI = [
  { key: "importance", title: "Importance — Seberapa Penting" },
  { key: "frequency", title: "Frequency — Seberapa Sering" },
  { key: "criticality", title: "Criticality — Dampak Jika Gagal" },
] as const;

/** Satu entri contoh pengisian non-interaktif (ilustrasi, bukan input). */
interface ContohIsi {
  tugas: string;
  nilai: { dimensi: string; nilai: 1 | 2 | 3 | 4 | 5 }[];
  keterangan: string;
}

/**
 * Dua contoh kontras: Contoh A bernilai tinggi di ketiga dimensi (rating
 * lengkap), Contoh B bernilai rendah — supaya partisipan membaca nilai
 * rendah sebagai jawaban yang sah, bukan indikasi form belum lengkap.
 */
const CONTOH: ContohIsi[] = [
  {
    tugas: "Menyusun rencana pembelajaran mingguan.",
    nilai: [
      { dimensi: "Importance", nilai: 5 },
      { dimensi: "Frequency", nilai: 4 },
      { dimensi: "Criticality", nilai: 4 },
    ],
    keterangan: "Ketiga dimensi terisi (I=5, F=4, C=4) sehingga tugas ini terhitung lengkap.",
  },
  {
    tugas: "Mendampingi lomba tingkat kecamatan.",
    nilai: [
      { dimensi: "Importance", nilai: 3 },
      { dimensi: "Frequency", nilai: 1 },
      { dimensi: "Criticality", nilai: 2 },
    ],
    keterangan:
      "Tugas yang jarang dan dampaknya terbatas wajar bernilai rendah — nilai rendah bukan " +
      "berarti tugas itu tidak berharga.",
  },
];

interface Props {
  defaultOpen: boolean;
}

/**
 * Pop-up "Petunjuk Pengisian" untuk kuesioner OPM (`/opm/isi/{responden_id}`).
 *
 * Menjelaskan makna kelima titik skala (1–5) pada tiap dimensi rating
 * (Importance, Frequency, Criticality) dan memuat dua contoh pengisian
 * kontras — satu bernilai tinggi, satu bernilai rendah — agar rating rendah
 * terbaca sebagai jawaban yang sah, bukan kesalahan pengisian.
 *
 * @param defaultOpen - Buka modal otomatis sekali saat mount (biasanya
 *   `!sudah_submit`); bila `false`, modal hanya terbuka lewat tombol pemicu.
 */
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
        <div className="space-y-4">
          {DIMENSI.map((d) => (
            <div key={d.key}>
              <p className="font-medium text-gray-900 dark:text-gray-100">{d.title}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {MAKNA_NILAI.map((m) => (
                  <li key={m.nilai}>
                    <strong>{m.nilai}</strong> — {m[d.key]}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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
        <div className="space-y-3">
          {CONTOH.map((c, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50"
            >
              <p className="text-sm text-gray-800 dark:text-gray-200">
                <span className="mr-2 font-medium text-gray-400">
                  Contoh {idx === 0 ? "A" : "B"}.
                </span>
                &ldquo;{c.tugas}&rdquo;
              </p>
              <div className="mt-3 space-y-2">
                {c.nilai.map((v) => (
                  <div key={v.dimensi} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-gray-500 dark:text-gray-400">
                      {v.dimensi}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {([1, 2, 3, 4, 5] as const).map((nilai) => (
                        <span
                          key={nilai}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
                            nilai === v.nilai
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
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{c.keterangan}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
          Contoh di atas hanya ilustrasi — nilailah tiap tugas sesuai keadaan Anda sendiri.
        </p>
      </div>
    </PetunjukModal>
  );
}
