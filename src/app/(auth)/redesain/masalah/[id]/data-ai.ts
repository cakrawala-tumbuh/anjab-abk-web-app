/**
 * Pengambilan daftar usulan P06 masalah redesain (jalur BACA data inti: gagal -> melempar `ApiError`).
 */
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import type { AiUsulanRingkas } from "@/lib/api/schema";
import { usulanP06Diterima } from "@/lib/ai-usulan-masalah";

/**
 * Ambil usulan P06 bersasaran masalah ini yang sudah diterima reviewer (`APPROVE`/`REVISE`).
 *
 * @param accessToken - Token akses sesi.
 * @param masalahId - Id masalah (`sasaran_id` usulan).
 * @returns Usulan P06 diterima, terbaru dulu.
 * @throws ApiError bila backend menolak atau gagal; tidak pernah diubah menjadi daftar kosong.
 */
export async function fetchUsulanP06Diterima(
  accessToken: string | undefined,
  masalahId: string,
): Promise<AiUsulanRingkas[]> {
  const semua = await ambilSemuaHalaman<AiUsulanRingkas>(async (limit, offset) => {
    const res = await withServerAuth(accessToken).POST("/api/v1/ai/usulan/search", {
      body: {
        domain: [
          ["fungsi", "=", "P06"],
          ["sasaran_id", "=", masalahId],
        ],
        order: [["created_at", "desc"]],
        limit,
        offset,
      },
    });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items, total: res.data.total };
  });
  return usulanP06Diterima(semua);
}
