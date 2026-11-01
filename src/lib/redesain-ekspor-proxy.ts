import { auth } from "@/lib/auth/auth";
import { config } from "@/lib/config";

/**
 * Proxy server-side unduhan biner ekspor redesain (DOCX) ke backend.
 *
 * Access token Auth.js tidak boleh sampai ke browser, jadi route handler memanggil ini:
 * token diambil lewat `auth()`, disisipkan sebagai `Authorization: Bearer`, dan respons
 * backend DIALIRKAN apa adanya — body, status (termasuk gagal), `Content-Type`, dan
 * `Content-Disposition`. Ini satu-satunya `fetch` non-`openapi-fetch` untuk redesain
 * (preseden `src/app/api/backup/unduh/route.ts`).
 *
 * @param pathBackend - Path backend, mis. `/api/v1/redesain/ekspor/ringkasan-yayasan`.
 * @param query - Query string tambahan (tanpa `?`) atau kosong.
 * @returns Respons backend yang dialirkan; 401 LANGSUNG bila tanpa sesi (backend tidak dipanggil).
 */
export async function proxyUnduhan(pathBackend: string, query = ""): Promise<Response> {
  const session = await auth();
  const accessToken = session?.accessToken;
  if (!accessToken) {
    return new Response(
      JSON.stringify({
        error: "unauthorized",
        message: "Sesi tidak valid. Silakan masuk kembali.",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }
  const url = new URL(pathBackend, config.apiBaseUrlInternal);
  if (query) url.search = query;
  const backendRes = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const headers = new Headers();
  const contentType = backendRes.headers.get("content-type");
  const contentDisposition = backendRes.headers.get("content-disposition");
  if (contentType) headers.set("Content-Type", contentType);
  if (contentDisposition) headers.set("Content-Disposition", contentDisposition);
  return new Response(backendRes.body, { status: backendRes.status, headers });
}
