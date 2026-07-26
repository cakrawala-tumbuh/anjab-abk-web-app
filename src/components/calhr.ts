export const SUMBER_BUKTI = ["Formal", "Aktual", "Keduanya"] as const;
export const KONDISI = ["Baseline", "Peak", "Both"] as const;
export const FREKUENSI = ["Harian", "Mingguan", "Semesteran", "Insidental"] as const;

/**
 * Label Bahasa Indonesia untuk tiap nilai {@link SUMBER_BUKTI}, dipakai sebagai teks
 * `<option>` selektor "Sumber Bukti" di formulir Tahap 3 (`detail-form.tsx`) dan panel
 * petunjuk (`petunjuk-tahap3.tsx`).
 *
 * **Nilai kontrak yang dikirim ke backend TIDAK berubah** — hanya teks yang dibaca
 * partisipan. Uji coba workshop SME panel guru TK (2026-07-25) menunjukkan istilah
 * Inggris polos (`Formal`/`Aktual`/`Keduanya`) tidak cukup jelas tanpa konteks singkat
 * (issue backlog `cakrawala-tumbuh/anjab-abk-web-app#41`).
 */
export const SUMBER_BUKTI_LABEL: Record<(typeof SUMBER_BUKTI)[number], string> = {
  Formal: "Formal (tertulis di jobdesk/regulasi)",
  Aktual: "Aktual (dikerjakan di lapangan)",
  Keduanya: "Keduanya",
};

/**
 * Label Bahasa Indonesia untuk tiap nilai {@link KONDISI}, dipakai sebagai teks
 * `<option>` selektor "Kondisi" di formulir Tahap 3 (`detail-form.tsx`) dan panel
 * petunjuk (`petunjuk-tahap3.tsx`).
 *
 * **Nilai kontrak yang dikirim ke backend TIDAK berubah** (`Baseline`/`Peak`/`Both`
 * tetap dikirim apa adanya) — hanya teks yang dibaca partisipan. Istilah Inggris polos
 * terbukti dibaca sebagai kata benda asing ("sepatu boot") oleh peserta workshop SME
 * panel guru TK (2026-07-25, issue backlog `cakrawala-tumbuh/anjab-abk-web-app#41`).
 */
export const KONDISI_LABEL: Record<(typeof KONDISI)[number], string> = {
  Baseline: "Rutin (hari biasa)",
  Peak: "Puncak (masa sibuk tertentu)",
  Both: "Keduanya (rutin & puncak)",
};

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
