import { proxyUnduhan } from "@/lib/redesain-ekspor-proxy";

export const dynamic = "force-dynamic";

/**
 * GET /api/redesain/ekspor/register
 *
 * Proxy ke `GET /api/v1/redesain/ekspor/register.xlsx` (register terintegrasi, XLSX 14 sheet).
 * Tanpa parameter; `Content-Type` spreadsheet dan `Content-Disposition`
 * (`register-redesain-<YYYYMMDD>.xlsx`) diteruskan apa adanya oleh {@link proxyUnduhan}.
 */
export async function GET(): Promise<Response> {
  return proxyUnduhan("/api/v1/redesain/ekspor/register.xlsx");
}
