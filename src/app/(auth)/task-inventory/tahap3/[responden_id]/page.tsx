import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { TiRespondenRead, TiSesiRead, TiTaskTerpilihRead } from "@/lib/api/schema";
import { DetailForm } from "./detail-form";

export const metadata = { title: "Tahap 3 — Detailing — ANJAB-ABK" };

interface Props {
  params: Promise<{ responden_id: string }>;
}

async function fetchPageData(accessToken: string | undefined, respondenId: string) {
  const client = withServerAuth(accessToken);
  const respRes = await client.GET("/api/v1/task-inventory/sesi/responden/{responden_id}", {
    params: { path: { responden_id: respondenId } },
  });
  const reqId = respRes.response.headers.get("x-request-id");
  if (!respRes.data) throw toApiError(null, reqId);
  const responden = respRes.data as TiRespondenRead;

  const sesiRes = await client.GET("/api/v1/task-inventory/sesi/{sesi_id}", {
    params: { path: { sesi_id: responden.sesi_id } },
  });
  if (!sesiRes.data) throw toApiError(null, reqId);
  const sesi = sesiRes.data as TiSesiRead;

  let terpilih: TiTaskTerpilihRead[] = [];
  if (["TAHAP3", "CLOSED", "ANALYZED"].includes(sesi.status)) {
    const ttRes = await client.GET("/api/v1/task-inventory/sesi/{sesi_id}/task-terpilih", {
      params: { path: { sesi_id: sesi.id } },
    });
    terpilih = (ttRes.data ?? []) as TiTaskTerpilihRead[];
  }

  return { responden, sesi, terpilih };
}

export default async function Tahap3Page({ params }: Props) {
  const session = await auth();
  if (!session) notFound();

  const { responden_id } = await params;
  const { responden, sesi, terpilih } = await fetchPageData(session?.accessToken, responden_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={`/task-inventory/${sesi.id}`} className="hover:text-gray-700">
          {sesi.unit} · {sesi.kategori_jabatan}
        </Link>
        <span>/</span>
        <span className="text-gray-900">Tahap 3 — Detailing</span>
      </div>

      <div>
        <h1 className="page-heading">Tahap 3 — Detailing Tugas</h1>
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
          Sesi tidak sedang dalam Tahap 3 (status: {sesi.status}).
        </div>
      ) : (
        <DetailForm
          respondenId={responden_id}
          sesiId={sesi.id}
          tasks={terpilih}
          accessToken={session?.accessToken}
        />
      )}
    </div>
  );
}
