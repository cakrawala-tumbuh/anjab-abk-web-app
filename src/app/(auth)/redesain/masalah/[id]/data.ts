/**
 * Pengambilan data halaman detail masalah redesain (jalur BACA: gagal → melempar).
 *
 * INVARIANT: kegagalan apa pun (termasuk `GET /proses/{id}` 403) melempar `ApiError`;
 * tidak ada `?? []` yang menelan kegagalan menjadi kekosongan.
 */
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import type { KoreksiRead, LangkahRead, ProsesRead } from "@/lib/api/schema";
import { urutkanKoreksi, urutkanLangkah } from "@/lib/redesain-alur";

/** Satu langkah beserta koreksinya (terurut `waktu`). */
export interface LangkahDenganKoreksi {
  langkah: LangkahRead;
  koreksi: KoreksiRead[];
}

/** Satu proses beserta langkah-langkahnya (terurut `urutan`). */
export interface ProsesDenganLangkah {
  proses: ProsesRead;
  langkah: LangkahDenganKoreksi[];
}

/**
 * Ambil seluruh proses sebuah masalah beserta langkah dan koreksinya.
 *
 * Alur: `POST .../proses/search` (`masalah_id`) → untuk tiap proses `GET .../proses/{id}`
 * (memuat `langkah`) → untuk tiap langkah `GET .../langkah/{id}/koreksi`.
 *
 * @param accessToken - Token akses sesi.
 * @param masalahId - ID masalah.
 * @returns Proses (urutan respons search) dengan langkah terurut `urutan`.
 * @throws ApiError bila salah satu panggilan gagal.
 */
export async function fetchAlurMasalah(
  accessToken: string | undefined,
  masalahId: string,
): Promise<ProsesDenganLangkah[]> {
  const client = withServerAuth(accessToken);
  const daftar = await ambilSemuaHalaman<ProsesRead>(async (limit, offset) => {
    const res = await client.POST("/api/v1/redesain/proses/search", {
      body: { domain: [["masalah_id", "=", masalahId]], order: [], limit, offset },
    });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items, total: res.data.total };
  });
  return Promise.all(
    daftar.map(async (p) => {
      const det = await client.GET("/api/v1/redesain/proses/{proses_id}", {
        params: { path: { proses_id: p.id } },
      });
      if (!det.data) throw apiErrorDari(det);
      const proses = det.data;
      const langkah = await Promise.all(
        urutkanLangkah(proses.langkah).map(async (l) => ({
          langkah: l,
          koreksi: urutkanKoreksi(await fetchKoreksi(accessToken, l.id)),
        })),
      );
      return { proses, langkah };
    }),
  );
}

/**
 * Ambil seluruh koreksi sebuah langkah (`GET .../langkah/{id}/koreksi`).
 *
 * @param accessToken - Token akses sesi.
 * @param langkahId - ID langkah.
 * @throws ApiError bila gagal.
 */
export function fetchKoreksi(
  accessToken: string | undefined,
  langkahId: string,
): Promise<KoreksiRead[]> {
  const client = withServerAuth(accessToken);
  return ambilSemuaHalaman<KoreksiRead>(async (limit, offset) => {
    const res = await client.GET("/api/v1/redesain/langkah/{langkah_id}/koreksi", {
      params: { path: { langkah_id: langkahId }, query: { limit, offset } },
    });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items, total: res.data.total };
  });
}
