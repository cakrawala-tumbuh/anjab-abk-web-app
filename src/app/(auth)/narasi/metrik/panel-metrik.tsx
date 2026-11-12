import type { MetrikNarasiRead } from "@/lib/api/schema";
import { formatMenit, formatPersen } from "@/lib/narasi-metrik";

interface Kartu {
  judul: string;
  nilai: string;
  definisi: string;
}

/**
 * Susun kartu statistik dari metrik backend, beserta definisi operasionalnya.
 *
 * @param m - Metrik agregat.
 */
export function susunKartu(m: MetrikNarasiRead): Kartu[] {
  return [
    {
      judul: "Jumlah keputusan Tim",
      nilai: String(m.jumlah_keputusan),
      definisi: "Event TEAM_APPROVE, TEAM_REVISE, TEAM_REJECT, dan NEED_SOURCE dalam rentang.",
    },
    {
      judul: "Tingkat koreksi",
      nilai: formatPersen(m.correction_rate),
      definisi: "TEAM_REVISE dibagi jumlah keputusan.",
    },
    {
      judul: "Tingkat penolakan",
      nilai: formatPersen(m.rejection_rate),
      definisi: "TEAM_REJECT dibagi jumlah keputusan.",
    },
    {
      judul: "Cakupan sumber",
      nilai: formatPersen(m.source_coverage),
      definisi:
        "Proporsi versi narasi yang dibuat dalam rentang dan bertautan minimal satu sumber.",
    },
    {
      judul: "Menit aktif total",
      nilai: formatMenit(m.menit_aktif_total),
      definisi: "Jumlah detak menit aktif: menit saat tab terlihat dan ada interaksi.",
    },
    {
      judul: "Median menit aktif per kasus",
      nilai: formatMenit(m.menit_aktif_median_per_kasus),
      definisi: "Median menit aktif atas kasus yang punya menit aktif lebih dari nol.",
    },
  ];
}

/**
 * Panel metrik alur narasi (Server Component): kartu statistik dan kotak informasi metrik
 * yang ditahan. Metrik tanpa penyebut tampil "Belum ada data", bukan 0%.
 *
 * @param props.metrik - Metrik agregat dari backend.
 */
export function PanelMetrik({ metrik }: { metrik: MetrikNarasiRead }) {
  const ditahan = metrik.metrik_ditahan ?? [];
  return (
    <div className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {susunKartu(metrik).map((k) => (
          <div key={k.judul} className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
            <dt className="text-sm text-gray-600 dark:text-gray-400">{k.judul}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{k.nilai}</dd>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{k.definisi}</p>
          </div>
        ))}
      </dl>
      <aside
        role="note"
        aria-label="Metrik yang ditahan"
        className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-900/30"
      >
        <p className="font-medium">Metrik yang belum dihitung</p>
        {ditahan.length > 0 ? (
          <ul className="mt-1 list-disc pl-5">
            {ditahan.map((t) => (
              <li key={t.kode}>
                <code>{t.kode}</code>: {t.alasan}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1">Tidak ada metrik yang ditahan.</p>
        )}
        <p className="mt-2">
          Angka di halaman ini tidak boleh dipakai sebagai klaim penghematan waktu. Waktu diukur
          sebagai menit aktif, bukan selisih waktu buka sampai kirim.
        </p>
      </aside>
    </div>
  );
}
