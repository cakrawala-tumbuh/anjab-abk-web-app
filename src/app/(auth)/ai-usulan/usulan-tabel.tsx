import Link from "next/link";
import type { AiUsulanRingkas } from "@/lib/api/schema";
import { hrefSasaran, labelFungsi, labelHasilSerap, labelSasaran } from "@/lib/ai-usulan";

/** Judul kolom tabel usulan. */
export const KOLOM_USULAN = [
  "Fungsi",
  "Sasaran",
  "Hasil serap",
  "Putusan terakhir",
  "Diajukan",
] as const;

/**
 * Ringkasan putusan terakhir untuk sel tabel.
 *
 * @param p - `putusan_terakhir` dari backend, atau `null` bila belum diputus.
 * @returns Teks seperti `"REVISE (MAJOR)"`, atau `"Belum diputus"`.
 */
export function teksPutusanTerakhir(p: AiUsulanRingkas["putusan_terakhir"]): string {
  if (!p) return "Belum diputus";
  return p.tingkat_koreksi ? `${p.putusan} (${p.tingkat_koreksi})` : p.putusan;
}

/**
 * Tabel usulan AI (Server Component). Urutan baris milik backend (terbaru dulu).
 *
 * @param props.items - Baris satu halaman.
 */
export function UsulanTabel({ items }: { items: AiUsulanRingkas[] }) {
  return (
    <div className="table-container">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {KOLOM_USULAN.map((h) => (
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
          {items.map((u) => {
            const href = hrefSasaran(u.sasaran_jenis, u.sasaran_id);
            return (
              <tr key={u.id} className="align-top">
                <td className="px-4 py-3 whitespace-normal break-words">
                  <Link
                    href={`/ai-usulan/${u.id}`}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    {labelFungsi(u.fungsi)}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-normal break-words">
                  {labelSasaran(u.sasaran_jenis)}
                  {href ? (
                    <>
                      {" "}
                      <Link href={href} className="text-blue-600 dark:text-blue-400">
                        (buka)
                      </Link>
                    </>
                  ) : null}
                </td>
                <td className="px-4 py-3 whitespace-normal break-words">
                  {labelHasilSerap(u.hasil_serap)}
                </td>
                <td className="px-4 py-3 whitespace-normal break-words">
                  {teksPutusanTerakhir(u.putusan_terakhir)}
                </td>
                <td className="px-4 py-3">{new Date(u.created_at).toLocaleString("id-ID")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
