import { auth } from "@/lib/auth/auth";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * POST /api/backup/unduh
 *
 * Proxy server-side ke `POST /api/v1/system/backup` backend.
 *
 * Access token Auth.js hidup di cookie httpOnly dan TIDAK PERNAH boleh sampai ke
 * browser (`src/lib/api/client.ts`) — route ini yang mengambilnya lewat `auth()`,
 * menyisipkannya sebagai `Authorization: Bearer`, lalu MENGALIRKAN (stream) respons
 * backend apa adanya, termasuk header `Content-Type` dan `Content-Disposition`,
 * sehingga browser mengunduh dump dengan nama berkas yang ditentukan backend.
 *
 * Tanpa sesi/token → 401 dibalas LANGSUNG di sini, TANPA meneruskan permintaan ke
 * backend sama sekali.
 */
export async function POST(): Promise<Response> {
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

  const backendRes = await fetch(new URL("/api/v1/system/backup", config.apiBaseUrlInternal), {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const headers = new Headers();
  const contentType = backendRes.headers.get("content-type");
  const contentDisposition = backendRes.headers.get("content-disposition");
  if (contentType) headers.set("Content-Type", contentType);
  if (contentDisposition) headers.set("Content-Disposition", contentDisposition);

  return new Response(backendRes.body, {
    status: backendRes.status,
    headers,
  });
}
