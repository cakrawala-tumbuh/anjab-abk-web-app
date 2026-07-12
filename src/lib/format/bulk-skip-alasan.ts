const ALASAN_LABEL: Record<string, string> = {
  sudah_terdaftar: "Sudah terdaftar",
  duplikat_input: "Duplikat dalam input",
  bukan_anggota_sme_panel: "Bukan anggota SME panel",
  kapasitas_penuh: "Kapasitas sesi penuh",
};

/** Terjemahkan kode alasan skip bulk-assign backend ke label Bahasa Indonesia. */
export function formatAlasanSkip(alasan: string): string {
  return ALASAN_LABEL[alasan] ?? alasan;
}
