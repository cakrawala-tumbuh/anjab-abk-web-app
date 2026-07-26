import { auth } from "@/lib/auth/auth";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * POST /api/backup/pulihkan
 *
 * Proxy server-side ke `POST /api/v1/system/restore` backend.
 *
 * Menerima `FormData` (berkas dump `.dump` + field teks `konfirmasi`) langsung dari
 * browser lewat Route Handler — SENGAJA bukan Server Action, karena batas body Server
 * Action Next.js (1 MB default) jauh di bawah ukuran dump basis data; Route Handler
 * menerima `FormData` streaming tanpa batas itu. Access token diambil lewat `auth()`
 * dan disisipkan sebagai `Authorization: Bearer` — tidak pernah diteruskan dari klien.
 *
 * Tanpa sesi/token → 401 dibalas LANGSUNG di sini, TANPA meneruskan permintaan ke
 * backend sama sekali.
 */
export async function POST(request: Request): Promise<Response> {
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

  const formData = await request.formData();

  const backendRes = await fetch(new URL("/api/v1/system/restore", config.apiBaseUrlInternal), {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  const body = await backendRes.text();
  return new Response(body, {
    status: backendRes.status,
    headers: { "Content-Type": backendRes.headers.get("content-type") ?? "application/json" },
  });
}
