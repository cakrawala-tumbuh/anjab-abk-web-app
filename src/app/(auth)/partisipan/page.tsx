import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { JabatanRead, PartisipanRead, SekolahRead } from "@/lib/api/schema";

export const metadata = { title: "Partisipan — ANJAB-ABK" };

async function fetchAll(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const [pRes, sRes, jRes] = await Promise.all([
    client.GET("/api/v1/partisipan", { params: { query: { limit: 100 } } }),
    client.GET("/api/v1/sekolah", { params: { query: { limit: 100 } } }),
    client.GET("/api/v1/jabatan", { params: { query: { limit: 100 } } }),
  ]);
  const reqId = pRes.response.headers.get("x-request-id");
  if (!pRes.data) throw toApiError(null, reqId);
  return {
    partisipan: (pRes.data.items ?? []) as PartisipanRead[],
    sekolah: (sRes.data?.items ?? []) as SekolahRead[],
    jabatan: (jRes.data?.items ?? []) as JabatanRead[],
  };
}

export default async function PartisipanPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { partisipan, sekolah, jabatan } = await fetchAll(session?.accessToken);
  const sekolahMap = Object.fromEntries(sekolah.map((s) => [s.id, s.nama]));
  const jabatanMap = Object.fromEntries(jabatan.map((j) => [j.id, j.nama]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-heading">Partisipan</h1>
          <p className="page-subtext">{partisipan.length} partisipan terdaftar</p>
        </div>
        <Link
          href="/partisipan/tambah"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah Partisipan
        </Link>
      </div>

      {partisipan.length === 0 ? (
        <div className="empty-state">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Belum ada partisipan. Mulai dengan menambah satu.
          </p>
          <Link
            href="/partisipan/tambah"
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Tambah Partisipan
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Nama
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Satuan Pendidikan
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Jabatan Utama
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Masa Kerja
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {partisipan.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/partisipan/${p.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {p.nama}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.email}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {sekolahMap[p.sekolah_id] ?? p.sekolah_id}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {jabatanMap[p.jabatan_utama_id] ?? p.jabatan_utama_id}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-500">
                    {p.masa_kerja_tahun}t {p.masa_kerja_bulan > 0 ? `${p.masa_kerja_bulan}b` : ""}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
