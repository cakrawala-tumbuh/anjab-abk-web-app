import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { ApiError, isTidakBerhak } from "@/lib/api/errors";
import { GagalMuat, TidakBerhak } from "@/components/gagal-muat";
import { fetchTahap1Data, type Tahap1PageData } from "./data";
import { SeleksiForm } from "./seleksi-form";

export const metadata = { title: "Tahap 1 — Seleksi Relevansi" };

const JUDUL = "Tahap 1 — Seleksi Relevansi";

interface Props {
  params: Promise<{ responden_id: string }>;
}

export default async function Tahap1Page({ params }: Props) {
  const session = await auth();
  if (!session) notFound();

  const { responden_id } = await params;

  // Kegagalan yang dikenali dirender di server (agar X-Request-ID terlihat —
  // Next.js menyensor pesan error Server Component yang sampai ke error.tsx).
  // Error tak dikenal tetap dilempar ke error boundary.
  let data: Tahap1PageData;
  try {
    data = await fetchTahap1Data(session.accessToken, responden_id);
  } catch (err) {
    if (isTidakBerhak(err)) return <TidakBerhak judul={JUDUL} err={err} />;
    if (err instanceof ApiError) return <GagalMuat judul={JUDUL} err={err} />;
    throw err;
  }

  const { responden, sesi, catalog, terpilih } = data;
  const admin = isAdmin(session);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {admin ? (
          <Link href={`/task-inventory/${sesi.id}`} className="hover:text-gray-700">
            {sesi.jabatan_nama ?? sesi.jabatan_id}
          </Link>
        ) : (
          <span>{sesi.jabatan_nama ?? sesi.jabatan_id}</span>
        )}
        <span>/</span>
        <span className="text-gray-900">Tahap 1 — Seleksi</span>
      </div>

      <div>
        <h1 className="page-heading">{JUDUL}</h1>
        <p className="page-subtext">
          {responden.nama ?? "Anonim"} · pilih task yang relevan untuk jabatan Anda.
        </p>
      </div>

      {responden.tahap1_submit ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Seleksi Tahap 1 sudah dikirim ({terpilih.length} task dipilih). Tidak dapat diubah.
        </div>
      ) : sesi.status !== "TAHAP1" ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Analisis jabatan ini tidak sedang dalam Tahap 1 (status: {sesi.status}).
        </div>
      ) : (
        <SeleksiForm
          respondenId={responden_id}
          catalog={catalog}
          terpilihAwal={terpilih}
          accessToken={session?.accessToken}
        />
      )}
    </div>
  );
}
