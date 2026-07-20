import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { MataPelajaranRead } from "@/lib/api/schema";

export const metadata = { title: "Mata Pelajaran — Master Data" };

const LABEL_KELOMPOK: Record<string, string> = {
  umum: "Umum",
  peminatan: "Peminatan",
  muatan_lokal: "Muatan Lokal",
  kejuruan: "Kejuruan",
};

const WARNA_KELOMPOK: Record<string, string> = {
  umum: "bg-blue-50 text-blue-700",
  peminatan: "bg-purple-50 text-purple-700",
  muatan_lokal: "bg-orange-50 text-orange-700",
  kejuruan: "bg-teal-50 text-teal-700",
};

async function fetchMataPelajaran(accessToken: string | undefined): Promise<MataPelajaranRead[]> {
  const client = withServerAuth(accessToken);
  const res = await client.GET("/api/v1/mata-pelajaran", {
    params: { query: { limit: 100 } },
  });
  if (!res.data) throw apiErrorDari(res);
  return res.data.items ?? [];
}

export default async function MataPelajaranPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const mataPelajaran = await fetchMataPelajaran(session?.accessToken);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {mataPelajaran.length} mata pelajaran terdaftar
        </p>
        <Link
          href="/master-data/mata-pelajaran/tambah"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah Mata Pelajaran
        </Link>
      </div>

      {mataPelajaran.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Belum ada mata pelajaran. Mulai dengan menambah satu.
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
                  Nama
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Kelompok
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
              {mataPelajaran.map((mp) => (
                <tr key={mp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono text-gray-700">{mp.kode}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{mp.nama}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        WARNA_KELOMPOK[mp.kelompok] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {LABEL_KELOMPOK[mp.kelompok] ?? mp.kelompok}
                    </span>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-gray-500 truncate">
                    {mp.deskripsi ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        mp.aktif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {mp.aktif ? "Aktif" : "Nonaktif"}
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
