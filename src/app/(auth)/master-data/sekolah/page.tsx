import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { SekolahRead, JenjangPendidikanRead } from "@/lib/api/schema";

export const metadata = { title: "Sekolah — Master Data" };

async function fetchData(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const [sekolahRes, jenjangRes] = await Promise.all([
    client.GET("/api/v1/sekolah", { params: { query: { limit: 100 } } }),
    client.GET("/api/v1/jenjang-pendidikan", { params: { query: { limit: 100 } } }),
  ]);
  if (!sekolahRes.data) throw toApiError(null, sekolahRes.response.headers.get("x-request-id"));
  if (!jenjangRes.data) throw toApiError(null, jenjangRes.response.headers.get("x-request-id"));
  return {
    sekolah: sekolahRes.data.items ?? ([] as SekolahRead[]),
    jenjang: jenjangRes.data.items ?? ([] as JenjangPendidikanRead[]),
  };
}

export default async function SekolahPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { sekolah, jenjang } = await fetchData(session?.accessToken);
  const jenjangMap = Object.fromEntries(jenjang.map((j) => [j.id, j.nama]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{sekolah.length} sekolah terdaftar</p>
        <Link
          href="/master-data/sekolah/tambah"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah Sekolah
        </Link>
      </div>

      {sekolah.length === 0 ? (
        <p className="text-sm text-gray-500">Belum ada sekolah. Mulai dengan menambah satu.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nama</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Jenjang</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">NPSN</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Kota</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sekolah.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.nama}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {jenjangMap[s.jenjang_pendidikan_id] ?? s.jenjang_pendidikan_id}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-500">{s.npsn ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{s.kota ?? "—"}</td>
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
      )}
    </div>
  );
}
