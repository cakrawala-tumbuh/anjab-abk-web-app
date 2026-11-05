/**
 * Pengambilan data layar antrean narasi (jalur BACA: gagal → melempar `ApiError`).
 *
 * INVARIANT: respons gagal tidak pernah diubah menjadi daftar kosong. Urutan baris adalah
 * urutan backend (`updated_at` naik); klien tidak mengurutkan ulang.
 */
import { UKURAN_HALAMAN } from "@/components/pagination";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { AntreanItemRead } from "@/lib/api/schema";
import type { FilterAntrean } from "@/lib/narasi-antrean";

/**
 * Ambil satu halaman antrean reviewer.
 *
 * @param accessToken - Token akses sesi.
 * @param filter - Filter `status`/`instrument_id`/`periode` aktif.
 * @param offset - Offset halaman.
 * @returns Baris halaman ini dan total menurut backend.
 * @throws ApiError bila backend menolak atau gagal.
 */
export async function fetchAntrean(
  accessToken: string | undefined,
  filter: FilterAntrean,
  offset: number,
): Promise<{ items: AntreanItemRead[]; total: number }> {
  const res = await withServerAuth(accessToken).GET("/api/v1/narasi/antrean", {
    params: {
      query: {
        limit: UKURAN_HALAMAN,
        offset,
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.instrument_id ? { instrument_id: filter.instrument_id } : {}),
        ...(filter.periode ? { periode: filter.periode } : {}),
      },
    },
  });
  if (!res.data) throw apiErrorDari(res);
  return { items: res.data.items, total: res.data.total };
}
