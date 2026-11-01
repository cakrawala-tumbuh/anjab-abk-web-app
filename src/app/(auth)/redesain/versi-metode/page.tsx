import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { auth } from "@/lib/auth/auth";
import { BarisVersiMetode } from "./baris-versi-metode";
import { FormVersiMetode } from "./form-versi-metode";

export const metadata = { title: "Versi Metode — Redesain Pekerjaan" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const KOLOM = [
  "Versi",
  "Tanggal",
  "Bagian",
  "Apa diperbarui",
  "Alasan / risiko",
  "Status & hasil uji",
  "Pemeriksa / pemutus",
  "Aksi",
] as const;

/**
 * Halaman log versi metode redesain (Server Component).
 *
 * Membaca `GET /api/v1/redesain/versi-metode` dengan paginasi `hlm`. Kegagalan backend
 * (mis. 403) DILEMPAR ke `error.tsx` — tidak pernah tabel kosong. Tersedia tambah dan ubah;
 * tidak ada hapus.
 */
export default async function VersiMetodePage({ searchParams }: Props) {
  const session = await auth();
  const sp = await searchParams;
  const offset = offsetHalaman(sp, "hlm");
  const res = await withServerAuth(session?.accessToken).GET("/api/v1/redesain/versi-metode", {
    params: { query: { limit: UKURAN_HALAMAN, offset } },
  });
  if (!res.data) throw apiErrorDari(res);
  const { items, total } = res.data;

  return (
    <div className="space-y-4">
      <h1 className="page-heading">Versi Metode</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Log versi metode redesain (sheet PERUBAHAN pada register XLSX).
      </p>
      <FormVersiMetode accessToken={session?.accessToken} />
      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada catatan versi metode.</p>
      ) : (
        <>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {KOLOM.map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.map((v) => (
                  <BarisVersiMetode key={v.id} item={v} accessToken={session?.accessToken} />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            total={total}
            offset={offset}
            pageSize={UKURAN_HALAMAN}
            paramKey="hlm"
            basePath="/redesain/versi-metode"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
