import type { AntreanSumberRead } from "@/lib/api/schema";
import { KETERANGAN_BASIS } from "@/lib/narasi-kasus";

/**
 * Panel sumber: tiap sumber dengan judul, versi, kutipan, hash, hubungan, dan teks penuh,
 * ditata agar bisa dibaca berdampingan dengan draf.
 *
 * @param props.sumber - Sumber pada versi yang ditinjau.
 */
export function PanelSumber({ sumber }: { sumber: AntreanSumberRead[] }) {
  return (
    <section
      aria-labelledby="panel-sumber"
      className="min-w-0 space-y-2 rounded-md border border-gray-200 p-3 dark:border-gray-700"
    >
      <h2 id="panel-sumber" className="text-base font-semibold">
        Sumber
      </h2>
      {sumber.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Versi ini tidak punya sumber.</p>
      ) : (
        <ol className="space-y-3">
          {sumber.map((s, i) => (
            <li
              key={`${s.sumber_id}-${i}`}
              className="space-y-1 border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700"
            >
              <p className="text-sm font-medium break-words">
                {s.judul} <span className="font-normal text-gray-500">({s.versi})</span>
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Hubungan: {s.basis_relation} — {KETERANGAN_BASIS[s.basis_relation]}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 break-words">
                Kutipan: {s.source_span ?? "—"}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 break-all">
                Hash: {s.source_hash}
              </p>
              <p className="text-sm whitespace-pre-wrap break-words">{s.teks}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
