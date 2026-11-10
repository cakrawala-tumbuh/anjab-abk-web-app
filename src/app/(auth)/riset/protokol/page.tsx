import Link from "next/link";
import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import { auth } from "@/lib/auth/auth";
import { LABEL_STATUS_PROTOKOL, STATUS_PROTOKOL, bacaFilterStatus } from "@/lib/riset";
import { fetchDaftarProtokol } from "./data";

export const metadata = { title: "Protokol Riset" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const KONTROL =
  "rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800";

/**
 * Halaman daftar protokol riset (Server Component). Filter `status` lewat query string
 * (form GET); kegagalan backend dilempar ke `error.tsx`; "belum ada" dan "tidak cocok
 * filter" dibedakan.
 */
export default async function ProtokolRisetPage({ searchParams }: Props) {
  const session = await auth();
  const sp = await searchParams;
  const status = bacaFilterStatus(sp);
  const offset = offsetHalaman(sp, "hlm");
  const { items, total } = await fetchDaftarProtokol(session?.accessToken, status, offset);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-heading">Protokol Riset</h1>
        <Link
          href="/riset/protokol/tambah"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah protokol
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3" aria-label="Filter protokol">
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Status</span>
          <select name="status" defaultValue={status ?? ""} className={KONTROL}>
            <option value="">Semua status</option>
            {STATUS_PROTOKOL.map((s) => (
              <option key={s} value={s}>
                {LABEL_STATUS_PROTOKOL[s]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={`${KONTROL} hover:bg-gray-100 dark:hover:bg-gray-700`}>
          Terapkan
        </button>
      </form>

      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {status ? (
            <>
              Tidak ada protokol yang cocok dengan filter.{" "}
              <Link href="/riset/protokol" className="text-blue-600 dark:text-blue-400">
                Hapus filter
              </Link>
            </>
          ) : (
            "Belum ada protokol riset."
          )}
        </p>
      ) : (
        <>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {["Kode", "Versi", "Judul", "Status", "Dikunci pada"].map((h) => (
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
                {items.map((p) => (
                  <tr key={p.id} className="align-top">
                    <td className="px-4 py-3 whitespace-normal break-words font-mono text-xs">
                      <Link
                        href={`/riset/protokol/${p.id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        {p.kode}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{p.versi}</td>
                    <td className="px-4 py-3 whitespace-normal break-words">{p.judul}</td>
                    <td className="px-4 py-3">{LABEL_STATUS_PROTOKOL[p.status]}</td>
                    <td className="px-4 py-3">
                      {p.dikunci_pada ? new Date(p.dikunci_pada).toLocaleString("id-ID") : "—"}
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
            basePath="/riset/protokol"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
