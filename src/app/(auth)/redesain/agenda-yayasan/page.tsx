import Link from "next/link";
import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import { auth } from "@/lib/auth/auth";
import { fetchAgendaYayasan } from "./data";
import { PetunjukAgendaYayasan } from "./petunjuk-agenda-yayasan";

export const metadata = { title: "Agenda Yayasan — Redesain Pekerjaan" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Halaman Agenda yayasan (Server Component): penilaian berstatus "Siap untuk telaah
 * yayasan". Hanya baca — yayasan tidak mengisi apa pun di aplikasi. Kegagalan backend
 * (mis. 403) dilempar ke `error.tsx`, tidak pernah tabel kosong.
 */
export default async function AgendaYayasanPage({ searchParams }: Props) {
  const session = await auth();
  const sp = await searchParams;
  const offset = offsetHalaman(sp, "hlm");
  const { penilaian, total, masalah } = await fetchAgendaYayasan(session?.accessToken, offset);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-heading">Agenda Yayasan</h1>
        <PetunjukAgendaYayasan />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Penilaian berstatus &quot;Siap untuk telaah yayasan&quot;. Yayasan tidak mengisi di
        aplikasi.
      </p>
      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Belum ada penilaian yang siap untuk telaah yayasan.
        </p>
      ) : (
        <>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {["Masalah", "Status bukti", "Saran otomatis", "Prioritas final"].map((h) => (
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
                {penilaian.map((p) => {
                  const m = masalah.get(p.masalah_id);
                  return (
                    <tr key={p.id} className="align-top">
                      <td className="px-4 py-3 font-mono text-xs">
                        <Link
                          href={`/redesain/masalah/${p.masalah_id}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          {m?.kode ?? p.masalah_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{p.status_bukti}</td>
                      <td className="px-4 py-3">{p.saran_otomatis ?? "—"}</td>
                      <td className="px-4 py-3">{p.prioritas_final ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            total={total}
            offset={offset}
            pageSize={UKURAN_HALAMAN}
            paramKey="hlm"
            basePath="/redesain/agenda-yayasan"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
