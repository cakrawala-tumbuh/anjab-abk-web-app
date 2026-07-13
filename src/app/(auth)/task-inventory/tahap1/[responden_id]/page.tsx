import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { TiCatalogRead, TiRespondenRead, TiSeleksiRead, TiSesiRead } from "@/lib/api/schema";
import { SeleksiForm } from "./seleksi-form";

export const metadata = { title: "Tahap 1 — Seleksi Relevansi" };

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

  const catalogRes = await client.GET("/api/v1/task-inventory/catalog", {
    params: { query: { jabatan_id: sesi.jabatan_id } },
  });
  const catalog = (catalogRes.data ?? []) as TiCatalogRead[];

  const selRes = await client.GET("/api/v1/task-inventory/sesi/responden/{responden_id}/seleksi", {
    params: { path: { responden_id: respondenId } },
  });
  const terpilih = (selRes.data as TiSeleksiRead | undefined)?.task_kode ?? [];

  return { responden, sesi, catalog, terpilih };
}

export default async function Tahap1Page({ params }: Props) {
  const session = await auth();
  if (!session) notFound();

  const { responden_id } = await params;
  const { responden, sesi, catalog, terpilih } = await fetchPageData(
    session?.accessToken,
    responden_id,
  );
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
        <h1 className="page-heading">Tahap 1 — Seleksi Relevansi</h1>
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
