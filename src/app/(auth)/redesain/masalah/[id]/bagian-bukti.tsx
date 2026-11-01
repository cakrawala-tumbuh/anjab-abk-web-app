import type { MasalahRead, SekolahRead } from "@/lib/api/schema";
import { labelLangkah } from "@/lib/redesain-alur";
import { fetchBuktiMasalah, fetchLangkahMasalah } from "./data-bukti";
import { FormBukti } from "./form-bukti";

/** Properti {@link BagianBukti}. */
export interface BagianBuktiProps {
  masalah: MasalahRead;
  sekolah: SekolahRead[];
  accessToken: string | undefined;
}

/**
 * Bagian "Bukti" pada detail masalah (Server Component async).
 *
 * Tabel bukti: kode, langkah (`kode — tahap`, bukan id), jenis, klaim didukung,
 * independen, status pemeriksaan, dan pemeriksa (hanya kode orang). Tersedia form tambah
 * dan ubah; pilihan langkah hanya memuat langkah dari proses masalah ini. Tidak ada hapus
 * dan tidak ada unggah berkas. Kegagalan backend dilempar ke `error.tsx`.
 *
 * @param props - Lihat {@link BagianBuktiProps}.
 */
export async function BagianBukti({ masalah, accessToken }: BagianBuktiProps) {
  const [bukti, langkah] = await Promise.all([
    fetchBuktiMasalah(accessToken, masalah.id),
    fetchLangkahMasalah(accessToken, masalah.id),
  ]);
  const petaLangkah = new Map(langkah.map((l) => [l.id, labelLangkah(l)]));
  const pilihan = langkah.map((l) => ({ id: l.id, label: labelLangkah(l) }));

  return (
    <section aria-label="Bukti" className="space-y-4">
      {bukti.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Belum ada bukti untuk masalah ini.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="pr-3 font-medium">Kode</th>
                <th className="pr-3 font-medium">Langkah</th>
                <th className="pr-3 font-medium">Jenis</th>
                <th className="pr-3 font-medium">Klaim didukung</th>
                <th className="pr-3 font-medium">Independen</th>
                <th className="pr-3 font-medium">Status pemeriksaan</th>
                <th className="font-medium">Pemeriksa</th>
              </tr>
            </thead>
            <tbody>
              {bukti.map((b) => (
                <tr key={b.id} className="align-top">
                  <td className="pr-3 font-mono">{b.kode}</td>
                  <td className="pr-3">
                    {b.langkah_id ? (petaLangkah.get(b.langkah_id) ?? "—") : "—"}
                  </td>
                  <td className="pr-3">{b.jenis}</td>
                  <td className="whitespace-normal break-words pr-3">{b.klaim_didukung}</td>
                  <td className="pr-3">{b.independen}</td>
                  <td className="pr-3">{b.status_pemeriksaan}</td>
                  <td className="font-mono">{b.pemeriksa_kode_orang ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {bukti.map((b) => (
        <details key={b.id}>
          <summary className="cursor-pointer text-xs text-blue-600 dark:text-blue-400">
            Ubah bukti {b.kode}
          </summary>
          <div className="mt-2">
            <FormBukti
              masalahId={masalah.id}
              langkah={pilihan}
              awal={b}
              accessToken={accessToken}
            />
          </div>
        </details>
      ))}

      <details className="rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-600">
        <summary className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400">
          + Tambah bukti
        </summary>
        <div className="mt-3">
          <FormBukti masalahId={masalah.id} langkah={pilihan} accessToken={accessToken} />
        </div>
      </details>
    </section>
  );
}
