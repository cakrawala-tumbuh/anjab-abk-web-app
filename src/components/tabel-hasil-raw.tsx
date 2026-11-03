import type { HasilRawItemRead } from "@/lib/api/schema";

const SKALA = ["1", "2", "3", "4", "5"] as const;

/** Format angka desimal raw; `null` ditampilkan "—" (bukan 0). */
function fmt(n: number | null | undefined): string {
  return n == null ? "—" : n.toFixed(2);
}

/**
 * Kelompokkan item per `kelompok_kode`, mempertahankan urutan kemunculan pertama
 * dan urutan item di dalam kelompok seperti yang diberikan backend.
 *
 * @param items - Item hasil raw dari backend.
 * @returns Pasangan `[kelompok_kode, items]` berurutan.
 */
export function kelompokkanItem(items: HasilRawItemRead[]): [string, HasilRawItemRead[]][] {
  const peta = new Map<string, HasilRawItemRead[]>();
  for (const it of items) {
    const daftar = peta.get(it.kelompok_kode);
    if (daftar) daftar.push(it);
    else peta.set(it.kelompok_kode, [it]);
  }
  return [...peta.entries()];
}

/**
 * Tabel hasil mentah per item untuk WCP dan DCS (mode `RAW_ONLY`).
 *
 * Satu tabel per `kelompok_kode`: kolom item, n, n kosong, frekuensi jawaban 1–5,
 * mean raw, dan SD raw. Nilai `null` pada mean/SD tampil "—".
 *
 * @param props.items - Agregat raw per item dari `GET /{wcp,dcs}/hasil`.
 */
export function TabelHasilRaw({ items }: { items: HasilRawItemRead[] }) {
  const grup = kelompokkanItem(items);
  if (grup.length === 0) {
    return <p className="text-sm text-gray-500">Belum ada data jawaban.</p>;
  }
  return (
    <div className="space-y-6">
      {grup.map(([kode, daftar]) => (
        <section key={kode} aria-label={`Kelompok ${kode}`}>
          <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-50">{kode}</h2>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="text-gray-600 dark:text-gray-400">
                  <th className="px-4 py-3 text-left font-medium">Item</th>
                  <th className="px-4 py-3 text-right font-medium">N</th>
                  <th className="px-4 py-3 text-right font-medium">N kosong</th>
                  {SKALA.map((s) => (
                    <th key={s} className="px-3 py-3 text-right font-medium">
                      {s}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-medium">Mean</th>
                  <th className="px-4 py-3 text-right font-medium">SD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {daftar.map((it) => (
                  <tr key={it.item_id}>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{it.item_id}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{it.n}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{it.n_kosong}</td>
                    {SKALA.map((s) => (
                      <td key={s} className="px-3 py-3 text-right text-gray-500">
                        {it.frekuensi[s] ?? 0}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                      {fmt(it.mean_raw)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{fmt(it.sd_raw)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
