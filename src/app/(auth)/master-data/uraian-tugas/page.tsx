import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { UraianTugasRead, TugasPokokRead } from "@/lib/api/schema";

export const metadata = { title: "Uraian Tugas — Master Data" };

async function fetchData(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const [uraianRes, pokokRes] = await Promise.all([
    client.GET("/api/v1/task-inventory/uraian-tugas", { params: { query: { limit: 500 } } }),
    client.GET("/api/v1/task-inventory/tugas-pokok", { params: { query: { limit: 200 } } }),
  ]);
  if (!uraianRes.data) throw apiErrorDari(uraianRes);
  if (!pokokRes.data) throw apiErrorDari(pokokRes);
  return {
    uraianTugas: uraianRes.data.items ?? ([] as UraianTugasRead[]),
    tugasPokok: pokokRes.data.items ?? ([] as TugasPokokRead[]),
  };
}

export default async function UraianTugasPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { uraianTugas, tugasPokok } = await fetchData(session?.accessToken);
  const pokokMap = Object.fromEntries(tugasPokok.map((tp) => [tp.id, tp.nama]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {uraianTugas.length} uraian tugas terdaftar
        </p>
        <Link
          href="/master-data/uraian-tugas/tambah"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah Uraian Tugas
        </Link>
      </div>

      {uraianTugas.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Belum ada uraian tugas. Mulai dengan menambah satu.
        </p>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Kode
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Uraian
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Unit
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Jabatan ID
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Tugas Pokok
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Standar
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {uraianTugas.map((ut) => (
                <tr key={ut.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                    {ut.kode}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-gray-900 dark:text-gray-100 truncate">
                    {ut.uraian}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {ut.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{ut.jabatan_id}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {pokokMap[ut.tugas_pokok_id] ?? ut.tugas_pokok_id}
                  </td>
                  <td className="px-4 py-3">
                    {ut.std_frekuensi_teks !== null && (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Standar
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/master-data/uraian-tugas/${ut.id}`}
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
      )}
    </div>
  );
}
