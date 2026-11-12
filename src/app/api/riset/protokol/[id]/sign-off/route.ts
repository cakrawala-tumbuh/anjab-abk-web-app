import { auth } from "@/lib/auth/auth";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

const jsonGalat = (status: number, error: string, message: string) =>
  new Response(JSON.stringify({ error, message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * POST /api/riset/protokol/[id]/sign-off
 *
 * Proxy server-side ke `POST /api/v1/riset/protokol/{protokol_id}/sign-off` backend
 * (bukti sign-off PI/etik: `pi_nama`, `tanggal_persetujuan_etik`, `nomor_persetujuan_etik?`,
 * `lampiran` PDF). Berkas diteruskan sebagai multipart; SENGAJA Route Handler (bukan Server
 * Action) karena batas body Server Action dan agar Bearer tidak pernah sampai ke browser.
 *
 * Token diambil lewat `auth()`. Tanpa sesi → 401 dibalas LANGSUNG tanpa memanggil backend.
 * Status dan envelope galat backend (409 `SIGNOFF_SUDAH_ADA`/`PROTOKOL_BELUM_TERKUNCI`,
 * 413, 422 `LAMPIRAN_*`) diteruskan apa adanya; `X-Request-ID` ikut diteruskan.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  const accessToken = session?.accessToken;
  if (!accessToken) {
    return jsonGalat(401, "unauthorized", "Sesi tidak valid. Silakan masuk kembali.");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonGalat(400, "bad_request", "Isi permintaan bukan formulir multipart yang sah.");
  }

  const { id } = await params;
  const backendRes = await fetch(
    new URL(`/api/v1/riset/protokol/${encodeURIComponent(id)}/sign-off`, config.apiBaseUrlInternal),
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    },
  );

  const headers = new Headers({
    "Content-Type": backendRes.headers.get("content-type") ?? "application/json",
  });
  const requestId = backendRes.headers.get("x-request-id");
  if (requestId) headers.set("X-Request-ID", requestId);
  return new Response(await backendRes.text(), { status: backendRes.status, headers });
}
