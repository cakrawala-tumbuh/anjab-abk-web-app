import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/errors";
import { BadgeEskalasi } from "@/components/badge-eskalasi";
import { auth } from "@/lib/auth/auth";
import { UnduhDocx } from "@/components/unduh-docx";
import { urlLembarKonfirmasi } from "@/lib/redesain-yayasan";
import { labelKonteks, labelSekolah } from "@/lib/redesain-register";
import { fetchMasalah, semuaKonteks, semuaSekolah } from "../data";
import { withServerAuth } from "@/lib/api/client";
import { BAGIAN_DETAIL_MASALAH, pilihBagian } from "./registry";

export const metadata = { title: "Detail Masalah — Redesain Pekerjaan" };

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Halaman detail masalah redesain (Server Component).
 *
 * Header identitas (kode, konteks, sekolah, periode acuan, status awal, gelombang,
 * dibuka) lalu satu bagian terpilih lewat `?bagian=` dari `BAGIAN_DETAIL_MASALAH`
 * (bawaan: alur). 404 backend → `notFound()`; kegagalan lain dilempar ke `error.tsx`.
 */
export default async function DetailMasalahPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();
  const token = session?.accessToken;
  let masalah;
  try {
    masalah = await fetchMasalah(token, id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  const client = withServerAuth(token);
  const [konteks, sekolah] = await Promise.all([semuaKonteks(client), semuaSekolah(client)]);
  const petaKonteks = new Map(konteks.map((k) => [k.id, k]));
  const petaSekolah = new Map(sekolah.map((s) => [s.id, s]));
  const bagian = pilihBagian(sp.bagian);
  const isiBagian = await bagian.render({ masalah, sekolah, accessToken: token });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-heading">
          Masalah <span className="font-mono">{masalah.kode}</span>{" "}
          <BadgeEskalasi eskalasiPada={masalah.eskalasi_pada} />
        </h1>
        <div className="flex flex-wrap gap-2">
          <UnduhDocx
            href={urlLembarKonfirmasi(masalah.id)}
            label="Unduh Lembar Konfirmasi"
            namaCadangan={`lembar-konfirmasi-${masalah.kode}.docx`}
          />
          <Link
            href="/redesain/masalah"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600"
          >
            Kembali ke daftar
          </Link>
          <Link
            href={`/redesain/masalah/${masalah.id}/ubah`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600"
          >
            Ubah masalah
          </Link>
        </div>
      </div>

      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[10rem_1fr]">
        <dt className="text-gray-500">Konteks</dt>
        <dd>{labelKonteks(masalah.konteks_id, petaKonteks)}</dd>
        <dt className="text-gray-500">Sekolah</dt>
        <dd>{labelSekolah(masalah, petaSekolah)}</dd>
        <dt className="text-gray-500">Periode acuan</dt>
        <dd>{masalah.periode_acuan}</dd>
        <dt className="text-gray-500">Status awal</dt>
        <dd>{masalah.status_awal}</dd>
        <dt className="text-gray-500">Gelombang</dt>
        <dd>{masalah.gelombang}</dd>
        <dt className="text-gray-500">Dibuka untuk konfirmasi</dt>
        <dd>{masalah.dibuka_untuk_konfirmasi ? "Dibuka" : "Tertutup"}</dd>
      </dl>

      <nav
        aria-label="Bagian detail masalah"
        className="flex gap-2 border-b border-gray-200 dark:border-gray-700"
      >
        {BAGIAN_DETAIL_MASALAH.map((b) => (
          <Link
            key={b.kunci}
            href={`/redesain/masalah/${masalah.id}?bagian=${b.kunci}`}
            aria-current={b.kunci === bagian.kunci ? "page" : undefined}
            className={
              b.kunci === bagian.kunci
                ? "border-b-2 border-blue-600 px-3 py-2 text-sm font-medium text-blue-600"
                : "px-3 py-2 text-sm text-gray-600 dark:text-gray-400"
            }
          >
            {b.label}
          </Link>
        ))}
      </nav>

      {isiBagian}
    </div>
  );
}
