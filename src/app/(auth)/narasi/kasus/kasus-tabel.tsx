import Link from "next/link";
import type { NarasiKasusRead } from "@/lib/api/schema";
import { labelStatus } from "@/lib/narasi-kasus";

/** Judul kolom tabel daftar kasus. */
export const KOLOM_KASUS = ["Instrumen", "Isian", "Peran", "Periode", "Status", "Dibuat"] as const;

/**
 * Tabel daftar kasus narasi (Server Component). Status tampil sebagai enum internal plus
 * keterangan Indonesia.
 *
 * @param props.items - Kasus satu halaman.
 */
export function KasusTabel({ items }: { items: NarasiKasusRead[] }) {
  return (
    <div className="table-container">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {KOLOM_KASUS.map((h) => (
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
          {items.map((k) => (
            <tr key={k.id} className="align-top">
              <td className="px-4 py-3 whitespace-normal break-words">
                <Link
                  href={`/narasi/kasus/${k.id}`}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  {k.instrument_id}
                </Link>
              </td>
              <td className="px-4 py-3 whitespace-normal break-words">{k.field_key}</td>
              <td className="px-4 py-3 whitespace-normal break-words">{k.peran_ref}</td>
              <td className="px-4 py-3">{k.periode}</td>
              <td className="px-4 py-3 whitespace-normal break-words">{labelStatus(k.status)}</td>
              <td className="px-4 py-3">{new Date(k.created_at).toLocaleString("id-ID")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
