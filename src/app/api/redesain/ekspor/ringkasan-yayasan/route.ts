import { proxyUnduhan } from "@/lib/redesain-ekspor-proxy";

export const dynamic = "force-dynamic";

/**
 * GET /api/redesain/ekspor/ringkasan-yayasan?status_penilaian=
 *
 * Proxy ke `GET /api/v1/redesain/ekspor/ringkasan-yayasan` (DOCX agenda/batch). Hanya
 * parameter `status_penilaian` yang diteruskan.
 */
export async function GET(req: Request): Promise<Response> {
  const status = new URL(req.url).searchParams.get("status_penilaian");
  const query = status ? new URLSearchParams({ status_penilaian: status }).toString() : "";
  return proxyUnduhan("/api/v1/redesain/ekspor/ringkasan-yayasan", query);
}
