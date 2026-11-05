import type { AiRunRead } from "@/lib/api/schema";

/** Properti {@link DetailRun}. */
export interface DetailRunProps {
  run: AiRunRead;
}

/**
 * Daftar rincian satu run AI.
 *
 * Dirender HANYA dari field tipe-generate `AiRunRead` yang disebut satu per satu; objek
 * tidak pernah diiterasi, sehingga `masukan`/`keluaran` yang menyelinap ke objek tidak
 * ikut tampil.
 *
 * @param props - Lihat {@link DetailRunProps}.
 */
export function DetailRun({ run }: DetailRunProps) {
  const baris: ReadonlyArray<[string, string]> = [
    ["ID run", run.id],
    ["Fungsi", run.fungsi],
    ["Status QA", run.status_qa],
    ["Kode QA", run.kode_qa.length > 0 ? run.kode_qa.join(", ") : "—"],
    ["Versi prompt", run.prompt_version],
    ["Hash prompt", run.prompt_hash],
    ["Model diminta", run.model_diminta],
    ["Model dilayani", run.model_dilayani ?? "—"],
    ["Protocol ID", run.protocol_id],
    ["Sidik jari masukan", run.input_snapshot_id],
    ["Stop reason", run.stop_reason ?? "—"],
    ["Token masukan", String(run.input_tokens ?? "—")],
    ["Token keluaran", String(run.output_tokens ?? "—")],
    ["Dibuat oleh", run.dibuat_oleh ?? "—"],
    ["Dibuat", run.created_at],
    ["Selesai", run.selesai_at ?? "—"],
  ];
  return (
    <div className="space-y-6">
      <dl className="form-card grid gap-x-6 gap-y-3 p-6 text-sm sm:grid-cols-2">
        {baris.map(([k, v]) => (
          <div key={k}>
            <dt className="text-gray-500 dark:text-gray-400">{k}</dt>
            <dd className="break-all">{v}</dd>
          </div>
        ))}
      </dl>
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Sumber data</h2>
        {run.sumber.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada sumber tercatat.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {run.sumber.map((s) => (
              <li key={`${s.source_id}:${s.source_hash}`} className="break-all">
                <span className="font-mono text-xs">{s.source_id}</span> ·{" "}
                <span className="font-mono text-xs">{s.source_hash}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
