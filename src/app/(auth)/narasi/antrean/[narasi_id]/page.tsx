import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { labelStatusAntrean } from "@/lib/narasi-antrean";
import { fetchSemuaSumber } from "../../kasus/data";
import { AksiTinjauan } from "./aksi-tinjauan";
import { fetchDetailAntrean } from "./data";
import { PanelDraf } from "./panel-draf";
import { PanelKetidakpastian } from "./panel-ketidakpastian";
import { PanelSumber } from "./panel-sumber";

export const metadata = { title: "Tinjauan Narasi" };

interface Props {
  params: Promise<{ narasi_id: string }>;
}

/**
 * Halaman tinjauan satu kasus antrean (Server Component): draf dan sumber berdampingan di
 * layar lebar (bertumpuk di layar sempit), panel ketidakpastian, dan empat aksi.
 *
 * Kegagalan backend dilempar ke `error.tsx` (termasuk 403); 404 menjadi `notFound()`;
 * 409 `narasi_tidak_dalam_antrean` menjadi panel keterangan dengan tautan kembali.
 */
export default async function TinjauanNarasiPage({ params }: Props) {
  const { narasi_id } = await params;
  const session = await auth();
  const token = session?.accessToken;
  const hasil = await fetchDetailAntrean(token, narasi_id);
  if (hasil.jenis === "tidak_ada") notFound();

  const kembali = (
    <Link href="/narasi/antrean" className="hover:underline">
      Antrean Tinjauan Narasi
    </Link>
  );

  if (hasil.jenis === "luar_antrean") {
    return (
      <div className="space-y-4">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500 dark:text-gray-400">
          {kembali} / <span>Tinjauan</span>
        </nav>
        <h1 className="page-heading">Kasus tidak dalam antrean</h1>
        <div
          role="status"
          className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-900/30"
        >
          <p>{hasil.pesan}</p>
          <p className="mt-2">
            <Link href="/narasi/antrean" className="text-blue-600 underline dark:text-blue-400">
              Kembali ke antrean
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const { detail } = hasil;
  const sumberOpsi = await fetchSemuaSumber(token);

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500 dark:text-gray-400">
        {kembali} / <span>{detail.instrument_id}</span>
      </nav>
      <h1 className="page-heading">
        {detail.instrument_id} · {detail.field_key}
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Peran {detail.peran_ref} · periode {detail.periode} · {detail.narrative_kind} ·{" "}
        {labelStatusAntrean(detail.status)}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <PanelDraf detail={detail} />
        <PanelSumber sumber={detail.sumber} />
      </div>
      <PanelKetidakpastian detail={detail} />
      <AksiTinjauan
        narasiId={detail.narasi_id}
        versiId={detail.versi_id}
        adaTeks={detail.teks !== null}
        sumberOpsi={sumberOpsi}
        accessToken={token}
      />
    </div>
  );
}
