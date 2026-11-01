import Link from "next/link";
import { BadgeEskalasi } from "@/components/badge-eskalasi";
import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import { auth } from "@/lib/auth/auth";
import {
  bacaFilterMasalah,
  labelKonteks,
  labelSekolah,
  type FilterMasalah,
} from "@/lib/redesain-register";
import { fetchIndexMasalah } from "./data";
import { FilterMasalahBar } from "./filter-masalah";
import { ToggleKonfirmasi } from "./toggle-konfirmasi";

export const metadata = { title: "Masalah — Redesain Pekerjaan" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function adaFilter(f: FilterMasalah): boolean {
  return Boolean(f.konteksId || f.sekolahId || f.statusAwal || f.gelombang) || f.dibuka !== null;
}

/**
 * Halaman register Masalah redesain (Server Component).
 *
 * Index ber-filter (filter di query string) lewat `POST .../masalah/search`. Kegagalan
 * backend dilempar ke `error.tsx`, tidak pernah tabel kosong. Kode masalah menaut ke
 * halaman detail `/redesain/masalah/[id]`.
 */
export default async function MasalahPage({ searchParams }: Props) {
  const session = await auth();
  const sp = await searchParams;
  const filter = bacaFilterMasalah(sp);
  const offset = offsetHalaman(sp, "hlm");
  const { masalah, total, konteks, sekolah } = await fetchIndexMasalah(
    session?.accessToken,
    filter,
    offset,
  );
  const petaKonteks = new Map(konteks.map((k) => [k.id, k]));
  const petaSekolah = new Map(sekolah.map((s) => [s.id, s]));
  const filterAktif = adaFilter(filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-heading">Masalah Redesain</h1>
        <Link
          href="/redesain/masalah/tambah"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah masalah
        </Link>
      </div>
      <FilterMasalahBar konteks={konteks} sekolah={sekolah} filter={filter} />

      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filterAktif ? (
            <>
              Tidak ada masalah yang cocok dengan filter.{" "}
              <Link href="/redesain/masalah" className="text-blue-600 dark:text-blue-400">
                Hapus filter
              </Link>
            </>
          ) : (
            "Belum ada masalah."
          )}
        </p>
      ) : (
        <>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {[
                    "Kode",
                    "Konteks",
                    "Sekolah",
                    "Periode acuan",
                    "Status awal",
                    "Gelombang",
                    "Dibuka",
                    "Eskalasi",
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
                {masalah.map((m) => (
                  <tr key={m.id} className="align-top">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link
                        href={`/redesain/masalah/${m.id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        {m.kode}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-normal break-words">
                      {labelKonteks(m.konteks_id, petaKonteks)}
                    </td>
                    <td className="px-4 py-3 whitespace-normal break-words">
                      {labelSekolah(m, petaSekolah)}
                    </td>
                    <td className="px-4 py-3">{m.periode_acuan}</td>
                    <td className="px-4 py-3">{m.status_awal}</td>
                    <td className="px-4 py-3">{m.gelombang}</td>
                    <td className="px-4 py-3">
                      <ToggleKonfirmasi
                        id={m.id}
                        dibuka={m.dibuka_untuk_konfirmasi}
                        accessToken={session?.accessToken}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <BadgeEskalasi eskalasiPada={m.eskalasi_pada} />
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
            basePath="/redesain/masalah"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
