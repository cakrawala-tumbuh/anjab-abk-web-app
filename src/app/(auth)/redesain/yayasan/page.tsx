import Link from "next/link";
import { UnduhDocx } from "@/components/unduh-docx";
import { Pagination, UKURAN_HALAMAN, offsetHalaman } from "@/components/pagination";
import { auth } from "@/lib/auth/auth";
import {
  PESAN_AGENDA_KOSONG,
  bacaFilterYayasan,
  tampilNilai,
  urlAgendaYayasan,
  urlRingkasanSatuan,
} from "@/lib/redesain-yayasan";
import { BadgePeringatan } from "./badge-peringatan";
import { fetchIndexYayasan } from "./data";
import { FilterYayasanBar } from "./filter-yayasan";

export const metadata = { title: "Ringkasan Yayasan — Redesain Pekerjaan" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const KOLOM = [
  "Masalah",
  "Konteks",
  "Sekolah",
  "Rumusan hipotesis",
  "Sumber awal & keterbatasan",
  "Status bukti",
  "K1",
  "K2",
  "K3",
  "K4",
  "Indikasi kritis",
  "Saran otomatis",
  "Prioritas final",
  "Alasan final",
  "Pemutus",
  "Tindak lanjut",
  "Peringatan",
  "Unduh",
] as const;

/**
 * Halaman Ringkasan Yayasan (Server Component): satu baris per masalah dari read-model
 * backend (kolom A–P). Nilai `null` tampil `—`, tidak pernah `0`/`Tidak`/`Rendah`. Hanya
 * baca + unduh DOCX — yayasan tidak mengisi apa pun dan halaman tidak menampilkan isi
 * konfirmasi per orang maupun nama. Kegagalan backend (mis. 403) dilempar ke `error.tsx`.
 */
export default async function RingkasanYayasanPage({ searchParams }: Props) {
  const session = await auth();
  const sp = await searchParams;
  const filter = bacaFilterYayasan(sp);
  const offset = offsetHalaman(sp, "hlm");
  const { baris, total, konteks } = await fetchIndexYayasan(session?.accessToken, filter, offset);
  const adaFilter = Object.values(filter).some((v) => v !== null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-heading">Ringkasan Yayasan</h1>
        <UnduhDocx
          href={urlAgendaYayasan()}
          label="Unduh agenda (DOCX)"
          pesan404={PESAN_AGENDA_KOSONG}
          namaCadangan="agenda-yayasan.docx"
        />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Ringkasan keputusan per masalah untuk diserahkan ke yayasan. Yayasan tidak mengisi di
        aplikasi; halaman ini tidak memuat isi konfirmasi per orang.
      </p>
      <FilterYayasanBar konteks={konteks} filter={filter} />
      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {adaFilter ? (
            <>
              Tidak ada masalah yang cocok dengan filter.{" "}
              <Link href="/redesain/yayasan" className="text-blue-600 underline">
                Hapus filter
              </Link>
            </>
          ) : (
            "Belum ada masalah."
          )}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full min-w-max text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {KOLOM.map((h) => (
                    <th
                      key={h}
                      className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {baris.map((r) => (
                  <tr key={r.masalah_id} className="align-top">
                    <td className="px-3 py-3 font-mono text-xs">
                      <Link
                        href={`/redesain/yayasan/${r.masalah_id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        {r.masalah_kode}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{r.konteks_kode}</td>
                    <td className="px-3 py-3">{tampilNilai(r.sekolah_konteks)}</td>
                    <td className="max-w-xs whitespace-normal break-words px-3 py-3">
                      {r.rumusan_hipotesis}
                    </td>
                    <td className="max-w-xs whitespace-normal break-words px-3 py-3">
                      {r.sumber_awal_keterbatasan}
                    </td>
                    <td className="px-3 py-3">{tampilNilai(r.status_bukti)}</td>
                    <td className="px-3 py-3">{tampilNilai(r.k1)}</td>
                    <td className="px-3 py-3">{tampilNilai(r.k2)}</td>
                    <td className="px-3 py-3">{tampilNilai(r.k3)}</td>
                    <td className="px-3 py-3">{tampilNilai(r.k4)}</td>
                    <td className="px-3 py-3">{tampilNilai(r.indikasi_kritis)}</td>
                    <td className="px-3 py-3">{tampilNilai(r.saran_otomatis)}</td>
                    <td className="px-3 py-3">{tampilNilai(r.prioritas_final)}</td>
                    <td className="max-w-xs whitespace-normal break-words px-3 py-3">
                      {tampilNilai(r.alasan_final)}
                    </td>
                    <td className="px-3 py-3">{tampilNilai(r.pemutus)}</td>
                    <td className="max-w-xs whitespace-normal break-words px-3 py-3">
                      {tampilNilai(r.tindak_lanjut)}
                    </td>
                    <td className="px-3 py-3">
                      <BadgePeringatan peringatan={r.peringatan} />
                    </td>
                    <td className="px-3 py-3">
                      <UnduhDocx
                        href={urlRingkasanSatuan(r.masalah_id)}
                        label="Unduh DOCX"
                        namaCadangan={`ringkasan-${r.masalah_kode}.docx`}
                      />
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
            basePath="/redesain/yayasan"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
