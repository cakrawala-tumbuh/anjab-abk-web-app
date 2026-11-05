/**
 * Pengambilan data layar sumber narasi (jalur BACA: gagal → melempar `ApiError`).
 *
 * INVARIANT: respons gagal tidak pernah diubah menjadi daftar/objek kosong.
 */
import { UKURAN_HALAMAN } from "@/components/pagination";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { NarasiSumberRead, NarasiSumberRingkas } from "@/lib/api/schema";
import type { FilterSumber } from "@/lib/narasi-sumber";

/**
 * Ambil satu halaman daftar sumber (item ringkas, tanpa `teks`).
 *
 * @param accessToken - Token akses sesi.
 * @param filter - Filter `jenis`/`periode` aktif.
 * @param offset - Offset halaman.
 * @throws ApiError bila backend menolak atau gagal.
 */
export async function fetchDaftarSumber(
  accessToken: string | undefined,
  filter: FilterSumber,
  offset: number,
): Promise<{ items: NarasiSumberRingkas[]; total: number }> {
  const res = await withServerAuth(accessToken).GET("/api/v1/narasi/sumber", {
    params: {
      query: {
        limit: UKURAN_HALAMAN,
        offset,
        ...(filter.jenis ? { jenis: filter.jenis } : {}),
        ...(filter.periode ? { periode: filter.periode } : {}),
      },
    },
  });
  if (!res.data) throw apiErrorDari(res);
  return { items: res.data.items, total: res.data.total };
}

/**
 * Ambil satu sumber lengkap (dengan `teks`).
 *
 * @param accessToken - Token akses sesi.
 * @param id - Source_ID.
 * @returns Sumber, atau `null` HANYA bila backend menjawab 404 (jawaban sah, bukan kegagalan).
 * @throws ApiError untuk status gagal lain.
 */
export async function fetchSumber(
  accessToken: string | undefined,
  id: string,
): Promise<NarasiSumberRead | null> {
  const res = await withServerAuth(accessToken).GET("/api/v1/narasi/sumber/{sumber_id}", {
    params: { path: { sumber_id: id } },
  });
  if (res.data) return res.data;
  if (res.response.status === 404) return null;
  throw apiErrorDari(res);
}
