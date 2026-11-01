import Link from "next/link";
import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import { auth } from "@/lib/auth/auth";
import {
  TEKS_BUKAN_TIME_STUDY,
  bacaFilterSesi,
  formatMenit,
  type FilterSesi,
} from "@/lib/redesain-sesi";
import { fetchIndexSesi } from "./data";
import { FilterSesiBar } from "./filter-sesi";

export const metadata = { title: "Sesi Partisipasi — Redesain Pekerjaan" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function adaFilter(f: FilterSesi): boolean {
  return Boolean(f.kodeSesi || f.kodeOrang || f.jenisKegiatan || f.statusIzin);
}

/**
 * Halaman index Sesi partisipasi redesain (Server Component).
 *
 * Index ber-filter (query string) lewat `POST .../sesi/search`. Kegagalan backend dilempar
 * ke `error.tsx`, tidak pernah tabel kosong. Orang tampil sebagai kode, bukan nama.
 */
export default async function SesiPage({ searchParams }: Props) {
  const session = await auth();
  const sp = await searchParams;
  const filter = bacaFilterSesi(sp);
  const offset = offsetHalaman(sp, "hlm");
  const { sesi, total, sekolah } = await fetchIndexSesi(session?.accessToken, filter, offset);
  const petaSekolah = new Map(sekolah.map((s) => [s.id, s.nama]));
  const filterAktif = adaFilter(filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-heading">Sesi Partisipasi</h1>
        <div className="flex gap-2">
          <Link
            href="/redesain/sesi/rekap"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-600"
          >
            Rekap per orang
          </Link>
          <Link
            href="/redesain/sesi/tambah"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Tambah sesi
          </Link>
        </div>
      </div>
      <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
        {TEKS_BUKAN_TIME_STUDY}
      </p>
      <FilterSesiBar filter={filter} />

      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filterAktif ? (
            <>
              Tidak ada sesi yang cocok dengan filter.{" "}
              <Link href="/redesain/sesi" className="text-blue-600 dark:text-blue-400">
                Hapus filter
              </Link>
            </>
          ) : (
            "Belum ada sesi."
          )}
        </p>
      ) : (
        <>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {[
                    "Kode sesi",
                    "Kode orang",
                    "Sekolah",
                    "Peran",
                    "Jenis kegiatan",
                    "Menit rencana",
                    "Menit disepakati",
                    "Status izin",
                  ].map((h) => (
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
                {sesi.map((s) => (
                  <tr key={s.id} className="align-top">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link
                        href={`/redesain/sesi/${s.id}/ubah`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        {s.kode_sesi}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{s.kode_orang}</td>
                    <td className="px-4 py-3 whitespace-normal break-words">
                      {s.sekolah_id ? (petaSekolah.get(s.sekolah_id) ?? s.sekolah_id) : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-normal break-words">{s.peran}</td>
                    <td className="px-4 py-3">{s.jenis_kegiatan}</td>
                    <td className="px-4 py-3">{formatMenit(s.menit_rencana)}</td>
                    <td className="px-4 py-3">{formatMenit(s.menit_disepakati)}</td>
                    <td className="px-4 py-3">{s.status_izin}</td>
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
            basePath="/redesain/sesi"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
