"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";
import { cn } from "@/lib/utils";

interface ContohIsi {
  pernyataan: string;
  nilaiTersorot: 1 | 2 | 3 | 4 | 5;
  keterangan: string;
}

const CONTOH: ContohIsi[] = [
  {
    pernyataan: "Rekan kerja saya saling mendukung dan bekerja sama dengan baik.",
    nilaiTersorot: 5,
    keterangan: "Bila hal ini sangat sesuai dengan suasana kerja Anda, pilih 5 (Sangat Setuju).",
  },
  {
    pernyataan: "Beban pekerjaan yang saya tanggung terasa berlebihan.",
    nilaiTersorot: 2,
    keterangan:
      "Bila hal ini kurang menggambarkan keadaan Anda, pilih 2 (Tidak Setuju). Pernyataan bernuansa Dimensi Risiko dijawab dengan cara yang sama.",
  },
];

// Selaras SKOR_LABEL di wcp-form.tsx.
const SKALA = [
  {
    nilai: 1,
    label: "Sangat Tidak Setuju",
    keterangan: "sama sekali tidak menggambarkan keadaan Anda",
  },
  { nilai: 2, label: "Tidak Setuju", keterangan: "kurang menggambarkan keadaan Anda" },
  { nilai: 3, label: "Ragu-ragu", keterangan: "di antara setuju dan tidak" },
  { nilai: 4, label: "Setuju", keterangan: "cukup menggambarkan keadaan Anda" },
  { nilai: 5, label: "Sangat Setuju", keterangan: "sangat menggambarkan keadaan Anda" },
] as const;

interface Props {
  defaultOpen: boolean;
}

export function PetunjukWcp({ defaultOpen }: Props) {
  return (
    <PetunjukModal title="Petunjuk Pengisian Kuesioner WCP" defaultOpen={defaultOpen}>
      <p>
        Kuesioner <strong>WCP (Workplace Climate Profile)</strong> memotret persepsi Anda terhadap{" "}
        <strong>iklim atau suasana tempat kerja</strong> pada beberapa dimensi. Sebagian dimensi
        ditandai <strong>&ldquo;Dimensi Risiko&rdquo;</strong> — itu hanya penanda kelompok; cara
        menjawabnya sama. Ini bukan tes; tidak ada jawaban benar atau salah.
      </p>

      <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-950/40">
        <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-200">Petunjuk Umum</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-blue-900/90 dark:text-blue-200/90">
          <li>Baca tiap pernyataan dengan saksama.</li>
          <li>
            Jawab berdasarkan <strong>apa yang benar-benar Anda alami dan rasakan</strong> di tempat
            kerja selama ini — bukan yang ideal/seharusnya.
          </li>
          <li>Tidak ada jawaban benar atau salah; jawablah dengan jujur.</li>
          <li>
            Jawab <strong>spontan</strong> — kesan pertama biasanya paling menggambarkan keadaan
            Anda.
          </li>
          <li>
            Isi <strong>semua pernyataan</strong>; tombol &ldquo;Kirim Jawaban&rdquo; baru aktif
            bila seluruhnya terjawab. Anda bisa menekan &ldquo;Simpan&rdquo; untuk melanjutkan
            nanti.
          </li>
          <li>
            Jawaban <strong>rahasia</strong>, dipakai untuk analisis jabatan/beban kerja — bukan
            menilai kinerja individu.
          </li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">
          Pilihan Jawaban (Skala 1–5)
        </h3>
        <ul className="space-y-1">
          {SKALA.map((s) => (
            <li key={s.nilai}>
              <strong>
                {s.nilai} = {s.label}
              </strong>{" "}
              — {s.keterangan}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Cara Menjawab</h3>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Baca pernyataannya.</li>
          <li>Renungkan seberapa sesuai pernyataan itu dengan keadaan Anda.</li>
          <li>Klik salah satu pilihan dari 1 sampai 5.</li>
          <li>Lanjutkan ke pernyataan berikutnya hingga selesai.</li>
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
                &ldquo;{c.pernyataan}&rdquo;
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {([1, 2, 3, 4, 5] as const).map((nilai) => (
                  <span
                    key={nilai}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs",
                      nilai === c.nilaiTersorot
                        ? "border-blue-500 bg-blue-50 font-medium text-blue-700 dark:border-blue-400 dark:bg-blue-950/60 dark:text-blue-300"
                        : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400",
                    )}
                  >
                    {nilai}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{c.keterangan}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
          Contoh di atas hanya ilustrasi — jawablah tiap pernyataan sesuai keadaan Anda sendiri.
        </p>
      </div>
    </PetunjukModal>
  );
}
