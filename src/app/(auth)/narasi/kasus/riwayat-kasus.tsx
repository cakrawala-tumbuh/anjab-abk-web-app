import type { NarasiEventRead, NarasiVersiLengkap } from "@/lib/api/schema";
import { KETERANGAN_BASIS, labelStatus, type BasisRelation } from "@/lib/narasi-kasus";

/** Satu butir lini masa gabungan versi dan event. */
type Butir =
  | { jenis: "versi"; waktu: string; urut: number; versi: NarasiVersiLengkap }
  | { jenis: "event"; waktu: string; urut: number; event: NarasiEventRead };

/**
 * Gabungkan versi dan event menjadi satu lini masa urut waktu naik. Waktu sama → versi
 * lebih dulu dari event, lalu urutan masukan dipertahankan.
 *
 * @param versi - Versi kasus.
 * @param event - Event kasus.
 * @returns Butir terurut.
 */
export function susunLiniMasa(versi: NarasiVersiLengkap[], event: NarasiEventRead[]): Butir[] {
  const semua: Butir[] = [
    ...versi.map((v, i): Butir => ({ jenis: "versi", waktu: v.created_at, urut: i, versi: v })),
    ...event.map(
      (e, i): Butir => ({ jenis: "event", waktu: e.event_at, urut: versi.length + i, event: e }),
    ),
  ];
  return semua.sort((a, b) => {
    const d = Date.parse(a.waktu) - Date.parse(b.waktu);
    if (d !== 0) return d;
    if (a.jenis !== b.jenis) return a.jenis === "versi" ? -1 : 1;
    return a.urut - b.urut;
  });
}

/**
 * Riwayat kasus narasi: versi dan event dalam satu lini masa urut waktu. Status tampil
 * sebagai enum internal plus keterangan Indonesia (lihat `labelStatus`); tidak ada kata
 * yang menyiratkan pengesahan untuk `TEAM_VERIFIED`.
 *
 * @param props.versi - Versi beserta tautan sumbernya.
 * @param props.event - Event tindakan manusia.
 */
export function RiwayatKasus({
  versi,
  event,
}: {
  versi: NarasiVersiLengkap[];
  event: NarasiEventRead[];
}) {
  const butir = susunLiniMasa(versi, event);
  if (butir.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada versi atau event.</p>;
  }
  return (
    <ol className="space-y-3" aria-label="Riwayat kasus">
      {butir.map((b) =>
        b.jenis === "versi" ? (
          <li
            key={`v-${b.versi.id}`}
            className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700"
          >
            <p className="font-medium">
              Versi {b.versi.revision_no}{" "}
              <span className="font-normal text-gray-500 dark:text-gray-400">
                · {b.versi.revision_origin} · {new Date(b.waktu).toLocaleString("id-ID")} ·{" "}
                {b.versi.dibuat_oleh}
              </span>
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Status hasil: {labelStatus(b.versi.status_hasil)}
            </p>
            {b.versi.teks && (
              <pre className="mt-2 whitespace-pre-wrap break-words rounded bg-gray-50 p-2 text-sm dark:bg-gray-800">
                {b.versi.teks}
              </pre>
            )}
            {b.versi.sumber.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-600 dark:text-gray-400">
                {b.versi.sumber.map((s) => (
                  <li key={`${s.sumber_id}-${s.source_span ?? ""}`} className="break-words">
                    <span className="font-mono">{s.sumber_id}</span> —{" "}
                    {KETERANGAN_BASIS[s.basis_relation as BasisRelation] ?? s.basis_relation}
                    {s.source_span ? ` · “${s.source_span}”` : ""}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ) : (
          <li
            key={`e-${b.event.id}`}
            className="rounded-lg border border-dashed border-gray-300 p-3 text-sm dark:border-gray-600"
          >
            <p className="font-medium">
              Event {b.event.event_kind}{" "}
              <span className="font-normal text-gray-500 dark:text-gray-400">
                · {new Date(b.waktu).toLocaleString("id-ID")} · {b.event.actor_key} (
                {b.event.actor_role})
              </span>
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {labelStatus(b.event.dari_status)} → {labelStatus(b.event.ke_status)}
            </p>
            {b.event.event_notes && <p className="mt-1 break-words">{b.event.event_notes}</p>}
          </li>
        ),
      )}
    </ol>
  );
}
