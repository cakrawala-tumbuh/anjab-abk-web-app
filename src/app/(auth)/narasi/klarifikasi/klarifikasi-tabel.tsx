import Link from "next/link";
import type { KlarifikasiRead } from "@/lib/api/schema";
import { KETERANGAN_DISPOSISI, KETERANGAN_PERSETUJUAN, labelDari } from "@/lib/narasi-klarifikasi";

/** Judul kolom tabel indeks klarifikasi. */
export const KOLOM_KLARIFIKASI = [
  "Pertanyaan",
  "Klaim",
  "Peran penerima",
  "Persetujuan",
  "Disposisi",
  "Dibuat",
] as const;

/**
 * Tabel indeks klarifikasi (Server Component). Pertanyaan menaut ke detail; persetujuan dan
 * disposisi tampil dengan keterangan Indonesia.
 *
 * @param props.items - Klarifikasi satu halaman.
 */
export function KlarifikasiTabel({ items }: { items: KlarifikasiRead[] }) {
  return (
    <div className="table-container">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {KOLOM_KLARIFIKASI.map((h) => (
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
                  href={`/narasi/klarifikasi/${k.id}`}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  {k.question_text}
                </Link>
              </td>
              <td className="px-4 py-3 whitespace-normal break-words">{k.claim_id}</td>
              <td className="px-4 py-3 whitespace-normal break-words">{k.recipient_role}</td>
              <td className="px-4 py-3">
                {labelDari(KETERANGAN_PERSETUJUAN, k.reviewer_approval)}
              </td>
              <td className="px-4 py-3">{labelDari(KETERANGAN_DISPOSISI, k.disposition)}</td>
              <td className="px-4 py-3">{new Date(k.created_at).toLocaleString("id-ID")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
