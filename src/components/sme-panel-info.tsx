/**
 * Keterangan jumlah anggota SME panel di form "Mulai Analisis Jabatan"
 * (Task Inventory & OPM).
 *
 * Angka ini yang menentukan `max_responden` yang benar — backend menolak keras
 * (422) bila anggota panel melebihi `max_responden`. Tanpa keterangan ini admin
 * mengisi `max_responden` secara buta.
 */

interface Props {
  /** `null` = jabatan belum dipilih; `0` = jabatan tanpa SME panel. */
  jumlah: number | null;
}

export function SmePanelInfo({ jumlah }: Props) {
  if (jumlah === null) return null;

  if (jumlah === 0) {
    return (
      <p className="mt-1 text-xs text-yellow-600" data-testid="sme-panel-info">
        Jabatan ini belum punya SME panel. Analisis tetap bisa dibuat — responden ditambahkan manual
        setelahnya.
      </p>
    );
  }

  return (
    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300" data-testid="sme-panel-info">
      SME panel: <strong>{jumlah} anggota</strong>. Semuanya otomatis menjadi responden, jadi Maks.
      Responden diisi {jumlah} — turunkan angka itu dan backend akan menolak.
    </p>
  );
}
