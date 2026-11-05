/**
 * Pengambilan data layar tinjauan narasi (jalur BACA: gagal → melempar `ApiError`).
 *
 * INVARIANT: respons gagal tidak pernah diubah menjadi objek kosong. Hanya dua jawaban sah
 * yang tidak dilempar: 404 (kasus tak ada) dan 409 `narasi_tidak_dalam_antrean`.
 */
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { AntreanDetailRead } from "@/lib/api/schema";
import { KODE_TIDAK_DALAM_ANTREAN } from "@/lib/narasi-tinjauan";

/** Hasil pembacaan detail antrean: ada, di luar antrean (dengan pesan server), atau tak ada. */
export type HasilDetailAntrean =
  | { jenis: "ada"; detail: AntreanDetailRead }
  | { jenis: "luar_antrean"; pesan: string }
  | { jenis: "tidak_ada" };

/**
 * Ambil detail satu kasus antrean (draf berdampingan dengan sumber).
 *
 * @param accessToken - Token akses sesi.
 * @param narasiId - Id kasus.
 * @returns Detail; atau `luar_antrean` bila server menjawab 409 `narasi_tidak_dalam_antrean`;
 *   atau `tidak_ada` bila 404.
 * @throws ApiError untuk setiap kegagalan lain (termasuk 403).
 */
export async function fetchDetailAntrean(
  accessToken: string | undefined,
  narasiId: string,
): Promise<HasilDetailAntrean> {
  const res = await withServerAuth(accessToken).GET("/api/v1/narasi/antrean/{narasi_id}", {
    params: { path: { narasi_id: narasiId } },
  });
  if (res.data) return { jenis: "ada", detail: res.data };
  const err = apiErrorDari(res);
  if (err.status === 404) return { jenis: "tidak_ada" };
  if (err.status === 409 && err.code === KODE_TIDAK_DALAM_ANTREAN) {
    return { jenis: "luar_antrean", pesan: err.message };
  }
  throw err;
}
