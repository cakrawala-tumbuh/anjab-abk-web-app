import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { exposureDariPaparan } from "@/lib/narasi-klarifikasi";
import { fetchDetailAntrean } from "../../antrean/[narasi_id]/data";
import { fetchKasus, fetchSemuaSumber } from "../../kasus/data";
import { KlarifikasiForm } from "./klarifikasi-form";

export const metadata = { title: "Ajukan Klarifikasi" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Halaman ajukan klarifikasi manual (Server Component). Wajib membawa `?narasi_id=`; kasus
 * tak ada → `notFound()`. `exposure` diturunkan dari `paparan` antrean kasus itu (baca-saja);
 * kasus di luar antrean menghasilkan `TIDAK_DIKETAHUI`. Daftar sumber adalah data inti: gagal
 * dilempar ke `error.tsx`, tidak pernah menjadi pilihan kosong.
 */
export default async function TambahKlarifikasiPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.narasi_id) ? sp.narasi_id[0] : sp.narasi_id;
  const narasiId = raw?.trim();
  if (!narasiId) {
    return (
      <div className="space-y-4">
        <h1 className="page-heading">Ajukan Klarifikasi</h1>
        <p role="status" className="text-sm text-gray-600 dark:text-gray-400">
          Pilih kasus narasi dulu: buka detail kasus lalu pilih &quot;Ajukan klarifikasi&quot;.{" "}
          <Link href="/narasi/kasus" className="text-blue-600 dark:text-blue-400">
            Ke daftar kasus
          </Link>
        </p>
      </div>
    );
  }
  const session = await auth();
  const token = session?.accessToken;
  const kasus = await fetchKasus(token, narasiId);
  if (!kasus) notFound();
  const [sumber, antrean] = await Promise.all([
    fetchSemuaSumber(token),
    fetchDetailAntrean(token, narasiId),
  ]);
  const exposure = exposureDariPaparan(antrean.jenis === "ada" ? antrean.detail.paparan : null);

  return (
    <div className="space-y-4">
      <h1 className="page-heading">Ajukan Klarifikasi</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Kasus: {kasus.instrument_id} · {kasus.field_key} (periode {kasus.periode}). Pertanyaan ini
        disusun di sini lalu dikirim fasilitator di luar aplikasi setelah disetujui reviewer lain.
      </p>
      <KlarifikasiForm
        narasiId={kasus.id}
        periodeAwal={kasus.periode}
        exposure={exposure}
        sumberOpsi={sumber}
        accessToken={token}
      />
    </div>
  );
}
