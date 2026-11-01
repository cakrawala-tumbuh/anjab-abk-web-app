import Link from "next/link";
import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import { auth } from "@/lib/auth/auth";
import { TEKS_BUKAN_TIME_STUDY, formatMenit } from "@/lib/redesain-sesi";
import { fetchRekapOrang } from "../data";

export const metadata = { title: "Rekap Sesi per Orang — Redesain Pekerjaan" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Halaman rekap sesi per orang unik (Server Component).
 *
 * Total menit `null` tampil `—` (bukan `0`). Kegagalan (termasuk 403) dilempar ke `error.tsx`.
 */
export default async function RekapSesiPage({ searchParams }: Props) {
  const session = await auth();
  const sp = await searchParams;
  const offset = offsetHalaman(sp, "hlm");
  const { items, total } = await fetchRekapOrang(session?.accessToken, offset);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-heading">Rekap Sesi per Orang</h1>
        <Link href="/redesain/sesi" className="text-sm text-blue-600 dark:text-blue-400">
          ← Kembali ke daftar sesi
        </Link>
      </div>
      <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
        {TEKS_BUKAN_TIME_STUDY}
      </p>
      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada sesi tercatat.</p>
      ) : (
        <>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {[
                    "Kode orang",
                    "Jumlah sesi",
                    "Total menit rencana",
                    "Total menit disepakati",
                  ].map((h) => (
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
                {items.map((r) => (
                  <tr key={r.kode_orang}>
                    <td className="px-4 py-3 font-mono text-xs">{r.kode_orang}</td>
                    <td className="px-4 py-3">{r.jumlah_sesi}</td>
                    <td className="px-4 py-3">{formatMenit(r.total_menit_rencana)}</td>
                    <td className="px-4 py-3">{formatMenit(r.total_menit_disepakati)}</td>
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
            basePath="/redesain/sesi/rekap"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
