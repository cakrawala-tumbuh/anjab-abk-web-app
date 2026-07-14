import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { bagianGagal, pendukungList } from "@/lib/api/pendukung";
import { GagalMuatSebagian } from "@/components/gagal-muat";
import type { components } from "@/lib/api/schema";

type TsPenugasanRead = components["schemas"]["TsPenugasanRead"];
type PartisipanRead = components["schemas"]["PartisipanRead"];
type JabatanRead = components["schemas"]["JabatanRead"];

export const metadata = { title: "Time Study" };

async function fetchPageData(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const [penugasanRes, partisipanRes, jabatanRes] = await Promise.all([
    client.GET("/api/v1/time-study/penugasan", { params: { query: { limit: 100 } } }),
    client.GET("/api/v1/partisipan", { params: { query: { limit: 100 } } }),
    client.GET("/api/v1/jabatan", { params: { query: { limit: 100 } } }),
  ]);
  // Data INTI halaman ini — kegagalan tidak boleh tampil sebagai "belum ada penugasan".
  if (!penugasanRes.data) throw apiErrorDari(penugasanRes);

  // Data PENDUKUNG (pelabelan baris tabel saja) — kegagalannya tidak menggagalkan
  // halaman, tapi WAJIB terlihat lewat <GagalMuatSebagian>.
  const partisipan = pendukungList<PartisipanRead>("Daftar partisipan", partisipanRes);
  const jabatan = pendukungList<JabatanRead>("Daftar jabatan", jabatanRes);

  return {
    penugasan: (penugasanRes.data.items ?? []) as TsPenugasanRead[],
    partisipan: partisipan.data,
    jabatan: jabatan.data,
    gagalPendukung: bagianGagal(partisipan, jabatan),
  };
}

export default async function TimeStudyPenugasanPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { penugasan, partisipan, jabatan, gagalPendukung } = await fetchPageData(
    session?.accessToken,
  );
  const jabatanMap = Object.fromEntries(jabatan.map((j) => [j.id, j.nama]));
  const partisipanMap = Object.fromEntries(partisipan.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <GagalMuatSebagian bagian={gagalPendukung} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-heading">Time Study</h1>
          <p className="page-subtext">
            Studi Waktu — tugaskan partisipan untuk mencatat log harian mereka.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/time-study/tugaskan-banyak"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            + Tugaskan Banyak Sekaligus
          </Link>
          <Link
            href="/time-study/buat"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Tugaskan Partisipan
          </Link>
        </div>
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
