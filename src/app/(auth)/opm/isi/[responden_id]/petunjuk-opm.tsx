"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";
import { cn } from "@/lib/utils";

/**
 * Makna nilai 1–5 untuk satu dimensi rating OPM (Importance, Frequency, atau
 * Criticality). Setiap titik skala punya **label singkat + penjelasan dalam
 * kurung**, persis substansi keputusan pemilik proses pada sesi 2026-07-25
 * (lihat Keputusan Desain issue #43) — nilai 2–4 tidak lagi kosong seperti
 * versi sebelumnya, supaya partisipan tidak menumpuk rating di ujung skala
 * karena nilai tengah tampak tanpa arti.
 */
interface MaknaNilai {
  nilai: 1 | 2 | 3 | 4 | 5;
  importance: string;
  frequency: string;
  criticality: string;
}

/** Tabel makna nilai 1–5 ketiga dimensi OPM — lihat Keputusan Desain issue #43. */
const MAKNA_NILAI: MaknaNilai[] = [
  {
    nilai: 1,
    importance: "Tidak penting (tugas bisa dihilangkan tanpa dampak)",
    frequency: "Insidental (beberapa kali dalam karier / sekali dalam beberapa tahun)",
    criticality: "Dampak minimal (kesalahan mudah diperbaiki, proses tetap berjalan)",
  },
  {
    nilai: 2,
    importance:
      "Kurang penting (kontribusi minimal, bisa dikerjakan siapa saja tanpa keahlian khusus)",
    frequency: "Kadang-kadang (beberapa kali per semester atau per tahun ajaran)",
    criticality: "Dampak kecil (perlu perbaikan, tanpa konsekuensi berarti)",
  },
  {
    nilai: 3,
    importance: "Cukup penting (berkontribusi umum, bukan penentu utama keberhasilan jabatan)",
    frequency: "Rutin (setiap minggu atau beberapa kali sebulan)",
    criticality: "Dampak sedang (mengganggu proses, masih bisa dipulihkan)",
  },
  {
    nilai: 4,
    importance: "Penting (berpengaruh langsung pada hasil kerja jabatan)",
    frequency: "Sering (beberapa kali dalam seminggu)",
    criticality: "Dampak besar (merugikan layanan/pihak lain, pemulihan sulit)",
  },
  {
    nilai: 5,
    importance: "Sangat penting (inti jabatan, tanpa ini jabatan kehilangan maknanya)",
    frequency: "Harian (setiap atau hampir setiap hari)",
    criticality:
      "Dampak kritis (tidak dapat dipulihkan — menyangkut keselamatan murid, aspek " +
      "hukum, atau keberlangsungan institusi)",
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
 * (Importance, Frequency, Criticality), menegaskan definisi "gagal" pada
 * Criticality (tugas tidak terlaksana — bukan sekadar pihak lain kecewa),
 * dan memuat dua contoh pengisian kontras — satu bernilai tinggi, satu
 * bernilai rendah — agar rating rendah terbaca sebagai jawaban yang sah,
 * bukan kesalahan pengisian.
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
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
          <strong>Penting untuk Criticality:</strong> yang dimaksud &ldquo;gagal&rdquo; di sini
          adalah <strong>tugas tidak terlaksana</strong> — bukan sekadar hasilnya mengecewakan pihak
          lain. Nilai Criticality berdasarkan seberapa berat akibatnya bila tugas ini benar-benar
          tidak dikerjakan.
        </p>
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
            Sebagian tugas mungkin sudah terisi otomatis dengan nilai standar dan ditandai badge{" "}
            <strong>&ldquo;Nilai bawaan&rdquo;</strong> — periksa dan ubah bila menurut Anda tidak
            sesuai keadaan pekerjaan Anda. Penanda hilang otomatis begitu Anda mengubah salah satu
            nilainya.
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
