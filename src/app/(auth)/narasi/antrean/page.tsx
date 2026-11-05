import Link from "next/link";
import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import { auth } from "@/lib/auth/auth";
import { adaFilterAntrean, bacaFilterAntrean } from "@/lib/narasi-antrean";
import { AntreanTabel } from "./antrean-tabel";
import { fetchAntrean } from "./data";
import { FilterAntrean } from "./filter-antrean";

export const metadata = { title: "Antrean Tinjauan Narasi" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Halaman antrean reviewer narasi (Server Component).
 *
 * Filter dan halaman hidup di URL. Kegagalan backend dilempar ke `error.tsx`; "antrean
 * kosong" dan "tidak ada yang cocok filter" dibedakan. Urutan baris milik backend.
 */
export default async function AntreanNarasiPage({ searchParams }: Props) {
  const session = await auth();
  const sp = await searchParams;
  const filter = bacaFilterAntrean(sp);
  const offset = offsetHalaman(sp, "hlm");
  const { items, total } = await fetchAntrean(session?.accessToken, filter, offset);
  const filterAktif = adaFilterAntrean(filter);

  return (
    <div className="space-y-4">
      <h1 className="page-heading">Antrean Tinjauan Narasi</h1>

      <FilterAntrean filter={filter} />

      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filterAktif ? (
            <>
              Tidak ada kasus dalam antrean yang cocok dengan filter.{" "}
              <Link href="/narasi/antrean" className="text-blue-600 dark:text-blue-400">
                Hapus filter
              </Link>
            </>
          ) : (
            "Antrean kosong. Kasus baru masuk antrean setelah punya versi."
          )}
        </p>
      ) : (
        <>
          <AntreanTabel items={items} />
          <Pagination
            total={total}
            offset={offset}
            pageSize={UKURAN_HALAMAN}
            paramKey="hlm"
            basePath="/narasi/antrean"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
