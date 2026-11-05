/**
 * Logika murni layar antrean reviewer narasi (Tim Kajian): kosakata status antrean,
 * pembacaan filter dari `searchParams`, dan perakitan query string URL.
 */

/** Tiga status yang masuk antrean menurut backend, urut penyajian pada filter. */
export const STATUS_ANTREAN = ["AI_DRAFT", "TEAM_REVIEW", "NEED_FACT"] as const;

/** Tipe nilai status antrean. */
export type StatusAntrean = (typeof STATUS_ANTREAN)[number];

/** Keterangan Indonesia tiap status antrean. */
export const KETERANGAN_ANTREAN: Record<StatusAntrean, string> = {
  AI_DRAFT: "Draf dari AI; menunggu tinjauan tim",
  TEAM_REVIEW: "Menunggu tinjauan Tim Kajian",
  NEED_FACT: "Perlu fakta atau sumber tambahan",
};

/**
 * Label status antrean: enum internal plus keterangan Indonesia.
 *
 * @param status - Nilai status dari backend (nilai tak dikenal ditampilkan apa adanya).
 */
export function labelStatusAntrean(status: string): string {
  const ket = (KETERANGAN_ANTREAN as Record<string, string | undefined>)[status];
  return ket ? `${status} — ${ket}` : status;
}

/** Filter antrean yang aktif; `null` = tidak difilter. */
export interface FilterAntrean {
  status: StatusAntrean | null;
  instrument_id: string | null;
  periode: string | null;
}

type NilaiQuery = string | string[] | undefined;

function pertama(v: NilaiQuery): string | null {
  const raw = Array.isArray(v) ? v[0] : v;
  const t = raw?.trim();
  return t ? t : null;
}

/**
 * Baca filter antrean dari `searchParams`. `status` di luar tiga status antrean diabaikan;
 * `instrument_id` dibatasi 50 dan `periode` 20 karakter (batas backend).
 *
 * @param sp - `searchParams` halaman.
 * @returns Filter aktif.
 */
export function bacaFilterAntrean(sp: Record<string, NilaiQuery>): FilterAntrean {
  const s = pertama(sp.status);
  const status = (STATUS_ANTREAN as readonly string[]).includes(s ?? "")
    ? (s as StatusAntrean)
    : null;
  return {
    status,
    instrument_id: pertama(sp.instrument_id)?.slice(0, 50) ?? null,
    periode: pertama(sp.periode)?.slice(0, 20) ?? null,
  };
}

/** `true` bila ada filter yang aktif. */
export function adaFilterAntrean(f: FilterAntrean): boolean {
  return f.status !== null || f.instrument_id !== null || f.periode !== null;
}

/**
 * Susun query string filter (tanpa `hlm`: mengubah filter selalu kembali ke halaman 1).
 *
 * @param f - Filter yang akan dicerminkan ke URL.
 * @returns Query string tanpa tanda tanya; kosong bila tak ada filter.
 */
export function queryFilterAntrean(f: FilterAntrean): string {
  const q = new URLSearchParams();
  if (f.status) q.set("status", f.status);
  if (f.instrument_id) q.set("instrument_id", f.instrument_id);
  if (f.periode) q.set("periode", f.periode);
  return q.toString();
}

/**
 * Tampilkan `label_dokumenter`, yang bertipe bebas di kontrak (`metadata_ai`): teks apa
 * adanya, nilai kosong menjadi "—", nilai bukan teks diserialisasi JSON.
 *
 * @param nilai - Nilai `label_dokumenter` dari baris antrean.
 */
export function teksLabelDokumenter(nilai: unknown): string {
  if (nilai === null || nilai === undefined || nilai === "") return "—";
  return typeof nilai === "string" ? nilai : JSON.stringify(nilai);
}
