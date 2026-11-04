import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { NILAI_KOSONG, formatAngkaOpm } from "@/lib/opm-pengecualian";
import type { OpmHasilSesiRead, OpmHasilTaskRead, OpmSesiRead } from "@/lib/api/schema";

export const metadata = { title: "Hasil OPM" };

interface Props {
  params: Promise<{ sesi_id: string }>;
}

async function fetchPageData(accessToken: string | undefined, sesiId: string) {
  const client = withServerAuth(accessToken);
  const [sesiRes, hasilRes] = await Promise.all([
    client.GET("/api/v1/opm/sesi/{sesi_id}", { params: { path: { sesi_id: sesiId } } }),
    client.GET("/api/v1/opm/sesi/{sesi_id}/hasil", { params: { path: { sesi_id: sesiId } } }),
  ]);
  if (!sesiRes.data) throw apiErrorDari(sesiRes);
  if (!hasilRes.data) throw apiErrorDari(hasilRes);

  return {
    sesi: sesiRes.data as OpmSesiRead,
    hasil: hasilRes.data as OpmHasilSesiRead,
  };
}

/**
 * Lencana flag esensial. `ya === null/undefined` (task tanpa rating) tampil "—",
 * BUKAN "Tidak" — kosong harus terbedakan dari jawaban negatif.
 */
function Badge({ ya, label }: { ya: boolean | null | undefined; label: string }) {
  if (ya == null) {
    return (
      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-400">
        {label}: {NILAI_KOSONG}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        ya ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {ya ? `${label}: Ya` : `${label}: Tidak`}
    </span>
  );
}

/**
 * Format tiga angka sebaran (min / median / maks) satu dimensi.
 *
 * Tiap nilai diformat sendiri lewat {@link formatAngkaOpm}: `null` tampil "—",
 * median n genap (mis. 3.5) tidak dibulatkan.
 *
 * @param min - Nilai minimum lintas responden, atau `null`.
 * @param median - Median lintas responden, atau `null`.
 * @param max - Nilai maksimum lintas responden, atau `null`.
 * @returns Teks "min / median / maks".
 */
function sebaran(
  min: number | null | undefined,
  median: number | null | undefined,
  max: number | null | undefined,
): string {
  return `${formatAngkaOpm(min)} / ${formatAngkaOpm(median)} / ${formatAngkaOpm(max)}`;
}

/**
 * Halaman hasil agregat OPM (Server Component, khusus admin).
 *
 * Menampilkan mean, simpangan baku, sebaran (min/median/maks) per dimensi, flag
 * esensial, dan pil amber "Perlu telaah" bila `rating_spread === true`. Penanda
 * adalah sinyal untuk ditelaah, bukan bukti kesalahan; `false`/`null` tanpa penanda.
 *
 * @param props.params - Parameter rute berisi `sesi_id`.
 * @returns Halaman hasil; memanggil `notFound()` bila bukan admin.
 */
export default async function OpmHasilPage({ params }: Props) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { sesi_id } = await params;
  const { sesi, hasil } = await fetchPageData(session?.accessToken, sesi_id);

  const sesiLabel = sesi.catatan ?? sesi.periode;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/opm" className="hover:text-gray-700">
          Analisis Jabatan — OPM
        </Link>
        <span>/</span>
        <Link href={`/opm/${sesi_id}`} className="hover:text-gray-700">
          {sesiLabel}
        </Link>
        <span>/</span>
        <span className="text-gray-900">Hasil</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="page-heading">Hasil OPM — {hasil.jabatan_nama ?? hasil.jabatan_id}</h1>
        <p className="page-subtext">
          Cabang <span className="font-medium">{hasil.cabang ?? "—"}</span> · Periode{" "}
          <span className="font-mono">{hasil.periode}</span> · {hasil.n_responden_submit} responden
          telah mengisi
        </p>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Sebaran kolom I/F/C ditulis min / median / maks. Penanda{" "}
        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
          Perlu telaah
        </span>{" "}
        muncul bila selisih maks dan min minimal 2 pada salah satu dimensi. Ini sinyal untuk
        ditelaah, bukan bukti kesalahan.
      </p>

      <div className="table-container">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                Task
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                Mean I
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                Mean F
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                Mean C
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                SD (I/F/C)
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                I (min / med / maks)
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                F (min / med / maks)
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                C (min / med / maks)
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                Flag
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                Proporsi (Sel/Wor)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {hasil.tasks.map((t: OpmHasilTaskRead) => (
              <tr key={t.task_kode} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <p className="font-mono text-xs text-gray-400">
                    {t.task_kode}
                    {t.orphan && (
                      <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 font-sans font-medium text-amber-800">
                        Orphan
                      </span>
                    )}
                    {t.rating_spread === true && (
                      <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 font-sans font-medium text-amber-800">
                        Perlu telaah
                      </span>
                    )}
                  </p>
                  <p className="text-gray-900">{t.uraian_tugas}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t.tugas_pokok}
                    {t.detil_tugas && <span> — {t.detil_tugas}</span>}
                  </p>
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-700">
                  {formatAngkaOpm(t.mean_importance)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-700">
                  {formatAngkaOpm(t.mean_frequency)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-700">
                  {formatAngkaOpm(t.mean_criticality)}
                </td>
                <td className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400">
                  {formatAngkaOpm(t.sd_importance)} / {formatAngkaOpm(t.sd_frequency)} /{" "}
                  {formatAngkaOpm(t.sd_criticality)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400">
                  {sebaran(t.min_importance, t.median_importance, t.max_importance)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400">
                  {sebaran(t.min_frequency, t.median_frequency, t.max_frequency)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400">
                  {sebaran(t.min_criticality, t.median_criticality, t.max_criticality)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <Badge ya={t.selection_essential} label="Selection Essential" />
                    <Badge ya={t.workload_essential} label="Workload Essential" />
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400">
                  {(t.prop_selection_essential * 100).toFixed(0)}% /{" "}
                  {(t.prop_workload_essential * 100).toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
