import Link from "next/link";
import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import { auth } from "@/lib/auth/auth";
import { STATUS_KASUS, adaFilterKasus, bacaFilterKasus, labelStatus } from "@/lib/narasi-kasus";
import { fetchDaftarKasus } from "./data";
import { KasusTabel } from "./kasus-tabel";

export const metadata = { title: "Kasus Narasi" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const KONTROL =
  "rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800";

/**
 * Halaman daftar Kasus Narasi (Server Component).
 *
 * Filter `status`/`instrument_id`/`periode` lewat query string (form GET). Kegagalan backend
 * dilempar ke `error.tsx`; "belum ada kasus" dan "tidak ada yang cocok filter" dibedakan.
 */
export default async function KasusNarasiPage({ searchParams }: Props) {
  const session = await auth();
  const sp = await searchParams;
  const filter = bacaFilterKasus(sp);
  const offset = offsetHalaman(sp, "hlm");
  const { items, total } = await fetchDaftarKasus(session?.accessToken, filter, offset);
  const filterAktif = adaFilterKasus(filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-heading">Kasus Narasi</h1>
        <Link
          href="/narasi/kasus/tambah"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Buat kasus
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3" aria-label="Filter kasus">
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Status</span>
          <select name="status" defaultValue={filter.status ?? ""} className={KONTROL}>
            <option value="">Semua status</option>
            {STATUS_KASUS.map((s) => (
              <option key={s} value={s}>
                {labelStatus(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Instrumen</span>
          <input
            name="instrument_id"
            defaultValue={filter.instrument_id ?? ""}
            maxLength={50}
            className={KONTROL}
          />
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
              Tidak ada kasus yang cocok dengan filter.{" "}
              <Link href="/narasi/kasus" className="text-blue-600 dark:text-blue-400">
                Hapus filter
              </Link>
            </>
          ) : (
            "Belum ada kasus narasi."
          )}
        </p>
      ) : (
        <>
          <KasusTabel items={items} />
          <Pagination
            total={total}
            offset={offset}
            pageSize={UKURAN_HALAMAN}
            paramKey="hlm"
            basePath="/narasi/kasus"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
