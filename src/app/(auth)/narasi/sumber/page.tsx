import Link from "next/link";
import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import { auth } from "@/lib/auth/auth";
import { JENIS_SUMBER, LABEL_JENIS, adaFilterSumber, bacaFilterSumber } from "@/lib/narasi-sumber";
import { fetchDaftarSumber } from "./data";
import { SumberTabel } from "./sumber-tabel";

export const metadata = { title: "Sumber Narasi" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const KONTROL =
  "rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800";

/**
 * Halaman daftar Sumber Narasi (Server Component).
 *
 * Filter `jenis`/`periode` lewat query string (form GET). Kegagalan backend dilempar ke
 * `error.tsx`; "belum ada sumber" dan "tidak ada yang cocok filter" dibedakan.
 */
export default async function SumberNarasiPage({ searchParams }: Props) {
  const session = await auth();
  const sp = await searchParams;
  const filter = bacaFilterSumber(sp);
  const offset = offsetHalaman(sp, "hlm");
  const { items, total } = await fetchDaftarSumber(session?.accessToken, filter, offset);
  const filterAktif = adaFilterSumber(filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-heading">Sumber Narasi</h1>
        <Link
          href="/narasi/sumber/tambah"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah sumber
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3" aria-label="Filter sumber">
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Jenis</span>
          <select name="jenis" defaultValue={filter.jenis ?? ""} className={KONTROL}>
            <option value="">Semua jenis</option>
            {JENIS_SUMBER.map((j) => (
              <option key={j} value={j}>
                {LABEL_JENIS[j]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Periode</span>
          <input
            name="periode"
            defaultValue={filter.periode ?? ""}
            maxLength={20}
            placeholder="2026/27"
            className={KONTROL}
          />
        </label>
        <button type="submit" className={`${KONTROL} hover:bg-gray-100 dark:hover:bg-gray-700`}>
          Terapkan
        </button>
      </form>

      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filterAktif ? (
            <>
              Tidak ada sumber yang cocok dengan filter.{" "}
              <Link href="/narasi/sumber" className="text-blue-600 dark:text-blue-400">
                Hapus filter
              </Link>
            </>
          ) : (
            "Belum ada sumber narasi."
          )}
        </p>
      ) : (
        <>
          <SumberTabel items={items} />
          <Pagination
            total={total}
            offset={offset}
            pageSize={UKURAN_HALAMAN}
            paramKey="hlm"
            basePath="/narasi/sumber"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
