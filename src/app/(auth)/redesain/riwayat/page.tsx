import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { auth } from "@/lib/auth/auth";

export const metadata = { title: "Riwayat Perubahan — Redesain Pekerjaan" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function nilaiTunggal(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

/** Tampilkan snapshot JSON yang bisa dibuka-tutup; `—` bila null. */
function Snapshot({ nilai }: { nilai: Record<string, unknown> | null | undefined }) {
  if (!nilai) return <span className="text-gray-400">—</span>;
  return (
    <details>
      <summary className="cursor-pointer text-blue-600 dark:text-blue-400">Lihat</summary>
      <pre className="mt-1 max-w-xs overflow-x-auto whitespace-pre-wrap break-words rounded bg-gray-50 p-2 text-xs dark:bg-gray-800">
        {JSON.stringify(nilai, null, 2)}
      </pre>
    </details>
  );
}

/**
 * Halaman Riwayat Perubahan redesain (read-only, Server Component).
 *
 * Membaca `GET /api/v1/redesain/riwayat` dengan filter `entitas`/`entitas_id` dari query
 * string dan paginasi `hlm`. Kegagalan backend (403/500) DILEMPAR ke `error.tsx` —
 * tidak pernah menjadi tabel kosong. Pelaku tampil sebagai kode orang; `—` untuk seed/sistem.
 */
export default async function RiwayatPage({ searchParams }: Props) {
  const session = await auth();
  const sp = await searchParams;
  const entitas = nilaiTunggal(sp.entitas);
  const entitasId = nilaiTunggal(sp.entitas_id);
  const offset = offsetHalaman(sp, "hlm");

  const client = withServerAuth(session?.accessToken);
  const res = await client.GET("/api/v1/redesain/riwayat", {
    params: {
      query: {
        entitas: entitas || undefined,
        entitas_id: entitasId || undefined,
        limit: UKURAN_HALAMAN,
        offset,
      },
    },
  });
  if (!res.data) throw apiErrorDari(res);
  const { items, total } = res.data;
  const adaFilter = entitas !== "" || entitasId !== "";

  return (
    <div className="space-y-4">
      <h1 className="page-heading">Riwayat Perubahan</h1>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Entitas</span>
          <input
            name="entitas"
            defaultValue={entitas}
            className="rounded-md border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
          />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">ID entitas</span>
          <input
            name="entitas_id"
            defaultValue={entitasId}
            className="rounded-md border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Terapkan
        </button>
      </form>

      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {adaFilter
            ? "Tidak ada riwayat yang cocok dengan filter."
            : "Belum ada riwayat perubahan."}
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} catatan</p>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {["Waktu", "Entitas", "ID Entitas", "Aksi", "Pelaku", "Sebelum", "Sesudah"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                      {r.waktu}
                    </td>
                    <td className="px-4 py-3">{r.entitas}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.entitas_id}</td>
                    <td className="px-4 py-3">{r.aksi}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.pelaku_kode_orang ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Snapshot nilai={r.nilai_sebelum} />
                    </td>
                    <td className="px-4 py-3">
                      <Snapshot nilai={r.nilai_sesudah} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            total={total}
            offset={offset}
            pageSize={UKURAN_HALAMAN}
            paramKey="hlm"
            basePath="/redesain/riwayat"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
