import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import type { DetilTugasRead, TugasPokokRead } from "@/lib/api/schema";

export const metadata = { title: "Detil Tugas — Master Data" };

async function fetchData(accessToken: string | undefined, offset: number) {
  const client = withServerAuth(accessToken);
  const [detilRes, pokokRes] = await Promise.all([
    client.GET("/api/v1/task-inventory/detil-tugas", {
      params: { query: { limit: UKURAN_HALAMAN, offset } },
    }),
    client.GET("/api/v1/task-inventory/tugas-pokok", { params: { query: { limit: 500 } } }),
  ]);
  if (!detilRes.data) throw apiErrorDari(detilRes);
  if (!pokokRes.data) throw apiErrorDari(pokokRes);
  return {
    detilTugas: (detilRes.data.items ?? []) as DetilTugasRead[],
    total: detilRes.data.total,
    tugasPokok: (pokokRes.data.items ?? []) as TugasPokokRead[],
  };
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DetilTugasPage({ searchParams }: Props) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const sp = await searchParams;
  const offset = offsetHalaman(sp, "hlm");
  const { detilTugas, total, tugasPokok } = await fetchData(session?.accessToken, offset);
  const pokokMap = Object.fromEntries(tugasPokok.map((tp) => [tp.id, tp.nama]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} detil tugas terdaftar</p>
        <Link
          href="/master-data/detil-tugas/tambah"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah Detil Tugas
        </Link>
      </div>

      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Belum ada detil tugas. Mulai dengan menambah satu.
        </p>
      ) : (
        <>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Nama Detil Tugas
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Tugas Pokok
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {detilTugas.map((dt) => (
                  <tr key={dt.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {dt.nama}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {pokokMap[dt.tugas_pokok_id] ?? dt.tugas_pokok_id}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/master-data/detil-tugas/${dt.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Edit / Hapus
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
            basePath="/master-data/detil-tugas"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
