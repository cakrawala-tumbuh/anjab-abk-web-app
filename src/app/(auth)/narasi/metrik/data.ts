/**
 * Pengambilan data panel metrik alur narasi (jalur BACA: gagal → melempar `ApiError`).
 *
 * INVARIANT: respons gagal (401/403/422/5xx) tidak pernah diubah menjadi metrik kosong atau nol.
 */
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { MetrikNarasiRead } from "@/lib/api/schema";
import type { FilterMetrik } from "@/lib/narasi-metrik";

/**
 * Ambil metrik agregat alur narasi pada rentang tanggal.
 *
 * @param accessToken - Token akses sesi.
 * @param filter - Rentang tanggal (sudah divalidasi pemanggil) dan jenis narasi opsional.
 * @returns Metrik agregat dari backend.
 * @throws ApiError bila backend menolak atau gagal.
 */
export async function fetchMetrikNarasi(
  accessToken: string | undefined,
  filter: FilterMetrik,
): Promise<MetrikNarasiRead> {
  const res = await withServerAuth(accessToken).GET("/api/v1/narasi/metrik", {
    params: {
      query: {
        dari: filter.dari,
        sampai: filter.sampai,
        ...(filter.narrative_kind ? { narrative_kind: filter.narrative_kind } : {}),
      },
    },
  });
  if (!res.data) throw apiErrorDari(res);
  return res.data;
}
