import Link from "next/link";
import { Pagination, UKURAN_HALAMAN } from "@/components/pagination";
import type { AiRunRead, StatusQaAi } from "@/lib/api/schema";

/** Nilai enum `StatusQaAi` untuk dropdown filter (cermin enum backend). */
export const STATUS_QA: ReadonlyArray<StatusQaAi> = [
  "MENUNGGU",
  "LOLOS",
  "KARANTINA",
  "EVIDENCE_GAP",
  "DIBLOKIR",
  "GAGAL",
];

/** Properti {@link RunTabel}. */
export interface RunTabelProps {
  items: ReadonlyArray<AiRunRead>;
  total: number;
  offset: number;
  /** Filter aktif dari URL. */
  fungsi: string;
  statusQa: string;
  /** `searchParams` mentah untuk tautan paginasi. */
  searchParams: Record<string, string | string[] | undefined>;
}

/**
 * Tabel register run AI beserta filter `fungsi` dan `status_qa` yang digerakkan URL
 * (form GET, tanpa state klien). Hanya field `AiRunRead` yang dirender; tidak ada
 * `masukan`/`keluaran`. Membedakan kosong sah dan kosong karena filter.
 *
 * @param props - Lihat {@link RunTabelProps}.
 */
export function RunTabel({ items, total, offset, fungsi, statusQa, searchParams }: RunTabelProps) {
  const adaFilter = fungsi !== "" || statusQa !== "";
  return (
    <div className="space-y-4">
      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Fungsi</span>
          <input
            name="fungsi"
            defaultValue={fungsi}
            className="rounded-md border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
          />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Status QA</span>
          <select
            name="status_qa"
            defaultValue={statusQa}
            className="rounded-md border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="">Semua</option>
            {STATUS_QA.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Terapkan
        </button>
      </form>

      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {adaFilter ? "Tidak ada run yang cocok dengan filter." : "Belum ada run AI."}
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} run</p>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {["Dibuat", "Fungsi", "Status QA", "Model", "Token masuk/keluar", "Run"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3">{r.created_at}</td>
                    <td className="px-4 py-3">{r.fungsi}</td>
                    <td className="px-4 py-3">{r.status_qa}</td>
                    <td className="px-4 py-3">{r.model_dilayani ?? r.model_diminta}</td>
                    <td className="px-4 py-3">
                      {r.input_tokens ?? "—"} / {r.output_tokens ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/sistem/ai/run/${r.id}`}
                        className="font-mono text-xs text-blue-600 underline dark:text-blue-400"
                      >
                        {r.id.slice(0, 8)}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            total={total}
            offset={offset}
            pageSize={UKURAN_HALAMAN}
            paramKey="hlm"
            basePath="/sistem/ai"
            searchParams={searchParams}
          />
        </>
      )}
    </div>
  );
}
