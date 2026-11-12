/**
 * Pengambilan data layar klarifikasi (jalur BACA: gagal → melempar `ApiError`).
 *
 * INVARIANT: respons gagal tidak pernah diubah menjadi daftar/objek kosong. Satu-satunya
 * jawaban sah yang tidak dilempar: 404 pada detail.
 */
import { UKURAN_HALAMAN } from "@/components/pagination";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { KlarifikasiDetail, KlarifikasiRead } from "@/lib/api/schema";
import type { FilterKlarifikasi } from "@/lib/narasi-klarifikasi";

/**
 * Ambil satu halaman register klarifikasi (terbaru dulu, urutan milik backend).
 *
 * @param accessToken - Token akses sesi.
 * @param filter - Filter `disposition`/`narasi_id` aktif.
 * @param offset - Offset halaman.
 * @returns Baris halaman ini dan total menurut backend.
 * @throws ApiError bila backend menolak atau gagal.
 */
export async function fetchDaftarKlarifikasi(
  accessToken: string | undefined,
  filter: FilterKlarifikasi,
  offset: number,
): Promise<{ items: KlarifikasiRead[]; total: number }> {
  const res = await withServerAuth(accessToken).GET("/api/v1/narasi/klarifikasi", {
    params: {
      query: {
        limit: UKURAN_HALAMAN,
        offset,
        ...(filter.disposition ? { disposition: filter.disposition } : {}),
        ...(filter.narasi_id ? { narasi_id: filter.narasi_id } : {}),
      },
    },
  });
  if (!res.data) throw apiErrorDari(res);
  return { items: res.data.items, total: res.data.total };
}

/**
 * Ambil detail satu klarifikasi beserta riwayatnya.
 *
 * @param accessToken - Token akses sesi.
 * @param id - Id klarifikasi.
 * @returns Detail, atau `null` HANYA bila backend menjawab 404.
 * @throws ApiError untuk kegagalan lain.
 */
export async function fetchKlarifikasi(
  accessToken: string | undefined,
  id: string,
): Promise<KlarifikasiDetail | null> {
  const res = await withServerAuth(accessToken).GET("/api/v1/narasi/klarifikasi/{klarifikasi_id}", {
    params: { path: { klarifikasi_id: id } },
  });
  if (res.data) return res.data;
  if (res.response.status === 404) return null;
  throw apiErrorDari(res);
}
