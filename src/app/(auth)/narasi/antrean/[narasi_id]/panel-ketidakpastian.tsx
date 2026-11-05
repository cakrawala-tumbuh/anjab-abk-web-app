import type { AntreanDetailRead } from "@/lib/api/schema";
import { nilaiKosong, teksNilai } from "@/lib/narasi-tinjauan";

function Blok({ judul, nilai }: { judul: string; nilai: unknown }) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium">{judul}</h3>
      {nilaiKosong(nilai) ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">Tidak ada.</p>
      ) : Array.isArray(nilai) ? (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {nilai.map((n, i) => (
            <li key={i} className="whitespace-pre-wrap break-words">
              {teksNilai(n)}
            </li>
          ))}
        </ul>
      ) : (
        <pre className="max-w-full overflow-x-auto rounded bg-gray-50 p-2 text-xs whitespace-pre-wrap break-words dark:bg-gray-800">
          {teksNilai(nilai)}
        </pre>
      )}
    </div>
  );
}

/**
 * Panel ketidakpastian: kontradiksi, hal yang tidak diketahui, fakta yang hilang, pemetaan
 * klaim ke sumber, cakupan tinjauan yang disarankan, dan paparan. Isi dari metadata AI
 * ditampilkan apa adanya; keluaran mentah AI tidak dibuka di sini.
 *
 * @param props.detail - Detail antrean.
 */
export function PanelKetidakpastian({ detail }: { detail: AntreanDetailRead }) {
  return (
    <section
      aria-labelledby="panel-ketidakpastian"
      className="space-y-3 rounded-md border border-gray-200 p-3 dark:border-gray-700"
    >
      <h2 id="panel-ketidakpastian" className="text-base font-semibold">
        Ketidakpastian
      </h2>
      <Blok judul="Kontradiksi" nilai={detail.contradictions} />
      <Blok judul="Hal yang belum diketahui" nilai={detail.unknowns} />
      <Blok judul="Fakta yang hilang" nilai={detail.missing_facts} />
      <Blok judul="Pemetaan klaim ke sumber" nilai={detail.claim_to_source_map} />
      <Blok judul="Cakupan tinjauan yang disarankan" nilai={detail.recommended_review_scope} />
      <p className="text-xs text-gray-600 dark:text-gray-400">Paparan: {detail.paparan}</p>
    </section>
  );
}
