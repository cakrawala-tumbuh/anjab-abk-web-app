import Link from "next/link";
import { notFound } from "next/navigation";
import { UnduhDocx } from "@/components/unduh-docx";
import { ApiError } from "@/lib/api/errors";
import { auth } from "@/lib/auth/auth";
import { tampilNilai, urlRingkasanSatuan } from "@/lib/redesain-yayasan";
import { BadgePeringatan } from "../badge-peringatan";
import { fetchDetailYayasan } from "../data";

export const metadata = { title: "Detail Ringkasan Yayasan — Redesain Pekerjaan" };

interface Props {
  params: Promise<{ masalah_id: string }>;
}

/**
 * Halaman detail ringkasan yayasan satu masalah (Server Component): seluruh kolom A–P
 * read-model sebagai daftar definisi. 404 backend → `notFound()`; kegagalan lain dilempar
 * ke `error.tsx`. Tidak menampilkan isi konfirmasi per orang maupun nama.
 */
export default async function DetailYayasanPage({ params }: Props) {
  const { masalah_id } = await params;
  const session = await auth();
  let r;
  try {
    r = await fetchDetailYayasan(session?.accessToken, masalah_id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  const butir: ReadonlyArray<[string, string | null]> = [
    ["Konteks", r.konteks_kode],
    ["Sekolah", r.sekolah_konteks],
    ["Periode acuan", r.periode_acuan],
    ["Rumusan hipotesis", r.rumusan_hipotesis],
    ["Sumber awal & keterbatasan", r.sumber_awal_keterbatasan],
    ["Status bukti", r.status_bukti],
    ["K1", r.k1],
    ["K2", r.k2],
    ["K3", r.k3],
    ["K4", r.k4],
    ["Indikasi kritis", r.indikasi_kritis],
    ["Saran otomatis", r.saran_otomatis],
    ["Prioritas final", r.prioritas_final],
    ["Alasan final", r.alasan_final],
    ["Pemutus", r.pemutus],
    ["Tindak lanjut", r.tindak_lanjut],
    ["Status penilaian", r.status_penilaian],
    ["Tanggal keputusan", r.tanggal_keputusan],
    ["Diluruskan sekolah", r.diluruskan_sekolah],
    ["Alasan rentang K berbeda", r.alasan_rentang_beda],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-heading">
          Ringkasan <span className="font-mono">{r.masalah_kode}</span>
        </h1>
        <div className="flex gap-2">
          <Link
            href="/redesain/yayasan"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600"
          >
            Kembali ke ringkasan
          </Link>
          <UnduhDocx
            href={urlRingkasanSatuan(r.masalah_id)}
            label="Unduh DOCX"
            namaCadangan={`ringkasan-${r.masalah_kode}.docx`}
          />
        </div>
      </div>
      <BadgePeringatan peringatan={r.peringatan} />
      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[12rem_1fr]">
        {butir.map(([label, nilai]) => (
          <div key={label} className="contents">
            <dt className="text-gray-500">{label}</dt>
            <dd className="whitespace-normal break-words">{tampilNilai(nilai)}</dd>
          </div>
        ))}
        <dt className="text-gray-500">Proses tertaut</dt>
        <dd>{r.proses_kode.length > 0 ? r.proses_kode.join(", ") : "—"}</dd>
      </dl>
      <p>
        <Link
          href={`/redesain/masalah/${r.masalah_id}`}
          className="text-sm text-blue-600 underline dark:text-blue-400"
        >
          Buka detail masalah (Tim)
        </Link>
      </p>
    </div>
  );
}
