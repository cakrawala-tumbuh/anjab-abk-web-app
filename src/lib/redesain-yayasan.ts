/**
 * Logika murni halaman Ringkasan Yayasan (WEB-7a): pembacaan filter dari `searchParams`,
 * perakitan domain `POST .../redesain/yayasan/search`, tampilan nilai kosong, dan URL
 * proxy unduhan DOCX. Web TIDAK menghitung apa pun — seluruh isi ringkasan dari backend.
 */
import { OPSI_PRIORITAS_FINAL, OPSI_STATUS_PILIHAN } from "@/lib/redesain-keputusan";
import { STATUS_AWAL } from "@/lib/redesain-register";

/** Status penilaian yang menjadi isi agenda yayasan (nilai kosakata backend). */
export const STATUS_AGENDA_YAYASAN = "Siap untuk telaah yayasan";

/** Pesan toast saat ekspor batch dijawab 404 (agenda kosong). */
export const PESAN_AGENDA_KOSONG = "Tidak ada masalah di agenda";

/** Opsi filter `status_bukti` (kosakata status awal masalah + "Belum cukup"). */
export const OPSI_STATUS_BUKTI = [...STATUS_AWAL, "Belum cukup"] as const;

/** Opsi filter `status_penilaian`: pilihan manual + `Telah diputuskan`. */
export const OPSI_STATUS_PENILAIAN = [...OPSI_STATUS_PILIHAN, "Telah diputuskan"] as const;

/** Opsi filter `prioritas_final` / `saran_otomatis` (kosakata prioritas). */
export const OPSI_PRIORITAS = OPSI_PRIORITAS_FINAL;

type NilaiQuery = string | string[] | undefined;

/** Filter ringkasan yayasan yang aktif; `null` = tidak difilter. */
export interface FilterYayasan {
  konteksKode: string | null;
  statusBukti: string | null;
  saranOtomatis: string | null;
  prioritasFinal: string | null;
  statusPenilaian: string | null;
}

function satu(value: NilaiQuery): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw !== undefined && raw.length > 0 ? raw : null;
}

/**
 * Baca filter dari `searchParams` mentah (`?konteks=`, `?bukti=`, `?saran=`, `?final=`,
 * `?penilaian=`).
 *
 * @param sp - `searchParams` Next.js apa adanya.
 * @returns Filter terstruktur; nilai kosong dibaca `null`.
 */
export function bacaFilterYayasan(sp: Record<string, NilaiQuery>): FilterYayasan {
  return {
    konteksKode: satu(sp.konteks),
    statusBukti: satu(sp.bukti),
    saranOtomatis: satu(sp.saran),
    prioritasFinal: satu(sp.final),
    statusPenilaian: satu(sp.penilaian),
  };
}

/** Satu kondisi domain ala Odoo `[field, "=", nilai]`. */
export type DomainYayasanTerm = [string, "=", string];

/**
 * Rakit {@link FilterYayasan} menjadi domain `POST /api/v1/redesain/yayasan/search`.
 *
 * @param f - Filter aktif.
 * @returns Daftar kondisi (digabung AND oleh backend); `[]` bila tanpa filter.
 */
export function domainYayasan(f: FilterYayasan): DomainYayasanTerm[] {
  const d: DomainYayasanTerm[] = [];
  if (f.konteksKode) d.push(["konteks_kode", "=", f.konteksKode]);
  if (f.statusBukti) d.push(["status_bukti", "=", f.statusBukti]);
  if (f.saranOtomatis) d.push(["saran_otomatis", "=", f.saranOtomatis]);
  if (f.prioritasFinal) d.push(["prioritas_final", "=", f.prioritasFinal]);
  if (f.statusPenilaian) d.push(["status_penilaian", "=", f.statusPenilaian]);
  return d;
}

/**
 * Serialisasi filter ke query string halaman (hanya filter terisi).
 *
 * @param f - Filter aktif.
 * @returns Query string tanpa `?`; `""` bila tanpa filter.
 */
export function queryFilterYayasan(f: FilterYayasan): string {
  const p = new URLSearchParams();
  if (f.konteksKode) p.set("konteks", f.konteksKode);
  if (f.statusBukti) p.set("bukti", f.statusBukti);
  if (f.saranOtomatis) p.set("saran", f.saranOtomatis);
  if (f.prioritasFinal) p.set("final", f.prioritasFinal);
  if (f.statusPenilaian) p.set("penilaian", f.statusPenilaian);
  return p.toString();
}

/**
 * Teks sel untuk nilai yang mungkin kosong: `null`/`undefined`/`""` → `—`. Tidak pernah
 * diubah menjadi `0`, `Tidak`, atau `Rendah`.
 *
 * @param nilai - Nilai dari read-model.
 */
export function tampilNilai(nilai: string | null | undefined): string {
  return nilai === null || nilai === undefined || nilai === "" ? "—" : nilai;
}

/** URL proxy unduh DOCX ringkasan satu masalah. */
export function urlRingkasanSatuan(masalahId: string): string {
  return `/api/redesain/ekspor/ringkasan-yayasan/${encodeURIComponent(masalahId)}`;
}

/** URL proxy unduh DOCX Lembar Konfirmasi pra-isi satu masalah. */
export function urlLembarKonfirmasi(masalahId: string): string {
  return `/api/redesain/ekspor/lembar-konfirmasi/${encodeURIComponent(masalahId)}`;
}

/** URL proxy unduh DOCX agenda (batch) berstatus "Siap untuk telaah yayasan". */
export function urlAgendaYayasan(): string {
  return `/api/redesain/ekspor/ringkasan-yayasan?status_penilaian=${encodeURIComponent(STATUS_AGENDA_YAYASAN)}`;
}
