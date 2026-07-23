import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import type { SekolahRead, JenjangPendidikanRead } from "@/lib/api/schema";

export const metadata = { title: "Sekolah — Master Data" };

async function fetchData(accessToken: string | undefined, offset: number) {
  const client = withServerAuth(accessToken);
  const [sekolahRes, jenjangRes] = await Promise.all([
    client.GET("/api/v1/sekolah", { params: { query: { limit: UKURAN_HALAMAN, offset } } }),
    client.GET("/api/v1/jenjang-pendidikan", { params: { query: { limit: 500 } } }),
  ]);
  if (!sekolahRes.data) throw apiErrorDari(sekolahRes);
  if (!jenjangRes.data) throw apiErrorDari(jenjangRes);
  return {
    sekolah: (sekolahRes.data.items ?? []) as SekolahRead[],
    total: sekolahRes.data.total,
    jenjang: (jenjangRes.data.items ?? []) as JenjangPendidikanRead[],
  };
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SekolahPage({ searchParams }: Props) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const sp = await searchParams;
  const offset = offsetHalaman(sp, "hlm");
  const { sekolah, total, jenjang } = await fetchData(session?.accessToken, offset);
  const jenjangMap = Object.fromEntries(jenjang.map((j) => [j.id, j.nama]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} sekolah terdaftar</p>
        <Link
          href="/master-data/sekolah/tambah"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah Sekolah
        </Link>
      </div>

      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Belum ada sekolah. Mulai dengan menambah satu.
        </p>
      ) : (
        <>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Jenjang
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    NPSN
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Kota
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {sekolah.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.nama}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {jenjangMap[s.jenjang_pendidikan_id] ?? s.jenjang_pendidikan_id}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-500">{s.npsn ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500">{s.kota ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.aktif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {s.aktif ? "Aktif" : "Nonaktif"}
                      </span>
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
            basePath="/master-data/sekolah"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
