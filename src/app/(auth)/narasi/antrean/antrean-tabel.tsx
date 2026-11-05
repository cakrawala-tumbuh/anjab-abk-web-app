import Link from "next/link";
import type { AntreanItemRead } from "@/lib/api/schema";
import { labelStatusAntrean, teksLabelDokumenter } from "@/lib/narasi-antrean";

/** Judul kolom tabel antrean (tanpa kolom kotak centang: tidak ada aksi massal). */
export const KOLOM_ANTREAN = [
  "Status",
  "Jenis",
  "Instrumen",
  "Isian",
  "Peran",
  "Periode",
  "Asal revisi",
  "Label dokumenter",
  "Sumber",
  "Kontradiksi",
  "Diperbarui",
] as const;

/**
 * Tabel antrean reviewer (Server Component). Baris disajikan persis sesuai urutan respons.
 * Draf AI dan kontradiksi diberi tanda; kode lingkup tampil apa adanya. Tiap baris menaut ke
 * layar tinjauan kasus. Tanpa kotak centang baris dan tanpa aksi massal.
 *
 * @param props.items - Baris antrean satu halaman.
 */
export function AntreanTabel({ items }: { items: AntreanItemRead[] }) {
  return (
    <div className="table-container">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {KOLOM_ANTREAN.map((h) => (
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
          {items.map((a) => (
            <tr key={a.narasi_id} className="align-top">
              <td className="px-4 py-3 whitespace-normal break-words">
                <Link
                  href={`/narasi/antrean/${a.narasi_id}`}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  {labelStatusAntrean(a.status)}
                </Link>
              </td>
              <td className="px-4 py-3 whitespace-normal break-words">{a.narrative_kind}</td>
              <td className="px-4 py-3 whitespace-normal break-words">{a.instrument_id}</td>
              <td className="px-4 py-3 whitespace-normal break-words">{a.field_key}</td>
              <td className="px-4 py-3 whitespace-normal break-words">{a.peran_ref}</td>
              <td className="px-4 py-3">{a.periode}</td>
              <td className="px-4 py-3 whitespace-normal break-words">
                {a.revision_origin}
                {a.revision_origin === "AI_DRAFT" && (
                  <span className="ml-2 rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Draf AI
                  </span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-normal break-words">
                {teksLabelDokumenter(a.label_dokumenter)}
              </td>
              <td className="px-4 py-3 tabular-nums">{a.jumlah_sumber}</td>
              <td className="px-4 py-3 tabular-nums">
                {a.jumlah_kontradiksi > 0 ? (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    <span aria-hidden="true">⚠ </span>
                    {a.jumlah_kontradiksi} kontradiksi
                  </span>
                ) : (
                  a.jumlah_kontradiksi
                )}
              </td>
              <td className="px-4 py-3">{new Date(a.updated_at).toLocaleString("id-ID")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
