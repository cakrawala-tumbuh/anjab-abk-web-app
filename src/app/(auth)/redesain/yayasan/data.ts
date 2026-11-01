/**
 * Pengambilan data halaman Ringkasan Yayasan (jalur BACA: gagal → melempar).
 *
 * INVARIANT: kegagalan apa pun (termasuk 403) melempar `ApiError`; 0 baris adalah jawaban
 * SAH (belum ada masalah), bukan kegagalan. Konteks diambil hanya untuk opsi filter dan
 * diperlakukan sebagai data inti.
 */
import { UKURAN_HALAMAN } from "@/components/pagination";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { KonteksRead, RingkasanYayasanRow } from "@/lib/api/schema";
import { domainYayasan, type FilterYayasan } from "@/lib/redesain-yayasan";
import { semuaKonteks } from "../masalah/data";

/** Data halaman index ringkasan yayasan. */
export interface DataIndexYayasan {
  baris: RingkasanYayasanRow[];
  total: number;
  konteks: KonteksRead[];
}

/**
 * Ambil satu halaman ringkasan yayasan terfilter (`POST .../redesain/yayasan/search`)
 * beserta konteks untuk opsi filter.
 *
 * @param accessToken - Token akses sesi.
 * @param filter - Filter aktif dari query string.
 * @param offset - Offset halaman (`UKURAN_HALAMAN` baris per halaman).
 * @throws ApiError bila salah satu panggilan gagal.
 */
export async function fetchIndexYayasan(
  accessToken: string | undefined,
  filter: FilterYayasan,
  offset: number,
): Promise<DataIndexYayasan> {
  const client = withServerAuth(accessToken);
  const [res, konteks] = await Promise.all([
    client.POST("/api/v1/redesain/yayasan/search", {
      body: { domain: domainYayasan(filter), order: [], limit: UKURAN_HALAMAN, offset },
    }),
    semuaKonteks(client),
  ]);
  if (!res.data) throw apiErrorDari(res);
  return { baris: res.data.items, total: res.data.total, konteks };
}

/**
 * Ambil satu baris ringkasan (`GET .../redesain/yayasan/{masalah_id}`).
 *
 * @param accessToken - Token akses sesi.
 * @param masalahId - ID masalah.
 * @throws ApiError bila gagal (404 untuk id tak dikenal; pemanggil memetakan ke notFound).
 */
export async function fetchDetailYayasan(
  accessToken: string | undefined,
  masalahId: string,
): Promise<RingkasanYayasanRow> {
  const res = await withServerAuth(accessToken).GET("/api/v1/redesain/yayasan/{masalah_id}", {
    params: { path: { masalah_id: masalahId } },
  });
  if (!res.data) throw apiErrorDari(res);
  return res.data;
}
