import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { JabatanRead, SMEPanelRead } from "@/lib/api/schema";

export const metadata = { title: "SME Panel — Master Data" };

async function fetchAll(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const [panelRes, jabatanRes] = await Promise.all([
    client.GET("/api/v1/sme-panel", { params: { query: { limit: 100 } } }),
    client.GET("/api/v1/jabatan", { params: { query: { limit: 100 } } }),
  ]);
  const requestId = panelRes.response.headers.get("x-request-id");
  if (!panelRes.data) throw toApiError(null, requestId);
  return {
    panels: (panelRes.data.items ?? []) as SMEPanelRead[],
    jabatan: (jabatanRes.data?.items ?? []) as JabatanRead[],
  };
}

export default async function SMEPanelPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { panels, jabatan } = await fetchAll(session?.accessToken);
  const jabatanMap = Object.fromEntries(jabatan.map((j) => [j.id, j]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {panels.length} panel SME terdaftar
        </p>
        <Link
          href="/master-data/sme-panel/tambah"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah SME Panel
        </Link>
      </div>

      {panels.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Belum ada SME panel. Mulai dengan menambah satu.
        </p>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Jabatan
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Jenis
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Anggota
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {panels.map((p) => {
                const jbt = jabatanMap[p.jabatan_id];
                return (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {jbt?.nama ?? p.jabatan_id}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500">
                      {jbt?.jenis ? (
                        <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {jbt.jenis}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {(p.partisipan_ids ?? []).length} orang
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.aktif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.aktif ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/master-data/sme-panel/${p.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Kelola anggota →
                      </Link>
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
