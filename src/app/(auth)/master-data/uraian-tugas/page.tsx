import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import { bacaFilter } from "@/lib/uraian-tugas-filter";
import { fetchUraianTugasData } from "./data";
import { FilterUraianTugas } from "./filter-uraian-tugas";

export const metadata = { title: "Uraian Tugas — Master Data" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Halaman Master Data → Uraian Tugas: daftar terfilter (jabatan/tugas pokok/detil tugas). */
export default async function UraianTugasPage({ searchParams }: Props) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const sp = await searchParams;
  const filter = bacaFilter(sp);
  const offset = offsetHalaman(sp, "hlm");
  const { uraianTugas, total, jabatan, tugasPokok, detilTugas } = await fetchUraianTugasData(
    session?.accessToken,
    filter,
    offset,
  );
  const jabatanMap = Object.fromEntries(jabatan.map((j) => [j.id, j.nama]));
  const pokokMap = Object.fromEntries(tugasPokok.map((tp) => [tp.id, tp.nama]));
  const detilMap = Object.fromEntries(detilTugas.map((dt) => [dt.id, dt.nama]));
  const adaFilterAktif =
    filter.jabatanId !== null || filter.tugasPokokId !== null || filter.detilTugasId !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {adaFilterAktif
            ? `${total} uraian tugas cocok dengan filter`
            : `${total} uraian tugas terdaftar`}
        </p>
        <Link
          href="/master-data/uraian-tugas/tambah"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah Uraian Tugas
        </Link>
      </div>

      <FilterUraianTugas
        jabatan={jabatan}
        tugasPokok={tugasPokok}
        detilTugas={detilTugas}
        filter={filter}
      />

      {total === 0 ? (
        adaFilterAktif ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tidak ada uraian tugas yang cocok dengan filter.{" "}
            <Link
              href="/master-data/uraian-tugas"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Hapus filter
            </Link>
          </p>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Belum ada uraian tugas. Mulai dengan menambah satu.
          </p>
        )
      ) : (
        <>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Kode
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Uraian
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Jabatan
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Tugas Pokok
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Detil Tugas
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Standar
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {uraianTugas.map((ut) => (
                  <tr key={ut.id} className="align-top hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {ut.kode}
                    </td>
                    <td className="max-w-xs whitespace-normal break-words px-4 py-3 text-gray-900 dark:text-gray-100">
                      {ut.uraian}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {ut.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {jabatanMap[ut.jabatan_id] ?? ut.jabatan_id}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {pokokMap[ut.tugas_pokok_id] ?? ut.tugas_pokok_id}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {ut.detil_tugas_id ? (detilMap[ut.detil_tugas_id] ?? ut.detil_tugas_id) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {ut.std_frekuensi_teks !== null && (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          Standar
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/master-data/uraian-tugas/${ut.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Edit / Hapus
                      </Link>
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
            basePath="/master-data/uraian-tugas"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
