interface LencanaProps {
  /** Status redaksi item terhadap paket; `SAMA` tidak diberi lencana. */
  statusPaket: "SAMA" | "REDAKSI_BEDA" | "TIDAK_ADA_DI_PAKET";
  /** Item kembar lintas instrumen berbentuk `"<INSTRUMEN>:<item_id>"`, atau kosong. */
  kembarDengan?: string | null;
}

/**
 * Lencana integritas bank item: redaksi beda paket, tidak ada di paket, dan item kembar.
 *
 * Murni penanda — tidak mengubah teks item. Item `SAMA` tanpa kembar tidak merender apa pun.
 *
 * @param props - Status paket dan referensi kembar item.
 * @returns Deret lencana, atau `null` bila tidak ada yang perlu ditandai.
 */
export function LencanaItemPaket({ statusPaket, kembarDengan }: LencanaProps) {
  if (statusPaket === "SAMA" && !kembarDengan) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {statusPaket === "REDAKSI_BEDA" && (
        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          Redaksi beda paket
        </span>
      )}
      {statusPaket === "TIDAK_ADA_DI_PAKET" && (
        <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
          Tidak ada di paket
        </span>
      )}
      {kembarDengan && (
        <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
          Kembar: {kembarDengan}
        </span>
      )}
    </span>
  );
}
