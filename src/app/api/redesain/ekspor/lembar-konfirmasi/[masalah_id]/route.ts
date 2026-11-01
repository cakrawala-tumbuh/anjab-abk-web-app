import { proxyUnduhan } from "@/lib/redesain-ekspor-proxy";

export const dynamic = "force-dynamic";

/**
 * GET /api/redesain/ekspor/lembar-konfirmasi/[masalah_id]
 *
 * Proxy ke `GET /api/v1/redesain/ekspor/lembar-konfirmasi/{masalah_id}` (DOCX Lembar
 * Konfirmasi pra-isi).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ masalah_id: string }> },
): Promise<Response> {
  const { masalah_id } = await params;
  return proxyUnduhan(
    `/api/v1/redesain/ekspor/lembar-konfirmasi/${encodeURIComponent(masalah_id)}`,
  );
}
