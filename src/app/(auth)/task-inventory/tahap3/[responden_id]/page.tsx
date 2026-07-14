import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { ApiError, isTidakBerhak } from "@/lib/api/errors";
import { GagalMuat, TidakBerhak } from "@/components/gagal-muat";
import { fetchTahap3Data, type Tahap3PageData } from "./data";
import { DetailForm } from "./detail-form";

export const metadata = { title: "Tahap 3 — Detailing" };

const JUDUL = "Tahap 3 — Detailing Tugas";

interface Props {
  params: Promise<{ responden_id: string }>;
}

export default async function Tahap3Page({ params }: Props) {
  const session = await auth();
  if (!session) notFound();

  const { responden_id } = await params;

  // Kegagalan yang dikenali dirender di server (agar X-Request-ID terlihat —
  // Next.js menyensor pesan error Server Component yang sampai ke error.tsx).
  // Error tak dikenal tetap dilempar ke error boundary.
  let data: Tahap3PageData;
  try {
    data = await fetchTahap3Data(session.accessToken, responden_id);
  } catch (err) {
    if (isTidakBerhak(err)) return <TidakBerhak judul={JUDUL} err={err} />;
    if (err instanceof ApiError) return <GagalMuat judul={JUDUL} err={err} />;
    throw err;
  }

  const { responden, sesi, terpilih, detail } = data;
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
        <span className="text-gray-900">Tahap 3 — Detailing</span>
      </div>

      <div>
        <h1 className="page-heading">{JUDUL}</h1>
        <p className="page-subtext">
          {responden.nama ?? "Anonim"} · isi rincian beban kerja (CalHR) untuk tugas yang Anda
          kerjakan.
        </p>
      </div>

      {responden.tahap3_submit ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Detail Tahap 3 sudah dikirim. Tidak dapat diubah.
        </div>
      ) : sesi.status !== "TAHAP3" ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Analisis jabatan ini tidak sedang dalam Tahap 3 (status: {sesi.status}).
        </div>
      ) : (
        <DetailForm
          respondenId={responden_id}
          tasks={terpilih}
          detailAwal={detail}
          accessToken={session?.accessToken}
        />
      )}
    </div>
  );
}
