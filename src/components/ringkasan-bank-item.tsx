interface RingkasanProps {
  /** sha256 hex bank item aktif. */
  itemBankHash: string;
  jumlahItem: number;
  jumlahRedaksiBeda: number;
  jumlahTidakDiPaket: number;
}

/**
 * Ringkasan integritas bank item sebuah instrumen: 12 karakter pertama hash bank,
 * jumlah item, dan jumlah item yang menyimpang dari paket.
 *
 * @param props - Nilai ringkasan dari `GET /api/v1/{wcp,dcs}/instrumen`.
 * @returns Kartu ringkasan.
 */
export function RingkasanBankItem({
  itemBankHash,
  jumlahItem,
  jumlahRedaksiBeda,
  jumlahTidakDiPaket,
}: RingkasanProps) {
  return (
    <dl
      aria-label="Ringkasan bank item"
      className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm sm:grid-cols-4 dark:border-gray-700 dark:bg-gray-800/50"
    >
      <div>
        <dt className="text-xs text-gray-500">Hash bank item</dt>
        <dd className="font-mono text-gray-900 dark:text-gray-100">{itemBankHash.slice(0, 12)}</dd>
      </div>
      <div>
        <dt className="text-xs text-gray-500">Jumlah item</dt>
        <dd className="text-gray-900 dark:text-gray-100">{jumlahItem}</dd>
      </div>
      <div>
        <dt className="text-xs text-gray-500">Redaksi beda paket</dt>
        <dd className="text-gray-900 dark:text-gray-100">{jumlahRedaksiBeda}</dd>
      </div>
      <div>
        <dt className="text-xs text-gray-500">Tidak ada di paket</dt>
        <dd className="text-gray-900 dark:text-gray-100">{jumlahTidakDiPaket}</dd>
      </div>
    </dl>
  );
}
