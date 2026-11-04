import { DetailsMuatMalas } from "@/components/details-muat-malas";
import type { MasalahRead, SekolahRead } from "@/lib/api/schema";
import { JUDUL_ALTERNATIF } from "@/lib/redesain-alternatif";
import { fetchAlternatifMasalah, fetchJabatanAlternatif } from "./data-alternatif";
import { FormAlternatif } from "./form-alternatif";

/** Properti {@link BagianAlternatif}. */
export interface BagianAlternatifProps {
  masalah: MasalahRead;
  sekolah: SekolahRead[];
  accessToken: string | undefined;
}

/**
 * Bagian "Alternatif" pada detail masalah (Server Component async).
 *
 * Tabel: kode, opsi, pihak asal → penerima (nama jabatan, bukan id), gap penerima, dan
 * status telaah. Tersedia form tambah dan ubah; tidak ada hapus. Kegagalan backend
 * dilempar ke `error.tsx`.
 *
 * @param props - Lihat {@link BagianAlternatifProps}.
 */
export async function BagianAlternatif({ masalah, accessToken }: BagianAlternatifProps) {
  const [alternatif, jabatan] = await Promise.all([
    fetchAlternatifMasalah(accessToken, masalah.id),
    fetchJabatanAlternatif(accessToken),
  ]);
  const petaJabatan = new Map(jabatan.map((j) => [j.id, j.nama]));
  const nama = (id: string | null) => (id ? (petaJabatan.get(id) ?? "—") : "—");
  const pilihan = jabatan.map((j) => ({ id: j.id, label: j.nama }));

  return (
    <section aria-label="Alternatif" className="space-y-4">
      <h2 className="text-sm font-semibold">{JUDUL_ALTERNATIF}</h2>
      {alternatif.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Belum ada alternatif untuk masalah ini.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="pr-3 font-medium">Kode</th>
                <th className="pr-3 font-medium">Opsi</th>
                <th className="pr-3 font-medium">Asal → Penerima</th>
                <th className="pr-3 font-medium">Gap penerima</th>
                <th className="font-medium">Status telaah</th>
              </tr>
            </thead>
            <tbody>
              {alternatif.map((a) => (
                <tr key={a.id} className="align-top">
                  <td className="pr-3 font-mono">{a.kode}</td>
                  <td className="pr-3">{a.opsi}</td>
                  <td className="pr-3">
                    {nama(a.pihak_asal_jabatan_id)} → {nama(a.pihak_penerima_jabatan_id)}
                  </td>
                  <td className="pr-3">{a.gap_penerima}</td>
                  <td>{a.status_telaah}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {alternatif.map((a) => (
        <DetailsMuatMalas
          key={a.id}
          ringkasan={`Ubah alternatif ${a.kode}`}
          summaryClassName="cursor-pointer text-xs text-blue-600 dark:text-blue-400"
        >
          <div className="mt-2">
            <FormAlternatif
              masalahId={masalah.id}
              jabatan={pilihan}
              awal={a}
              accessToken={accessToken}
            />
          </div>
        </DetailsMuatMalas>
      ))}

      <details className="rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-600">
        <summary className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400">
          + Tambah alternatif
        </summary>
        <div className="mt-3">
          <FormAlternatif masalahId={masalah.id} jabatan={pilihan} accessToken={accessToken} />
        </div>
      </details>
    </section>
  );
}
