import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { JabatanRead, SMEPanelRead, TiSesiRead } from "@/lib/api/schema";
import { OpmSesiForm } from "./opm-sesi-form";

export const metadata = { title: "Mulai Analisis Jabatan — OPM — ANJAB-ABK" };

async function fetchPageData(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const [jabatanRes, panelRes, tiSesiRes] = await Promise.all([
    client.GET("/api/v1/jabatan", { params: { query: { limit: 100 } } }),
    client.GET("/api/v1/sme-panel", { params: { query: { limit: 100 } } }),
    client.GET("/api/v1/task-inventory/sesi", { params: { query: { limit: 100 } } }),
  ]);
  const reqId = jabatanRes.response.headers.get("x-request-id");
  if (!jabatanRes.data) throw toApiError(null, reqId);

  const jabatan = (jabatanRes.data.items ?? []) as JabatanRead[];
  const panel = (panelRes.data?.items ?? []) as SMEPanelRead[];
  const tiSesi = (tiSesiRes.data?.items ?? []) as TiSesiRead[];

  // Hanya jabatan yang punya SME panel dengan >= 1 anggota.
  const jabatanIdsBerPanel = new Set(
    panel.filter((p) => (p.partisipan_ids ?? []).length > 0).map((p) => p.jabatan_id),
  );
  const jabatanBerPanel = jabatan.filter((j) => jabatanIdsBerPanel.has(j.id));

  return { jabatanBerPanel, tiSesi };
}

export default async function BuatOpmSesiPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { jabatanBerPanel, tiSesi } = await fetchPageData(session?.accessToken);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/opm" className="hover:text-gray-700">
          Analisis Jabatan — OPM
        </Link>
        <span>/</span>
        <span className="text-gray-900">Mulai Analisis Jabatan</span>
      </div>

      <div>
        <h1 className="page-heading">Mulai Analisis Jabatan — OPM</h1>
        <p className="page-subtext">
          Pilih jabatan (wajib memiliki SME panel) dan Analisis Jabatan Task Inventory yang sudah
          dibekukan sebagai sumber snapshot task. Responden dibuat otomatis dari anggota SME panel.
        </p>
      </div>

      <OpmSesiForm jabatan={jabatanBerPanel} tiSesi={tiSesi} accessToken={session?.accessToken} />
    </div>
  );
}
