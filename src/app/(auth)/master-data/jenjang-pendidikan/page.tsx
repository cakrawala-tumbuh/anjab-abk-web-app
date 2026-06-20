import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { JenjangPendidikanRead } from "@/lib/api/schema";

export const metadata = { title: "Jenjang Pendidikan — Master Data" };

async function fetchJenjang(accessToken: string | undefined): Promise<JenjangPendidikanRead[]> {
  const client = withServerAuth(accessToken);
  const { data, response } = await client.GET("/api/v1/jenjang-pendidikan", {
    params: { query: { limit: 100 } },
  });
  const requestId = response.headers.get("x-request-id");
  if (!data) throw toApiError(null, requestId);
  return data.items ?? [];
}

export default async function JenjangPendidikanPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const jenjang = await fetchJenjang(session?.accessToken);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{jenjang.length} jenjang terdaftar</p>
        <Link
          href="/master-data/jenjang-pendidikan/tambah"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah Jenjang
        </Link>
      </div>

      {jenjang.length === 0 ? (
        <p className="text-sm text-gray-500">
          Belum ada jenjang pendidikan. Mulai dengan menambah satu.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Kode</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nama</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Urutan</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jenjang.map((j) => (
                <tr key={j.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-700">{j.kode}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{j.nama}</td>
                  <td className="px-4 py-3 text-gray-500">{j.urutan}</td>
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
      )}
    </div>
  );
}
