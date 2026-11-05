/**
 * Pengambilan data layar kasus narasi (jalur BACA: gagal → melempar `ApiError`).
 *
 * INVARIANT: respons gagal tidak pernah diubah menjadi daftar/objek kosong.
 */
import { UKURAN_HALAMAN } from "@/components/pagination";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import type {
  NarasiKasusDetail,
  NarasiKasusRead,
  NarasiRiwayatRead,
  NarasiSumberRingkas,
} from "@/lib/api/schema";
import type { FilterKasus } from "@/lib/narasi-kasus";

/**
 * Ambil satu halaman daftar kasus.
 *
 * @param accessToken - Token akses sesi.
 * @param filter - Filter `status`/`instrument_id`/`periode` aktif.
 * @param offset - Offset halaman.
 * @throws ApiError bila backend menolak atau gagal.
 */
export async function fetchDaftarKasus(
  accessToken: string | undefined,
  filter: FilterKasus,
  offset: number,
): Promise<{ items: NarasiKasusRead[]; total: number }> {
  const res = await withServerAuth(accessToken).GET("/api/v1/narasi/kasus", {
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

/**
 * Ambil detail satu kasus beserta versi terbarunya.
 *
 * @param accessToken - Token akses sesi.
 * @param id - Id kasus.
 * @returns Detail, atau `null` HANYA bila backend menjawab 404 (jawaban sah).
 * @throws ApiError untuk status gagal lain.
 */
export async function fetchKasus(
  accessToken: string | undefined,
  id: string,
): Promise<NarasiKasusDetail | null> {
  const res = await withServerAuth(accessToken).GET("/api/v1/narasi/kasus/{narasi_id}", {
    params: { path: { narasi_id: id } },
  });
  if (res.data) return res.data;
  if (res.response.status === 404) return null;
  throw apiErrorDari(res);
}

/**
 * Ambil riwayat (versi dan event) satu kasus.
 *
 * @param accessToken - Token akses sesi.
 * @param id - Id kasus.
 * @throws ApiError bila gagal (termasuk 404; pemanggil sudah memastikan kasus ada).
 */
export async function fetchRiwayat(
  accessToken: string | undefined,
  id: string,
): Promise<NarasiRiwayatRead> {
  const res = await withServerAuth(accessToken).GET("/api/v1/narasi/kasus/{narasi_id}/riwayat", {
    params: { path: { narasi_id: id } },
  });
  if (!res.data) throw apiErrorDari(res);
  return res.data;
}

/**
 * Ambil SELURUH sumber narasi sebagai pilihan formulir revisi. Data INTI: satu-satunya
 * sumber pilihan, sehingga kegagalan melempar dan tidak pernah menjadi daftar kosong.
 *
 * @param accessToken - Token akses sesi.
 * @throws ApiError bila salah satu halaman gagal.
 */
export async function fetchSemuaSumber(
  accessToken: string | undefined,
): Promise<NarasiSumberRingkas[]> {
  return ambilSemuaHalaman<NarasiSumberRingkas>(async (limit, offset) => {
    const res = await withServerAuth(accessToken).GET("/api/v1/narasi/sumber", {
      params: { query: { limit, offset } },
    });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items, total: res.data.total };
  });
}
