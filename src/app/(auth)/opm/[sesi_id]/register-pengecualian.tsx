import type { OpmPengecualianRead } from "@/lib/api/schema";
import { labelAlasanPengecualian } from "@/lib/opm-pengecualian";

/**
 * Tabel register pengecualian TI–OPM sebuah sesi (Server Component).
 *
 * @param props.items - Baris register; kosong yang sah → state "Tidak ada pengecualian".
 * @returns Tabel register atau state kosong.
 */
export function RegisterPengecualian({ items }: { items: OpmPengecualianRead[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada pengecualian.</p>
      </div>
    );
  }
  return (
    <div className="table-container">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {["Kode Task", "Alasan", "Keterangan", "Status", "Dicatat"].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {items.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 font-mono text-gray-500">{p.task_kode}</td>
              <td className="px-4 py-3 text-gray-900">{labelAlasanPengecualian(p.alasan)}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.keterangan ?? "—"}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.status}</td>
              <td className="px-4 py-3 text-xs text-gray-400">
                {new Date(p.created_at).toLocaleDateString("id-ID")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
