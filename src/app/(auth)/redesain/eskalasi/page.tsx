import Link from "next/link";
import { BadgeEskalasi } from "@/components/badge-eskalasi";
import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import { auth } from "@/lib/auth/auth";
import { labelKonteks, labelSekolah } from "@/lib/redesain-register";
import { fetchEskalasi } from "./data";

export const metadata = { title: "Eskalasi — Redesain Pekerjaan" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Halaman daftar masalah tereskalasi (Server Component).
 *
 * Memuat masalah yang `eskalasi_pada`-nya terisi (indikasi risiko serius dari konfirmasi
 * sekolah), terbaru dulu, tanpa menunggu penilaian. Hanya penanda layar; tidak ada
 * notifikasi aktif. Kegagalan backend dilempar ke `error.tsx`.
 */
export default async function EskalasiPage({ searchParams }: Props) {
  const session = await auth();
  const sp = await searchParams;
  const offset = offsetHalaman(sp, "hlm");
  const { masalah, total, konteks, sekolah } = await fetchEskalasi(session?.accessToken, offset);
  const petaKonteks = new Map(konteks.map((k) => [k.id, k]));
  const petaSekolah = new Map(sekolah.map((s) => [s.id, s]));

  return (
    <div className="space-y-4">
      <h1 className="page-heading">Eskalasi</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Masalah dengan indikasi risiko serius dari konfirmasi sekolah. Tindak lanjuti tanpa menunggu
        penilaian.
      </p>
      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada masalah tereskalasi.</p>
      ) : (
        <>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {["Kode", "Konteks", "Sekolah", "Eskalasi sejak", ""].map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {masalah.map((m) => (
                  <tr key={m.id} className="align-top">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link
                        href={`/redesain/masalah/${m.id}?bagian=konfirmasi`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        {m.kode}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-normal break-words">
                      {labelKonteks(m.konteks_id, petaKonteks)}
                    </td>
                    <td className="px-4 py-3 whitespace-normal break-words">
                      {labelSekolah(m, petaSekolah)}
                    </td>
                    <td className="px-4 py-3">{m.eskalasi_pada}</td>
                    <td className="px-4 py-3">
                      <BadgeEskalasi eskalasiPada={m.eskalasi_pada} />
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
            basePath="/redesain/eskalasi"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
