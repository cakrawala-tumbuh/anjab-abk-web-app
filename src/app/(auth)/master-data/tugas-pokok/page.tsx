import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import type { TugasPokokRead } from "@/lib/api/schema";

export const metadata = { title: "Tugas Pokok — Master Data" };

async function fetchTugasPokok(accessToken: string | undefined, offset: number) {
  const client = withServerAuth(accessToken);
  const res = await client.GET("/api/v1/task-inventory/tugas-pokok", {
    params: { query: { limit: UKURAN_HALAMAN, offset } },
  });
  if (!res.data) throw apiErrorDari(res);
  return { items: (res.data.items ?? []) as TugasPokokRead[], total: res.data.total };
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TugasPokokPage({ searchParams }: Props) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const sp = await searchParams;
  const offset = offsetHalaman(sp, "hlm");
  const { items: tugasPokok, total } = await fetchTugasPokok(session?.accessToken, offset);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} tugas pokok terdaftar</p>
        <Link
          href="/master-data/tugas-pokok/tambah"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah Tugas Pokok
        </Link>
      </div>

      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Belum ada tugas pokok. Mulai dengan menambah satu.
        </p>
      ) : (
        <>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Nama Tugas Pokok
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {tugasPokok.map((tp) => (
                  <tr key={tp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {tp.nama}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{tp.id}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/master-data/tugas-pokok/${tp.id}`}
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
            basePath="/master-data/tugas-pokok"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
