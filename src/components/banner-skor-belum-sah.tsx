import { TEKS_SKOR_BELUM_SAH } from "@/lib/fitur";

/**
 * Banner informasi bahwa skor WCP/DCS belum disahkan (mode `RAW_ONLY`).
 *
 * Teksnya tetap (`TEKS_SKOR_BELUM_SAH`). Juga dipakai sebagai state informasi pengganti
 * halaman hasil per responden saat flag `WCP_DCS_SCORING` mati.
 */
export function BannerSkorBelumSah() {
  return (
    <div
      role="status"
      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      {TEKS_SKOR_BELUM_SAH}
    </div>
  );
}
