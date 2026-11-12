import Link from "next/link";
import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import { auth } from "@/lib/auth/auth";
import { adaFilterKlarifikasi, bacaFilterKlarifikasi } from "@/lib/narasi-klarifikasi";
import { fetchDaftarKlarifikasi } from "./data";
import { FilterKlarifikasi } from "./filter-klarifikasi";
import { KlarifikasiTabel } from "./klarifikasi-tabel";

export const metadata = { title: "Klarifikasi Narasi" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Indeks klarifikasi narasi (Server Component). Filter `disposition` (bawaan `TERBUKA`) dan
 * `narasi_id` serta halaman hidup di URL. Kegagalan backend dilempar ke `error.tsx`; "register
 * kosong" dan "tidak ada yang cocok filter" dibedakan.
 */
export default async function KlarifikasiIndexPage({ searchParams }: Props) {
  const session = await auth();
  const sp = await searchParams;
  const filter = bacaFilterKlarifikasi(sp);
  const offset = offsetHalaman(sp, "hlm");
  const { items, total } = await fetchDaftarKlarifikasi(session?.accessToken, filter, offset);
  const filterAktif = adaFilterKlarifikasi(filter);

  return (
    <div className="space-y-4">
      <h1 className="page-heading">Klarifikasi Narasi</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Pertanyaan disusun dan disetujui di sini, lalu dikirim fasilitator di luar aplikasi;
        jawabannya dicatat kembali dengan rujukan jawaban (ResponseRef). Pertanyaan baru diajukan
        dari halaman detail kasus narasi atau dari usulan AI P04.
      </p>

      <FilterKlarifikasi filter={filter} />

      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filterAktif ? (
            <>
              Tidak ada klarifikasi yang cocok dengan filter.{" "}
              <Link href="/narasi/klarifikasi" className="text-blue-600 dark:text-blue-400">
                Hapus filter
              </Link>
            </>
          ) : (
            "Belum ada klarifikasi terbuka."
          )}
        </p>
      ) : (
        <>
          <KlarifikasiTabel items={items} />
          <Pagination
            total={total}
            offset={offset}
            pageSize={UKURAN_HALAMAN}
            paramKey="hlm"
            basePath="/narasi/klarifikasi"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
