import Link from "next/link";
import type { NarasiSumberRingkas } from "@/lib/api/schema";
import { LABEL_JENIS } from "@/lib/narasi-sumber";

/** Judul kolom tabel daftar sumber (sengaja tanpa kolom `teks`). */
export const KOLOM_SUMBER = ["Judul", "Jenis", "Versi", "Periode", "Izin AI", "Dibuat"] as const;

/**
 * Tabel daftar sumber narasi (Server Component). Hanya kolom ringkas; `teks` tidak ada di
 * item daftar dan tidak pernah dirender di sini.
 *
 * @param props.items - Item ringkas satu halaman.
 */
export function SumberTabel({ items }: { items: NarasiSumberRingkas[] }) {
  return (
    <div className="table-container">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {KOLOM_SUMBER.map((h) => (
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
          {items.map((s) => (
            <tr key={s.id} className="align-top">
              <td className="px-4 py-3 whitespace-normal break-words">
                <Link
                  href={`/narasi/sumber/${s.id}`}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  {s.judul}
                </Link>
                {s.menggantikan_id && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(revisi)</span>
                )}
              </td>
              <td className="px-4 py-3">{LABEL_JENIS[s.jenis]}</td>
              <td className="px-4 py-3">{s.versi}</td>
              <td className="px-4 py-3">{s.periode}</td>
              <td className="px-4 py-3">{s.izin_ai ? "Ya" : "Tidak"}</td>
              <td className="px-4 py-3">{new Date(s.created_at).toLocaleString("id-ID")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
