/** Teks tetap banner PROTOTIPE modul Redesain Pekerjaan. */
export const TEKS_BANNER_PROTOTIPE =
  "PROTOTIPE — metode Paket Validasi & Prioritas Redesain v1.3 belum disahkan. Isi register BELUM MENJADI TEMUAN.";

/**
 * Banner penanda bahwa layar redesain masih prototipe.
 *
 * Selalu tampil di seluruh layar redesain; pencabutannya menjadi item terpisah
 * (setelah metode v1.3 disahkan), bukan lewat prop atau env.
 *
 * @returns Elemen `role="note"` berisi {@link TEKS_BANNER_PROTOTIPE}.
 */
export function BannerPrototipe() {
  return (
    <div
      role="note"
      className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
    >
      {TEKS_BANNER_PROTOTIPE}
    </div>
  );
}
