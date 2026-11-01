/**
 * Pengambilan data bagian Konfirmasi pada detail masalah (jalur BACA: gagal → melempar).
 *
 * INVARIANT: kegagalan (termasuk 403) melempar `ApiError`; 0 hasil adalah jawaban SAH.
 */
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import type { KonfirmasiDaftarRead, KonteksRead } from "@/lib/api/schema";
import { domainKonfirmasiMasalah } from "@/lib/redesain-konfirmasi-tim";
import { semuaKonteks } from "../data";

/**
 * Ambil seluruh konfirmasi satu masalah, termasuk versi digantikan
 * (`POST /api/v1/redesain/konfirmasi/search`, `masalah_id`).
 *
 * @param accessToken - Token akses sesi.
 * @param masalahId - ID masalah.
 * @throws ApiError bila pencarian gagal (mis. 403).
 */
export async function fetchKonfirmasiMasalah(
  accessToken: string | undefined,
  masalahId: string,
): Promise<KonfirmasiDaftarRead[]> {
  const client = withServerAuth(accessToken);
  return ambilSemuaHalaman<KonfirmasiDaftarRead>(async (limit, offset) => {
    const res = await client.POST("/api/v1/redesain/konfirmasi/search", {
      body: { domain: domainKonfirmasiMasalah(masalahId), order: [], limit, offset },
    });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items, total: res.data.total };
  });
}

/**
 * Ambil seluruh konteks untuk pilihan dialog angkat masalah.
 *
 * @param accessToken - Token akses sesi.
 * @throws ApiError bila gagal.
 */
export function fetchKonteksPilihan(accessToken: string | undefined): Promise<KonteksRead[]> {
  return semuaKonteks(withServerAuth(accessToken));
}
