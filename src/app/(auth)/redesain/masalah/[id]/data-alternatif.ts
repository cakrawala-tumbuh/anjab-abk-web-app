/**
 * Pengambilan data alternatif detail masalah redesain (jalur BACA: gagal → melempar).
 */
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import type { AlternatifRead, JabatanRead } from "@/lib/api/schema";

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
