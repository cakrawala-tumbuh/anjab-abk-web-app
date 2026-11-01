import type { SebaranK } from "@/lib/api/schema";

/** Kolom sebaran: nilai skala + `kosong` (tidak diisi). */
export const KOLOM_SEBARAN = ["Tinggi", "Sedang", "Rendah", "Belum tahu", "kosong"] as const;

/** Properti {@link TabelSebaran}. */
export interface TabelSebaranProps {
  sebaran: SebaranK;
}

/**
 * Tabel sebaran K1–K4 × jawaban (hitungan) dari konfirmasi sekolah.
 *
 * Sengaja tanpa skor/rata-rata: hanya hitungan per kategori jawaban.
 *
 * @param props - Lihat {@link TabelSebaranProps}.
 */
export function TabelSebaran({ sebaran }: TabelSebaranProps) {
  const baris = [
    ["K1", sebaran.k1],
    ["K2", sebaran.k2],
    ["K3", sebaran.k3],
    ["K4", sebaran.k4],
  ] as const;
  return (
    <section aria-label="Sebaran K1–K4" className="space-y-2">
      <h3 className="text-sm font-semibold">Sebaran K1–K4</h3>
      <p className="text-xs text-gray-500">Bahan dari konfirmasi sekolah — bukan rata-rata</p>
      <p className="text-xs text-gray-500">Jumlah konfirmasi: {sebaran.jumlah_konfirmasi}</p>
      <div className="table-container">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Dimensi</th>
              {KOLOM_SEBARAN.map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {baris.map(([nama, hitung]) => (
              <tr key={nama}>
                <td className="px-3 py-2 font-medium">{nama}</td>
                {KOLOM_SEBARAN.map((h) => (
                  <td key={h} className="px-3 py-2">
                    {hitung[h] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
