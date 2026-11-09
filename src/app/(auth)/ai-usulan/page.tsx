import Link from "next/link";
import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import { auth } from "@/lib/auth/auth";
import { adaFilterUsulan, bacaFilterUsulan } from "@/lib/ai-usulan";
import { fetchIndexUsulan } from "./data";
import { FilterUsulanForm } from "./filter-usulan";
import { UsulanTabel } from "./usulan-tabel";

export const metadata = { title: "Usulan AI" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Index usulan AI (Server Component): semua fungsi AI dalam satu daftar, terbaru dulu.
 * Filter `fungsi` dan `sasaran` serta halaman hidup di URL. Kegagalan backend dilempar ke
 * `error.tsx`; "belum ada usulan" dan "tidak cocok filter" dibedakan.
 */
export default async function UsulanAiPage({ searchParams }: Props) {
  const session = await auth();
  const sp = await searchParams;
  const filter = bacaFilterUsulan(sp);
  const offset = offsetHalaman(sp, "hlm");
  const { items, total } = await fetchIndexUsulan(session?.accessToken, filter, offset);

  return (
    <div className="space-y-4">
      <h1 className="page-heading">Usulan AI</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Keluaran fungsi AI menunggu peninjauan manusia. Usulan hanyalah kandidat sampai diputus Tim
        Kajian.
      </p>

      <FilterUsulanForm filter={filter} />

      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {adaFilterUsulan(filter) ? (
            <>
              Tidak ada usulan yang cocok dengan filter.{" "}
              <Link href="/ai-usulan" className="text-blue-600 dark:text-blue-400">
                Hapus filter
              </Link>
            </>
          ) : (
            "Belum ada usulan AI."
          )}
        </p>
      ) : (
        <>
          <UsulanTabel items={items} />
          <Pagination
            total={total}
            offset={offset}
            pageSize={UKURAN_HALAMAN}
            paramKey="hlm"
            basePath="/ai-usulan"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
