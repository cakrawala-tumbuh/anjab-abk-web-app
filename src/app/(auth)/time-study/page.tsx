import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/schema";

type TsPenugasanRead = components["schemas"]["TsPenugasanRead"];
type PartisipanRead = components["schemas"]["PartisipanRead"];
type JabatanRead = components["schemas"]["JabatanRead"];

export const metadata = { title: "Time Study — ANJAB-ABK" };

async function fetchPageData(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const [penugasanRes, partisipanRes, jabatanRes] = await Promise.all([
    client.GET("/api/v1/time-study/penugasan", { params: { query: { limit: 100 } } }),
    client.GET("/api/v1/partisipan", { params: { query: { limit: 100 } } }),
    client.GET("/api/v1/jabatan", { params: { query: { limit: 100 } } }),
  ]);
  const reqId = penugasanRes.response.headers.get("x-request-id");
  if (!penugasanRes.data) throw toApiError(null, reqId);
  return {
    penugasan: (penugasanRes.data.items ?? []) as TsPenugasanRead[],
    partisipan: (partisipanRes.data?.items ?? []) as PartisipanRead[],
    jabatan: (jabatanRes.data?.items ?? []) as JabatanRead[],
  };
}

export default async function TimeStudyPenugasanPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { penugasan, partisipan, jabatan } = await fetchPageData(session?.accessToken);
  const jabatanMap = Object.fromEntries(jabatan.map((j) => [j.id, j.nama]));
  const partisipanMap = Object.fromEntries(partisipan.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-heading">Time Study</h1>
          <p className="page-subtext">
            Studi Waktu — tugaskan partisipan untuk mencatat log harian mereka.
          </p>
        </div>
        <Link
          href="/time-study/buat"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tugaskan Partisipan
        </Link>
      </div>

      {penugasan.length === 0 ? (
        <div className="empty-state">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Belum ada penugasan Time Study. Tugaskan partisipan pertama untuk mulai.
          </p>
          <Link
            href="/time-study/buat"
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Tugaskan Partisipan
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Partisipan
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Jabatan
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Ditugaskan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {penugasan.map((p) => {
                const par = partisipanMap[p.partisipan_id];
                return (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/time-study/${p.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {par?.nama ?? p.partisipan_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {par ? (jabatanMap[par.jabatan_utama_id] ?? par.jabatan_utama_id) : "?"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.aktif ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.aktif ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(p.created_at).toLocaleDateString("id-ID")}
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
