/**
 * Pengambilan data layar Usulan AI (jalur BACA: gagal → melempar `ApiError`).
 *
 * INVARIANT: respons gagal tidak pernah diubah menjadi daftar/objek kosong. Satu-satunya
 * jawaban sah yang tidak dilempar: 404 pada detail.
 */
import { UKURAN_HALAMAN } from "@/components/pagination";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import type { AiUsulanRead, AiUsulanRingkas, KonteksRead } from "@/lib/api/schema";
import { domainUsulan, type FilterUsulan } from "@/lib/ai-usulan";

/**
 * Ambil satu halaman usulan (terbaru dulu) lewat `POST /api/v1/ai/usulan/search`.
 *
 * @param accessToken - Token akses sesi.
 * @param filter - Filter `fungsi`/`sasaran_jenis`.
 * @param offset - Offset halaman.
 * @returns Baris halaman ini dan total menurut backend.
 * @throws ApiError bila backend menolak atau gagal.
 */
export async function fetchIndexUsulan(
  accessToken: string | undefined,
  filter: FilterUsulan,
  offset: number,
): Promise<{ items: AiUsulanRingkas[]; total: number }> {
  const res = await withServerAuth(accessToken).POST("/api/v1/ai/usulan/search", {
    body: {
      domain: domainUsulan(filter),
      order: [["created_at", "desc"]],
      limit: UKURAN_HALAMAN,
      offset,
    },
  });
  if (!res.data) throw apiErrorDari(res);
  return { items: res.data.items, total: res.data.total };
}

/**
 * Ambil detail satu usulan.
 *
 * @param accessToken - Token akses sesi.
 * @param id - Id usulan.
 * @returns Detail lengkap, atau `null` bila 404.
 * @throws ApiError untuk setiap kegagalan lain (termasuk 403).
 */
export async function fetchDetailUsulan(
  accessToken: string | undefined,
  id: string,
): Promise<AiUsulanRead | null> {
  const res = await withServerAuth(accessToken).GET("/api/v1/ai/usulan/{usulan_id}", {
    params: { path: { usulan_id: id } },
  });
  if (res.data) return res.data;
  const err = apiErrorDari(res);
  if (err.status === 404) return null;
  throw err;
}

/**
 * Ambil konteks yang sudah diterapkan dari satu usulan P11
 * (`POST /api/v1/redesain/konteks/search`, domain `ai_usulan_id = id`).
 *
 * @param accessToken - Token akses sesi.
 * @param id - Id usulan P11.
 * @returns Konteks hasil Terapkan (paling banyak satu per kandidat).
 * @throws ApiError bila backend menolak atau gagal — tidak pernah daftar kosong palsu.
 */
export async function fetchKonteksTerapan(
  accessToken: string | undefined,
  id: string,
): Promise<KonteksRead[]> {
  const client = withServerAuth(accessToken);
  return ambilSemuaHalaman<KonteksRead>(async (limit, offset) => {
    const res = await client.POST("/api/v1/redesain/konteks/search", {
      body: { domain: [["ai_usulan_id", "=", id]], limit, offset },
    });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items, total: res.data.total };
  });
}
