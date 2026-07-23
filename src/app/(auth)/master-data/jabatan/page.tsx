import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import type { JabatanRead } from "@/lib/api/schema";

export const metadata = { title: "Jabatan — Master Data" };

const LABEL_JENIS: Record<string, string> = {
  struktural: "Struktural",
  fungsional: "Fungsional",
  teknisi: "Teknisi",
};

async function fetchJabatan(accessToken: string | undefined, offset: number) {
  const client = withServerAuth(accessToken);
  const res = await client.GET("/api/v1/jabatan", {
    params: { query: { limit: UKURAN_HALAMAN, offset } },
  });
  if (!res.data) throw apiErrorDari(res);
  return { items: (res.data.items ?? []) as JabatanRead[], total: res.data.total };
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function JabatanPage({ searchParams }: Props) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const sp = await searchParams;
  const offset = offsetHalaman(sp, "hlm");
  const { items: jabatan, total } = await fetchJabatan(session?.accessToken, offset);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} jabatan terdaftar</p>
        <Link
          href="/master-data/jabatan/tambah"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah Jabatan
        </Link>
      </div>

      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Belum ada jabatan. Mulai dengan menambah satu.
        </p>
      ) : (
        <>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Kode
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Jenis
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Deskripsi
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {jabatan.map((j) => (
                  <tr key={j.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-mono text-gray-700">{j.kode}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{j.nama}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {LABEL_JENIS[j.jenis] ?? j.jenis}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-gray-500 truncate">
                      {j.deskripsi ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          j.aktif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {j.aktif ? "Aktif" : "Nonaktif"}
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
            basePath="/master-data/jabatan"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
