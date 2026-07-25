export const SUMBER_BUKTI = ["Formal", "Aktual", "Keduanya"] as const;
export const KONDISI = ["Baseline", "Peak", "Both"] as const;
export const FREKUENSI = ["Harian", "Mingguan", "Semesteran", "Insidental"] as const;

/**
 * Nilai `va_type` yang diterima backend sebagai **prefill/draft** (dropdown standar
 * master-data, panel penjelasan) — 4 nilai kanonik kontrak `VaType` backend
 * (`cakrawala-tumbuh/anjab-abk-backend#24`). `"Needs Validation"` sudah dihapus dari
 * kontrak backend sejak issue itu — jangan ditambahkan kembali di sini.
 *
 * `"Context-Dependent"` boleh muncul di sini (nilai awal katalog yang wajar sebagai
 * standar), tetapi **tidak boleh** dipakai sebagai jawaban final Tahap 3 — lihat
 * {@link VA_TYPE_FINAL}.
 */
export const VA_TYPE_PREFILL = [
  "VA-Core",
  "VA-Enable",
  "NVA-Residual",
  "Context-Dependent",
] as const;

/**
 * Nilai `va_type` yang SAH sebagai jawaban **final** Tahap 3 (selektor
 * `detail-form.tsx`) — subset 3 nilai dari {@link VA_TYPE_PREFILL} tanpa
 * `"Context-Dependent"`. Backend menolak submit (422) bila ada entri final
 * ber-`va_type` `"Context-Dependent"` (issue `cakrawala-tumbuh/anjab-abk-web-app#39`).
 */
export const VA_TYPE_FINAL = ["VA-Core", "VA-Enable", "NVA-Residual"] as const;
