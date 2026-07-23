import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { STATUS_LABEL } from "@/lib/format/ti-status";
import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import type { TiSesiRead } from "@/lib/api/schema";

export const metadata = { title: "Analisis Jabatan — Task Inventory" };

async function fetchSesi(accessToken: string | undefined, offset: number) {
  const client = withServerAuth(accessToken);
  const res = await client.GET("/api/v1/task-inventory/sesi", {
    params: { query: { limit: UKURAN_HALAMAN, offset } },
  });
  if (!res.data) throw apiErrorDari(res);
  return { items: (res.data.items ?? []) as TiSesiRead[], total: res.data.total };
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TaskInventoryPage({ searchParams }: Props) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const sp = await searchParams;
  const offset = offsetHalaman(sp, "hlm");
  const { items: sesi, total } = await fetchSesi(session?.accessToken, offset);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-heading">Analisis Jabatan — Task Inventory</h1>
          <p className="page-subtext">
            Inventori tugas (CalHR 5-komponen) — alur 3 tahap: seleksi, review koordinator,
            detailing.
          </p>
        </div>
        <Link
          href="/task-inventory/buat"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Mulai Analisis Jabatan
        </Link>
      </div>

      {total === 0 ? (
        <div className="empty-state">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Belum ada Analisis Jabatan Task Inventory. Mulai analisis pertama untuk memulai.
          </p>
          <Link
            href="/task-inventory/buat"
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Mulai Analisis Jabatan
          </Link>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Jabatan
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Cabang
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Task Terpilih
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {sesi.map((s) => {
                  const st = STATUS_LABEL[s.status] ?? {
                    label: s.status,
                    cls: "bg-gray-100 text-gray-500",
                  };
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/task-inventory/${s.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {s.jabatan_nama ?? s.jabatan_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{s.cabang ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-500">
                        {s.jumlah_task_terpilih ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            total={total}
            offset={offset}
            pageSize={UKURAN_HALAMAN}
            paramKey="hlm"
            basePath="/task-inventory"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
