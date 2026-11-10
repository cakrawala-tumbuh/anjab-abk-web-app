/**
 * Pengambilan daftar usulan P02 jabatan (jalur BACA data inti: gagal -> melempar `ApiError`).
 */
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import type { AiUsulanRingkas } from "@/lib/api/schema";
import { usulanP02Diterima } from "@/lib/ai-usulan-ti";

/**
 * Ambil usulan P02 bersasaran jabatan ini yang sudah diterima reviewer (`APPROVE`/`REVISE`).
 *
 * @param accessToken - Token akses sesi.
 * @param jabatanId - Id jabatan (`sasaran_id` usulan).
 * @returns Usulan P02 diterima, terbaru dulu.
 * @throws ApiError bila backend menolak atau gagal; tidak pernah diubah menjadi daftar kosong.
 */
export async function fetchUsulanP02Diterima(
  accessToken: string | undefined,
  jabatanId: string,
): Promise<AiUsulanRingkas[]> {
  const semua = await ambilSemuaHalaman<AiUsulanRingkas>(async (limit, offset) => {
    const res = await withServerAuth(accessToken).POST("/api/v1/ai/usulan/search", {
      body: {
        domain: [
          ["fungsi", "=", "P02"],
          ["sasaran_id", "=", jabatanId],
        ],
        order: [["created_at", "desc"]],
        limit,
        offset,
      },
    });
    if (!res.data) throw apiErrorDari(res);
    return { items: res.data.items, total: res.data.total };
  });
  return usulanP02Diterima(semua);
}
