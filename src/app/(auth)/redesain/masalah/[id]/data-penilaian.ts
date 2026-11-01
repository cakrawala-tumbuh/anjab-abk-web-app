/**
 * Pengambilan data bagian Penilaian pada detail masalah (jalur BACA: gagal → melempar).
 *
 * INVARIANT: kegagalan (termasuk 403) melempar `ApiError`; 0 hasil adalah jawaban SAH
 * (belum ada penilaian), bukan kegagalan.
 */
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { PenilaianRead } from "@/lib/api/schema";

/**
 * Ambil penilaian satu masalah (`POST /api/v1/redesain/penilaian/search`, `masalah_id`).
 *
 * @param accessToken - Token akses sesi.
 * @param masalahId - ID masalah.
 * @returns Penilaian, atau `null` bila belum ada (0 hasil).
 * @throws ApiError bila pencarian gagal.
 */
export async function fetchPenilaianMasalah(
  accessToken: string | undefined,
  masalahId: string,
): Promise<PenilaianRead | null> {
  const res = await withServerAuth(accessToken).POST("/api/v1/redesain/penilaian/search", {
    body: { domain: [["masalah_id", "=", masalahId]], order: [], limit: 2, offset: 0 },
  });
  if (!res.data) throw apiErrorDari(res);
  return res.data.items[0] ?? null;
}
