/**
 * Pengambilan data halaman Konteks redesain (jalur BACA: gagal → melempar).
 */
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import type { KonteksRead } from "@/lib/api/schema";

/**
 * Ambil seluruh katalog konteks (`GET /api/v1/redesain/konteks`, semua halaman).
 *
 * @param accessToken - Token akses sesi.
 * @returns Seluruh konteks (aktif maupun nonaktif).
 * @throws ApiError bila panggilan gagal (mis. 403) — tidak pernah daftar kosong.
 */
export async function fetchKonteks(accessToken: string | undefined): Promise<KonteksRead[]> {
  const client = withServerAuth(accessToken);
  return ambilSemuaHalaman<KonteksRead>(async (limit, offset) => {
    const res = await client.GET("/api/v1/redesain/konteks", {
      params: { query: { limit, offset } },
    });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items, total: res.data.total };
  });
}
