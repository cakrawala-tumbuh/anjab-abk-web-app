/**
 * Pengambilan data layar riset (jalur BACA: gagal → melempar `ApiError`).
 *
 * INVARIANT: respons gagal tidak pernah diubah menjadi daftar/objek kosong.
 */
import { UKURAN_HALAMAN } from "@/components/pagination";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import type {
  RisetKasusNegatifRead,
  RisetProtokolRead,
  RisetProtokolRingkas,
  RisetStatistikRead,
  SignoffRead,
  StatusProtokol,
} from "@/lib/api/schema";

/**
 * Ambil satu halaman daftar protokol (item ringkas, tanpa `isi`).
 *
 * @param accessToken - Token akses sesi.
 * @param status - Filter status, `null` = semua.
 * @param offset - Offset halaman.
 * @throws ApiError bila backend menolak atau gagal.
 */
export async function fetchDaftarProtokol(
  accessToken: string | undefined,
  status: StatusProtokol | null,
  offset: number,
): Promise<{ items: RisetProtokolRingkas[]; total: number }> {
  const res = await withServerAuth(accessToken).GET("/api/v1/riset/protokol", {
    params: { query: { limit: UKURAN_HALAMAN, offset, ...(status ? { status } : {}) } },
  });
  if (!res.data) throw apiErrorDari(res);
  return { items: res.data.items, total: res.data.total };
}

/**
 * Ambil satu protokol lengkap (dengan `isi`).
 *
 * @param accessToken - Token akses sesi.
 * @param id - ID protokol.
 * @returns Protokol, atau `null` HANYA bila backend menjawab 404 (jawaban sah).
 * @throws ApiError untuk status gagal lain.
 */
export async function fetchProtokol(
  accessToken: string | undefined,
  id: string,
): Promise<RisetProtokolRead | null> {
  const res = await withServerAuth(accessToken).GET("/api/v1/riset/protokol/{protokol_id}", {
    params: { path: { protokol_id: id } },
  });
  if (res.data) return res.data;
  if (res.response.status === 404) return null;
  throw apiErrorDari(res);
}

/**
 * Ambil SELURUH statistik satu protokol (data inti; gagal melempar).
 *
 * @param accessToken - Token akses sesi.
 * @param protokolId - ID protokol.
 * @throws ApiError bila salah satu halaman gagal.
 */
export async function fetchStatistik(
  accessToken: string | undefined,
  protokolId: string,
): Promise<RisetStatistikRead[]> {
  const klien = withServerAuth(accessToken);
  return ambilSemuaHalaman<RisetStatistikRead>(async (limit, offset) => {
    const res = await klien.GET("/api/v1/riset/protokol/{protokol_id}/statistik", {
      params: { path: { protokol_id: protokolId }, query: { limit, offset } },
    });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items, total: res.data.total };
  });
}

/**
 * Ambil SELURUH kasus negatif satu protokol (data inti; gagal melempar).
 *
 * @param accessToken - Token akses sesi.
 * @param protokolId - ID protokol.
 * @throws ApiError bila salah satu halaman gagal.
 */
export async function fetchKasusNegatif(
  accessToken: string | undefined,
  protokolId: string,
): Promise<RisetKasusNegatifRead[]> {
  const klien = withServerAuth(accessToken);
  return ambilSemuaHalaman<RisetKasusNegatifRead>(async (limit, offset) => {
    const res = await klien.GET("/api/v1/riset/protokol/{protokol_id}/kasus-negatif", {
      params: { path: { protokol_id: protokolId }, query: { limit, offset } },
    });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items, total: res.data.total };
  });
}

/**
 * Ambil metadata sign-off PI/etik satu protokol. Dipanggil HANYA bila `signoff_ada=true`;
 * pada keadaan itu metadata adalah data inti, jadi SEMUA kegagalan (termasuk 404) melempar.
 *
 * @param accessToken - Token akses sesi.
 * @param protokolId - ID protokol.
 * @returns Metadata sign-off (tanpa byte berkas).
 * @throws ApiError bila backend menolak atau gagal.
 */
export async function fetchSignoff(
  accessToken: string | undefined,
  protokolId: string,
): Promise<SignoffRead> {
  const res = await withServerAuth(accessToken).GET(
    "/api/v1/riset/protokol/{protokol_id}/sign-off",
    { params: { path: { protokol_id: protokolId } } },
  );
  if (!res.data) throw apiErrorDari(res);
  return res.data;
}
