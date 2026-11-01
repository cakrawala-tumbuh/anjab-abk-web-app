/**
 * Pengambilan data halaman Sesi partisipasi redesain (jalur BACA: gagal → melempar).
 *
 * INVARIANT: kegagalan apa pun melempar `ApiError`. Daftar sekolah/masalah/konteks adalah
 * satu-satunya sumber label dan pilihan form, jadi diperlakukan sebagai data inti.
 */
import { UKURAN_HALAMAN } from "@/components/pagination";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import type {
  KonteksRead,
  MasalahRead,
  RekapOrangRead,
  SekolahRead,
  SesiRead,
} from "@/lib/api/schema";
import { domainSesi, type FilterSesi } from "@/lib/redesain-sesi";

type Klien = ReturnType<typeof withServerAuth>;

function semuaSekolah(client: Klien) {
  return ambilSemuaHalaman<SekolahRead>(async (limit, offset) => {
    const res = await client.GET("/api/v1/sekolah", { params: { query: { limit, offset } } });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items as SekolahRead[], total: res.data.total };
  });
}

function semuaKonteks(client: Klien) {
  return ambilSemuaHalaman<KonteksRead>(async (limit, offset) => {
    const res = await client.GET("/api/v1/redesain/konteks", {
      params: { query: { limit, offset } },
    });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items, total: res.data.total };
  });
}

function semuaMasalah(client: Klien) {
  return ambilSemuaHalaman<MasalahRead>(async (limit, offset) => {
    const res = await client.GET("/api/v1/redesain/masalah", {
      params: { query: { limit, offset } },
    });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items, total: res.data.total };
  });
}

/** Data halaman index sesi. */
export interface DataIndexSesi {
  sesi: SesiRead[];
  total: number;
  sekolah: SekolahRead[];
}

/**
 * Ambil satu halaman sesi terfilter (`POST .../sesi/search`) beserta sekolah (label nama).
 *
 * @param accessToken - Token akses sesi.
 * @param filter - Filter aktif dari query string.
 * @param offset - Offset halaman.
 * @throws ApiError bila salah satu panggilan gagal.
 */
export async function fetchIndexSesi(
  accessToken: string | undefined,
  filter: FilterSesi,
  offset: number,
): Promise<DataIndexSesi> {
  const client = withServerAuth(accessToken);
  const [res, sekolah] = await Promise.all([
    client.POST("/api/v1/redesain/sesi/search", {
      body: { domain: domainSesi(filter), order: [], limit: UKURAN_HALAMAN, offset },
    }),
    semuaSekolah(client),
  ]);
  if (!res.data) throw apiErrorDari(res);
  return { sesi: res.data.items, total: res.data.total, sekolah };
}

/** Pilihan form sesi. */
export interface OpsiFormSesi {
  sekolah: SekolahRead[];
  masalah: MasalahRead[];
  konteks: KonteksRead[];
}

/**
 * Ambil pilihan form sesi: sekolah master, seluruh masalah, dan konteks (untuk label tema).
 *
 * @param accessToken - Token akses sesi.
 * @throws ApiError bila salah satu panggilan gagal.
 */
export async function fetchOpsiFormSesi(accessToken: string | undefined): Promise<OpsiFormSesi> {
  const client = withServerAuth(accessToken);
  const [sekolah, masalah, konteks] = await Promise.all([
    semuaSekolah(client),
    semuaMasalah(client),
    semuaKonteks(client),
  ]);
  return { sekolah, masalah, konteks };
}

/**
 * Ambil satu sesi (`GET .../sesi/{id}`).
 *
 * @param accessToken - Token akses sesi.
 * @param id - ID baris sesi.
 * @throws ApiError bila gagal (404 dipetakan pemanggil ke notFound).
 */
export async function fetchSesi(accessToken: string | undefined, id: string): Promise<SesiRead> {
  const res = await withServerAuth(accessToken).GET("/api/v1/redesain/sesi/{sesi_id}", {
    params: { path: { sesi_id: id } },
  });
  if (!res.data) throw apiErrorDari(res);
  return res.data;
}

/**
 * Ambil satu halaman rekap per orang (`GET .../sesi/rekap-orang`).
 *
 * @param accessToken - Token akses sesi.
 * @param offset - Offset halaman.
 * @throws ApiError bila gagal (termasuk 403).
 */
export async function fetchRekapOrang(
  accessToken: string | undefined,
  offset: number,
): Promise<{ items: RekapOrangRead[]; total: number }> {
  const res = await withServerAuth(accessToken).GET("/api/v1/redesain/sesi/rekap-orang", {
    params: { query: { limit: UKURAN_HALAMAN, offset } },
  });
  if (!res.data) throw apiErrorDari(res);
  return { items: res.data.items, total: res.data.total };
}
