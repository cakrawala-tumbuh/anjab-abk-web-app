/**
 * Logika murni pengajuan fungsi AI Task Inventory per jabatan (P02 Normalisasi tugas dan
 * P03 Tag peran): badan permintaan dan penyaring usulan P02 yang boleh dijadikan dasar P03.
 */
import type { AiUsulanRingkas, PengajuanP02, PengajuanP03 } from "@/lib/api/schema";

/**
 * Bangun body `POST .../jabatan/{jabatan_id}/normalisasi-ai`. `sumber_dokumen_ids` selalu `[]`.
 *
 * @param periode - Periode yang sudah lolos `validasiPeriodeAi`.
 * @param unit - Kode unit dari rute.
 * @param hanyaUnitIni - `true` -> `unit` dikirim; `false` -> `unit: null` (seluruh unit jabatan).
 * @returns Body bertipe kontrak backend.
 */
export function bodyP02(periode: string, unit: string, hanyaUnitIni: boolean): PengajuanP02 {
  return { unit: hanyaUnitIni ? unit : null, periode: periode.trim(), sumber_dokumen_ids: [] };
}

/**
 * Bangun body `POST .../jabatan/{jabatan_id}/tag-peran-ai`.
 *
 * @param usulanP02Id - Id usulan P02 terpilih.
 * @param periode - Periode yang sudah lolos `validasiPeriodeAi`.
 * @returns Body bertipe kontrak backend.
 */
export function bodyP03(usulanP02Id: string, periode: string): PengajuanP03 {
  return { usulan_p02_id: usulanP02Id, periode: periode.trim() };
}

/**
 * Saring usulan P02 yang boleh dijadikan dasar P03: putusan terakhir `APPROVE` atau `REVISE`.
 *
 * @param usulan - Hasil pencarian usulan (fungsi P02, sasaran jabatan).
 * @returns Usulan yang diterima reviewer; yang belum diputus atau `REJECT` dibuang.
 */
export function usulanP02Diterima(usulan: readonly AiUsulanRingkas[]): AiUsulanRingkas[] {
  return usulan.filter((u) => {
    const p = u.putusan_terakhir?.putusan;
    return p === "APPROVE" || p === "REVISE";
  });
}
