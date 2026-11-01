/**
 * Pengambilan data halaman register Masalah redesain (jalur BACA: gagal → melempar).
 *
 * INVARIANT: kegagalan apa pun melempar `ApiError`. Daftar konteks/sekolah/uraian tugas
 * adalah satu-satunya sumber label dan pilihan formulir, jadi diperlakukan sebagai data
 * inti — bukan `?? []`.
 */
import { UKURAN_HALAMAN } from "@/components/pagination";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import type { KonteksRead, MasalahRead, SekolahRead, UraianTugasRead } from "@/lib/api/schema";
import { domainMasalah, type FilterMasalah } from "@/lib/redesain-register";

type Klien = ReturnType<typeof withServerAuth>;

export function semuaKonteks(client: Klien) {
  return ambilSemuaHalaman<KonteksRead>(async (limit, offset) => {
    const res = await client.GET("/api/v1/redesain/konteks", {
      params: { query: { limit, offset } },
    });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items, total: res.data.total };
  });
}

export function semuaSekolah(client: Klien) {
  return ambilSemuaHalaman<SekolahRead>(async (limit, offset) => {
    const res = await client.GET("/api/v1/sekolah", { params: { query: { limit, offset } } });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items as SekolahRead[], total: res.data.total };
  });
}

/** Data halaman index register masalah. */
export interface DataIndexMasalah {
  masalah: MasalahRead[];
  total: number;
  konteks: KonteksRead[];
  sekolah: SekolahRead[];
}

/**
 * Ambil satu halaman masalah terfilter (`POST .../masalah/search`) beserta konteks dan
 * sekolah untuk label dan opsi filter.
 *
 * @param accessToken - Token akses sesi.
 * @param filter - Filter aktif dari query string.
 * @param offset - Offset halaman (`UKURAN_HALAMAN` baris per halaman).
 * @throws ApiError bila salah satu panggilan gagal.
 */
export async function fetchIndexMasalah(
  accessToken: string | undefined,
  filter: FilterMasalah,
  offset: number,
): Promise<DataIndexMasalah> {
  const client = withServerAuth(accessToken);
  const [res, konteks, sekolah] = await Promise.all([
    client.POST("/api/v1/redesain/masalah/search", {
      body: { domain: domainMasalah(filter), order: [], limit: UKURAN_HALAMAN, offset },
    }),
    semuaKonteks(client),
    semuaSekolah(client),
  ]);
  if (!res.data) throw apiErrorDari(res);
  return { masalah: res.data.items, total: res.data.total, konteks, sekolah };
}

/** Pilihan untuk form masalah. */
export interface OpsiFormMasalah {
  konteks: KonteksRead[];
  sekolah: SekolahRead[];
  uraianTugas: UraianTugasRead[];
}

/**
 * Ambil seluruh pilihan form masalah: konteks, sekolah master, dan uraian tugas katalog.
 *
 * @param accessToken - Token akses sesi.
 * @throws ApiError bila salah satu panggilan gagal.
 */
export async function fetchOpsiFormMasalah(
  accessToken: string | undefined,
): Promise<OpsiFormMasalah> {
  const client = withServerAuth(accessToken);
  const [konteks, sekolah, uraianTugas] = await Promise.all([
    semuaKonteks(client),
    semuaSekolah(client),
    ambilSemuaHalaman<UraianTugasRead>(async (limit, offset) => {
      const res = await client.GET("/api/v1/task-inventory/uraian-tugas", {
        params: { query: { limit, offset } },
      });
      if (!res.data) throw apiErrorDari(res);
      return { items: res.data.items as UraianTugasRead[], total: res.data.total };
    }),
  ]);
  return { konteks, sekolah, uraianTugas };
}

/**
 * Ambil satu masalah (`GET .../masalah/{id}`).
 *
 * @param accessToken - Token akses sesi.
 * @param id - ID masalah.
 * @throws ApiError bila gagal (404 untuk id tak dikenal; pemanggil memetakan ke notFound).
 */
export async function fetchMasalah(
  accessToken: string | undefined,
  id: string,
): Promise<MasalahRead> {
  const res = await withServerAuth(accessToken).GET("/api/v1/redesain/masalah/{masalah_id}", {
    params: { path: { masalah_id: id } },
  });
  if (!res.data) throw apiErrorDari(res);
  return res.data;
}
