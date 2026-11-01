/**
 * Penanda "Eskalasi" untuk masalah yang `eskalasi_pada`-nya terisi (indikasi risiko serius
 * dari konfirmasi sekolah). Tidak merender apa pun bila `eskalasiPada` kosong.
 *
 * @param props.eskalasiPada - Cap waktu eskalasi (`masalah.eskalasi_pada`) atau kosong.
 */
export function BadgeEskalasi({ eskalasiPada }: { eskalasiPada: string | null | undefined }) {
  if (!eskalasiPada) return null;
  return (
    <span
      title={`Tereskalasi sejak ${eskalasiPada}`}
      className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200"
    >
      Eskalasi
    </span>
  );
}
