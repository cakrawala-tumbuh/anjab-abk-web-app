/** Teks tetap peringatan privasi untuk isian teks bebas redesain. */
export const TEKS_PERINGATAN_PRIVASI =
  "Jangan menulis nama orang, identitas atau kasus murid/keluarga, diagnosis, atau isi konseling. Tulis jabatan/peran.";

/**
 * Peringatan privasi yang WAJIB dipasang di atas setiap isian teks bebas layar redesain.
 *
 * Orang di register redesain hanya boleh muncul sebagai kode (`kode_orang`) dan/atau
 * jabatan — tidak pernah nama atau data pribadi.
 *
 * @returns Elemen `role="note"` berisi {@link TEKS_PERINGATAN_PRIVASI}.
 */
export function PeringatanPrivasi() {
  return (
    <p
      role="note"
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200"
    >
      {TEKS_PERINGATAN_PRIVASI}
    </p>
  );
}
