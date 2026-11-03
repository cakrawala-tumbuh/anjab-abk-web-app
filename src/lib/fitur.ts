import type { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { FiturKode } from "@/lib/api/schema";

/** Klien API bertipe hasil `withServerAuth`. */
type KlienApi = ReturnType<typeof withServerAuth>;

/**
 * Teks tetap banner/state saat skoring WCP/DCS dimatikan (flag `WCP_DCS_SCORING` mati).
 * Dipakai bersama oleh banner halaman hasil dan state informasi hasil per responden.
 */
export const TEKS_SKOR_BELUM_SAH =
  "Skor belum disahkan (RAW_ONLY). Interpretasi, label risiko, dan indeks gabungan dinonaktifkan.";

/**
 * Baca status satu feature flag backend dari `GET /api/v1/system/fitur`.
 *
 * Kegagalan request (401/403/5xx) **dilempar**, bukan dianggap "flag mati": jalur baca
 * tidak boleh menelan kegagalan menjadi nilai bawaan yang tampak sah.
 *
 * @param client - Klien bertipe dengan Bearer (`withServerAuth`).
 * @param kode - Kode fitur yang ditanyakan, mis. `"WCP_DCS_SCORING"`.
 * @returns `true` bila fitur aktif; `false` bila nonaktif atau kodenya tidak ada di respons.
 * @throws ApiError bila request gagal.
 */
export async function fiturAktif(client: KlienApi, kode: FiturKode): Promise<boolean> {
  const res = await client.GET("/api/v1/system/fitur");
  if (!res.data) throw apiErrorDari(res);
  return res.data.items.some((f) => f.kode === kode && f.aktif);
}
