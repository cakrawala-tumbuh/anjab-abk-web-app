/**
 * Pengambilan data alternatif detail masalah redesain (jalur BACA: gagal → melempar).
 */
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import { fiturAktif } from "@/lib/fitur";
import type {
  AlternatifRead,
  JabatanRead,
  KeputusanPerubahanRead,
  KesiapanMatriksRead,
  PenerimaRead,
} from "@/lib/api/schema";

/**
 * Ambil seluruh alternatif sebuah masalah (`POST /api/v1/redesain/alternatif/search`).
 *
 * @param accessToken - Token akses sesi.
 * @param masalahId - ID masalah.
 * @returns Seluruh alternatif (semua halaman).
 * @throws ApiError bila pencarian gagal (mis. 403).
 */
export function fetchAlternatifMasalah(
  accessToken: string | undefined,
  masalahId: string,
): Promise<AlternatifRead[]> {
  const client = withServerAuth(accessToken);
  return ambilSemuaHalaman<AlternatifRead>(async (limit, offset) => {
    const res = await client.POST("/api/v1/redesain/alternatif/search", {
      body: { domain: [["masalah_id", "=", masalahId]], order: [], limit, offset },
    });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items, total: res.data.total };
  });
}

/**
 * Ambil seluruh master jabatan (sumber pilihan dan label pihak asal/penerima).
 *
 * @param accessToken - Token akses sesi.
 * @throws ApiError bila gagal; daftar ini satu-satunya sumber pilihan form.
 */
export function fetchJabatanAlternatif(accessToken: string | undefined): Promise<JabatanRead[]> {
  const client = withServerAuth(accessToken);
  return ambilSemuaHalaman<JabatanRead>(async (limit, offset) => {
    const res = await client.GET("/api/v1/jabatan", { params: { query: { limit, offset } } });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items as JabatanRead[], total: res.data.total };
  });
}

/**
 * Ambil daftar penerima sebuah alternatif (`GET .../alternatif/{id}/penerima`).
 *
 * @param accessToken - Token akses sesi.
 * @param alternatifId - ID alternatif.
 * @throws ApiError bila gagal (data inti: tidak pernah menjadi daftar kosong).
 */
export async function fetchPenerima(
  accessToken: string | undefined,
  alternatifId: string,
): Promise<PenerimaRead[]> {
  const res = await withServerAuth(accessToken).GET(
    "/api/v1/redesain/alternatif/{alternatif_id}/penerima",
    { params: { path: { alternatif_id: alternatifId } } },
  );
  if (!res.data) throw apiErrorDari(res);
  return res.data;
}

/**
 * Ambil matriks kesiapan Option×Penerima pada satu periode
 * (`GET .../alternatif/{id}/kesiapan?periode=`).
 *
 * @param accessToken - Token akses sesi.
 * @param alternatifId - ID alternatif.
 * @param periode - Periode `YYYY/YY`.
 * @throws ApiError bila gagal (data inti: gagal melempar, bukan tabel kosong).
 */
export async function fetchMatriksKesiapan(
  accessToken: string | undefined,
  alternatifId: string,
  periode: string,
): Promise<KesiapanMatriksRead> {
  const res = await withServerAuth(accessToken).GET(
    "/api/v1/redesain/alternatif/{alternatif_id}/kesiapan",
    { params: { path: { alternatif_id: alternatifId }, query: { periode } } },
  );
  if (!res.data) throw apiErrorDari(res);
  return res.data;
}

/**
 * Ambil riwayat keputusan perubahan sebuah alternatif pada satu periode.
 *
 * @param accessToken - Token akses sesi.
 * @param alternatifId - ID alternatif.
 * @param periode - Periode `YYYY/YY`.
 * @throws ApiError bila gagal.
 */
export async function fetchKeputusanPerubahan(
  accessToken: string | undefined,
  alternatifId: string,
  periode: string,
): Promise<KeputusanPerubahanRead[]> {
  const res = await withServerAuth(accessToken).GET(
    "/api/v1/redesain/alternatif/{alternatif_id}/keputusan-perubahan",
    { params: { path: { alternatif_id: alternatifId }, query: { periode } } },
  );
  if (!res.data) throw apiErrorDari(res);
  return res.data;
}

/**
 * Apakah saklar `CHANGE_AUTHORIZATION` hidup (kegagalan membaca saklar dilempar).
 *
 * @param accessToken - Token akses sesi.
 */
export function fetchSaklarPerubahan(accessToken: string | undefined): Promise<boolean> {
  return fiturAktif(withServerAuth(accessToken), "CHANGE_AUTHORIZATION");
}
