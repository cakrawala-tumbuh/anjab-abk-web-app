import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { labelStatus } from "@/lib/narasi-kasus";
import { fetchKasus, fetchRiwayat, fetchSemuaPermintaanAi, fetchSemuaSumber } from "../data";
import { PermintaanDrafAi } from "./permintaan-draf-ai";
import { RevisiManualForm } from "../revisi-manual-form";
import { RiwayatKasus } from "../riwayat-kasus";

export const metadata = { title: "Detail Kasus Narasi" };

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Halaman detail Kasus Narasi (Server Component): lingkup kasus, status, riwayat versi dan
 * event, panel permintaan draf AI, serta formulir revisi manual. Daftar sumber untuk formulir adalah data inti: gagal
 * muat dilempar ke `error.tsx`, tidak pernah menjadi pilihan kosong. 404 → tidak ditemukan.
 */
export default async function DetailKasusPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const token = session?.accessToken;
  const kasus = await fetchKasus(token, id);
  if (!kasus) notFound();
  const [riwayat, sumber, permintaan] = await Promise.all([
    fetchRiwayat(token, id),
    fetchSemuaSumber(token),
    fetchSemuaPermintaanAi(token, id),
  ]);

  const baris: Array<[string, React.ReactNode]> = [
    ["Instrumen", kasus.instrument_id],
    ["Kunci isian", kasus.field_key],
    ["Peran", kasus.peran_ref],
    ["Periode", kasus.periode],
    ["Sekolah", kasus.sekolah_id ?? "—"],
    ["Penugasan", kasus.assignment_ref ?? "—"],
    ["Subjek sasaran", kasus.target_subject_ref ?? "—"],
    ["Kode konteks", kasus.konteks_kode ?? "—"],
    ["Jenis narasi", kasus.narrative_kind],
    ["Kelas kepekaan", kasus.sensitivity_class],
    ["Tujuan pemakaian", kasus.intended_use],
    ["Lingkup izin", kasus.permission_scope],
    ["Status", labelStatus(kasus.status)],
    ["Dibuat oleh", kasus.dibuat_oleh],
    ["Dibuat pada", new Date(kasus.created_at).toLocaleString("id-ID")],
  ];

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500 dark:text-gray-400">
        <Link href="/narasi/kasus" className="hover:underline">
          Kasus Narasi
        </Link>{" "}
        / <span>{kasus.instrument_id}</span>
      </nav>
      <h1 className="page-heading">
        {kasus.instrument_id} · {kasus.field_key}
      </h1>
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[12rem_1fr]">
        {baris.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-gray-600 dark:text-gray-400">{k}</dt>
            <dd className="whitespace-normal break-words">{v}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="riwayat-kasus" className="space-y-2">
        <h2 id="riwayat-kasus" className="text-base font-semibold">
          Riwayat
        </h2>
        <RiwayatKasus versi={riwayat.versi} event={riwayat.event} />
      </section>

      <section aria-labelledby="draf-ai-kasus" className="space-y-2">
        <h2 id="draf-ai-kasus" className="text-base font-semibold">
          Permintaan draf AI
        </h2>
        <PermintaanDrafAi
          kasusId={kasus.id}
          statusKasus={kasus.status}
          sumberOpsi={sumber}
          permintaan={permintaan}
          accessToken={token}
        />
      </section>

      <section aria-labelledby="revisi-kasus" className="space-y-2">
        <h2 id="revisi-kasus" className="text-base font-semibold">
          Tulis revisi manual
        </h2>
        <RevisiManualForm
          kasusId={kasus.id}
          supersedesId={kasus.versi_terbaru?.id ?? null}
          sumberOpsi={sumber}
          accessToken={token}
        />
      </section>
    </div>
  );
}
