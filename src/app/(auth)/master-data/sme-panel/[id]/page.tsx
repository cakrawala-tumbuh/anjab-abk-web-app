import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { JabatanRead, SMEPanelRead } from "@/lib/api/schema";
import { AnggotaSection } from "./anggota-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kelola Anggota SME Panel — Master Data" };

async function fetchAll(accessToken: string | undefined, panelId: string) {
  const client = withServerAuth(accessToken);
  const [panelRes, jabatanRes] = await Promise.all([
    client.GET("/api/v1/sme-panel/{panel_id}", {
      params: { path: { panel_id: panelId } },
      cache: "no-store",
    }),
    client.GET("/api/v1/jabatan", { params: { query: { limit: 100 } }, cache: "no-store" }),
  ]);
  if (!panelRes.data) {
    const requestId = panelRes.response.headers.get("x-request-id");
    throw toApiError(null, requestId);
  }
  return {
    panel: panelRes.data as SMEPanelRead,
    jabatan: (jabatanRes.data?.items ?? []) as JabatanRead[],
  };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SMEPanelDetailPage({ params }: Props) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { id } = await params;
  const { panel, jabatan } = await fetchAll(session?.accessToken, id);

  const jabatanMap = Object.fromEntries(jabatan.map((j) => [j.id, j]));
  const jbt = jabatanMap[panel.jabatan_id];
  const panelPartisipanIds = panel.partisipan_ids ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            SME Panel: {jbt?.nama ?? panel.jabatan_id}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {jbt?.jenis && (
              <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 mr-2">
                {jbt.jenis}
              </span>
            )}
            {panel.aktif ? (
              <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Aktif
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                Nonaktif
              </span>
            )}
          </p>
        </div>
        <Link href="/master-data/sme-panel" className="text-sm text-gray-500 hover:text-gray-700">
          ← Kembali
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-5">
        <h3 className="text-sm font-semibold text-gray-700">
          Anggota Panel ({panelPartisipanIds.length})
        </h3>

        <AnggotaSection
          panelId={panel.id}
          panelJabatanId={panel.jabatan_id}
          partisipanIds={panelPartisipanIds}
          jabatanMap={jabatanMap}
          accessToken={session?.accessToken}
        />
      </div>
    </div>
  );
}
