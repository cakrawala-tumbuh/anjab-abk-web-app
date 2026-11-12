import { proxyUnduhan } from "@/lib/redesain-ekspor-proxy";

export const dynamic = "force-dynamic";

/**
 * GET /api/riset/protokol/[id]/sign-off/lampiran
 *
 * Proxy ke `GET /api/v1/riset/protokol/{protokol_id}/sign-off/lampiran` (PDF persetujuan etik).
 * Bearer diambil dari sesi server oleh {@link proxyUnduhan}; `Content-Type: application/pdf` dan
 * `Content-Disposition: attachment` backend diteruskan apa adanya, begitu pula status galat
 * (404 `SIGNOFF_TAK_ADA`, 403). Tanpa sesi → 401 tanpa memanggil backend.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  return proxyUnduhan(`/api/v1/riset/protokol/${encodeURIComponent(id)}/sign-off/lampiran`);
}
