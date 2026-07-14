/**
 * Jumlah anggota SME panel per jabatan.
 *
 * Backend menolak (422) pembuatan sesi Task Inventory maupun OPM bila jumlah
 * anggota SME panel jabatan itu MELEBIHI `max_responden`
 * (`Jumlah anggota SME panel (11) melebihi max_responden (10).`). Form "Mulai
 * Analisis Jabatan" karena itu wajib tahu jumlah anggota panel begitu jabatan
 * dipilih — supaya `max_responden` diisi secara sadar, bukan ditebak.
 *
 * Panel unik per jabatan di backend (`SMEPanelModel.jabatan_id` unique), jadi
 * pemetaan jabatan → jumlah anggota bersifat 1:1.
 */
import type { SMEPanelRead } from "@/lib/api/schema";

/** Peta `jabatan_id` → jumlah anggota SME panel jabatan itu. */
export type PetaAnggotaPanel = Record<string, number>;

export function petaJumlahAnggotaPanel(panels: SMEPanelRead[]): PetaAnggotaPanel {
  const peta: PetaAnggotaPanel = {};
  for (const p of panels) {
    peta[p.jabatan_id] = (p.partisipan_ids ?? []).length;
  }
  return peta;
}

/**
 * Jumlah anggota panel untuk jabatan yang sedang dipilih.
 *
 * `null` = jabatan belum dipilih. `0` = jabatan dipilih tapi belum punya SME
 * panel (atau panelnya kosong) — kondisi SAH: sesi tetap boleh dibuat.
 */
export function jumlahAnggotaPanel(peta: PetaAnggotaPanel, jabatanId: string): number | null {
  if (!jabatanId) return null;
  return peta[jabatanId] ?? 0;
}
