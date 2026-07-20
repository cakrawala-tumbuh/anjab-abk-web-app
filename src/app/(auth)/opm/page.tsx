import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { OpmSesiRead } from "@/lib/api/schema";

export const metadata = { title: "Analisis Jabatan — OPM" };

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
  OPEN: { label: "Terbuka", cls: "bg-blue-100 text-blue-700" },
  CLOSED: { label: "Tertutup", cls: "bg-yellow-100 text-yellow-700" },
  ANALYZED: { label: "Teranalisis", cls: "bg-green-100 text-green-700" },
};

async function fetchSesi(accessToken: string | undefined): Promise<OpmSesiRead[]> {
  const client = withServerAuth(accessToken);
  const res = await client.GET("/api/v1/opm/sesi", {
    params: { query: { limit: 100 } },
  });
  if (!res.data) throw apiErrorDari(res);
  return (res.data.items ?? []) as OpmSesiRead[];
}

export default async function OpmSesiPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const sesi = await fetchSesi(session?.accessToken);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-heading">Analisis Jabatan — OPM</h1>
          <p className="page-subtext">
            Rating Tugas (Importance/Frequency/Criticality) — kelola analisis penilaian per jabatan.
          </p>
        </div>
        <Link
          href="/opm/buat"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Mulai Analisis Jabatan
        </Link>
      </div>

      {sesi.length === 0 ? (
        <div className="empty-state">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Belum ada Analisis Jabatan OPM. Mulai analisis pertama untuk memulai.
          </p>
          <Link
            href="/opm/buat"
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Mulai Analisis Jabatan
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Keterangan
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Jabatan
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Jumlah Task
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Dibuat
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
                        href={`/opm/${s.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {s.catatan ?? s.periode}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{s.jabatan_nama ?? s.jabatan_id}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500">{s.jumlah_task}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(s.created_at).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
