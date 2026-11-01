/**
 * Pengambilan data halaman Agenda yayasan (jalur BACA: gagal → melempar).
 *
 * INVARIANT: kegagalan apa pun (termasuk 403) melempar `ApiError`; 0 hasil adalah jawaban
 * SAH (belum ada penilaian siap), bukan kegagalan.
 */
import { UKURAN_HALAMAN } from "@/components/pagination";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { MasalahRead, PenilaianRead } from "@/lib/api/schema";

/** Data halaman agenda yayasan. */
export interface DataAgendaYayasan {
  penilaian: PenilaianRead[];
  total: number;
  /** Peta `masalah_id` → masalah (untuk kode & tautan). */
  masalah: Map<string, MasalahRead>;
}

/**
 * Ambil satu halaman agenda (`GET /api/v1/redesain/penilaian/agenda-yayasan`) beserta
 * masalah terkait (`POST .../masalah/search`, `id in`).
 *
 * @param accessToken - Token akses sesi.
 * @param offset - Offset halaman.
 * @returns Penilaian siap telaah, total, dan peta masalah.
 * @throws ApiError bila salah satu panggilan gagal.
 */
export async function fetchAgendaYayasan(
  accessToken: string | undefined,
  offset: number,
): Promise<DataAgendaYayasan> {
  const client = withServerAuth(accessToken);
  const res = await client.GET("/api/v1/redesain/penilaian/agenda-yayasan", {
    params: { query: { limit: UKURAN_HALAMAN, offset } },
  });
  if (!res.data) throw apiErrorDari(res);
  const penilaian = res.data.items;
  const masalah = new Map<string, MasalahRead>();
  if (penilaian.length > 0) {
    const ids = [...new Set(penilaian.map((p) => p.masalah_id))];
    const mres = await client.POST("/api/v1/redesain/masalah/search", {
      body: { domain: [["id", "in", ids]], order: [], limit: ids.length, offset: 0 },
    });
    if (!mres.data) throw apiErrorDari(mres);
    for (const m of mres.data.items) masalah.set(m.id, m);
  }
  return { penilaian, total: res.data.total, masalah };
}
