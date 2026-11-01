/**
 * Pengambilan data bukti detail masalah redesain (jalur BACA: gagal → melempar).
 */
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import type { BuktiRead, LangkahRead, ProsesRead } from "@/lib/api/schema";
import { urutkanLangkah } from "@/lib/redesain-alur";

/**
 * Ambil seluruh bukti sebuah masalah (`POST /api/v1/redesain/bukti/search`, `masalah_id`).
 *
 * @param accessToken - Token akses sesi.
 * @param masalahId - ID masalah.
 * @returns Seluruh bukti (semua halaman).
 * @throws ApiError bila pencarian gagal (mis. 403).
 */
export function fetchBuktiMasalah(
  accessToken: string | undefined,
  masalahId: string,
): Promise<BuktiRead[]> {
  const client = withServerAuth(accessToken);
  return ambilSemuaHalaman<BuktiRead>(async (limit, offset) => {
    const res = await client.POST("/api/v1/redesain/bukti/search", {
      body: { domain: [["masalah_id", "=", masalahId]], order: [], limit, offset },
    });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items, total: res.data.total };
  });
}

/**
 * Ambil langkah dari seluruh proses sebuah masalah (tanpa koreksi), terurut per proses
 * lalu `urutan` — sumber pilihan langkah pada form bukti.
 *
 * @param accessToken - Token akses sesi.
 * @param masalahId - ID masalah.
 * @throws ApiError bila salah satu panggilan gagal.
 */
export async function fetchLangkahMasalah(
  accessToken: string | undefined,
  masalahId: string,
): Promise<LangkahRead[]> {
  const client = withServerAuth(accessToken);
  const proses = await ambilSemuaHalaman<ProsesRead>(async (limit, offset) => {
    const res = await client.POST("/api/v1/redesain/proses/search", {
      body: { domain: [["masalah_id", "=", masalahId]], order: [], limit, offset },
    });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items, total: res.data.total };
  });
  const detail = await Promise.all(
    proses.map(async (p) => {
      const det = await client.GET("/api/v1/redesain/proses/{proses_id}", {
        params: { path: { proses_id: p.id } },
      });
      if (!det.data) throw apiErrorDari(det);
      return urutkanLangkah(det.data.langkah);
    }),
  );
  return detail.flat();
}
