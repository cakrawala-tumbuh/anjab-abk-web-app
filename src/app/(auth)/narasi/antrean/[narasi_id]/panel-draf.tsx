import type { AntreanDetailRead } from "@/lib/api/schema";

/**
 * Panel draf: teks versi yang sedang ditinjau. Versi berasal dari draf AI selalu berlabel
 * kandidat, bukan fakta. Versi tanpa teks dinyatakan terang, bukan dirender kosong.
 *
 * @param props.detail - Detail antrean.
 */
export function PanelDraf({ detail }: { detail: AntreanDetailRead }) {
  const aiDraft = detail.revision_origin === "AI_DRAFT";
  return (
    <section
      aria-labelledby="panel-draf"
      className="min-w-0 space-y-2 rounded-md border border-gray-200 p-3 dark:border-gray-700"
    >
      <h2 id="panel-draf" className="text-base font-semibold">
        Draf
      </h2>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Versi {detail.revision_no} · asal: {detail.revision_origin}
      </p>
      {aiDraft && (
        <p
          role="note"
          className="rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-xs text-purple-800 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-200"
        >
          Kandidat dari AI, bukan fakta. Periksa terhadap sumber sebelum memutuskan.
        </p>
      )}
      {detail.teks === null ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Versi ini belum punya teks.</p>
      ) : (
        <p className="text-sm whitespace-pre-wrap break-words">{detail.teks}</p>
      )}
    </section>
  );
}
