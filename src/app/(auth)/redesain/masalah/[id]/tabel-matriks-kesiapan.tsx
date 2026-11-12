import type { KesiapanBaris, StatusKesiapan } from "@/lib/api/schema";
import { TEKS_BELUM_DINILAI, formatDelta } from "@/lib/redesain-alternatif";

/** Properti {@link TabelMatriksKesiapan}. */
export interface TabelMatriksKesiapanProps {
  /** Status opsi keseluruhan (badge di atas tabel). */
  statusOpsi: StatusKesiapan;
  baris: KesiapanBaris[];
  /** Peta `jabatan_id` → nama jabatan; label baris bukan ID. */
  namaJabatan: (id: string) => string;
}

const WARNA_STATUS: Record<StatusKesiapan, string> = {
  READY: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  CONDITIONAL: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  HOLD: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

/**
 * Matriks kesiapan Option×Penerima pada satu periode.
 *
 * Satu baris per penerima (label nama jabatan). Baris tanpa penilaian pada periode ini
 * ditandai {@link TEKS_BELUM_DINILAI}; delta `NOT_ESTIMABLE` tampil "Tidak dapat diestimasi",
 * tidak pernah 0. Syarat atau alasan hold tampil sesuai status baris.
 *
 * @param props - Lihat {@link TabelMatriksKesiapanProps}.
 */
export function TabelMatriksKesiapan({
  statusOpsi,
  baris,
  namaJabatan,
}: TabelMatriksKesiapanProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm">
        Status opsi:{" "}
        <span
          data-testid="status-opsi"
          className={`rounded px-1.5 py-0.5 text-xs font-semibold ${WARNA_STATUS[statusOpsi]}`}
        >
          {statusOpsi}
        </span>
      </p>
      {baris.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Belum ada penerima untuk alternatif ini.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="pr-3 font-medium">Penerima</th>
                <th className="pr-3 font-medium">Status</th>
                <th className="pr-3 font-medium">Δ asal</th>
                <th className="pr-3 font-medium">Δ penerima</th>
                <th className="pr-3 font-medium">Δ organisasi</th>
                <th className="pr-3 font-medium">Syarat / alasan</th>
                <th className="font-medium">Dinilai pada</th>
              </tr>
            </thead>
            <tbody>
              {baris.map((b) => (
                <tr key={b.penerima_id} className="align-top">
                  <td className="pr-3">
                    {namaJabatan(b.penerima_jabatan_id)}
                    {b.material && <span className="ml-1 text-gray-500">(material)</span>}
                  </td>
                  <td className="pr-3">
                    {b.status ? (
                      <span className={`rounded px-1.5 py-0.5 ${WARNA_STATUS[b.status]}`}>
                        {b.status}
                      </span>
                    ) : (
                      <span
                        data-testid="belum-dinilai"
                        className="rounded bg-gray-200 px-1.5 py-0.5 font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-100"
                      >
                        {TEKS_BELUM_DINILAI}
                      </span>
                    )}
                  </td>
                  <td className="pr-3">{formatDelta(b.delta_asal_jam, b.delta_asal_estimasi)}</td>
                  <td className="pr-3">
                    {formatDelta(b.delta_penerima_jam, b.delta_penerima_estimasi)}
                  </td>
                  <td className="pr-3">
                    {formatDelta(b.delta_organisasi_jam, b.delta_organisasi_estimasi)}
                  </td>
                  <td className="pr-3 whitespace-pre-wrap break-words">
                    {b.syarat ?? b.alasan_hold ?? "—"}
                  </td>
                  <td>{b.dinilai_pada ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
