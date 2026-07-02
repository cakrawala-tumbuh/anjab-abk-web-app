import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { OpmHasilSesiRead, OpmHasilTaskRead, OpmSesiRead } from "@/lib/api/schema";

export const metadata = { title: "Hasil OPM — ANJAB-ABK" };

interface Props {
  params: Promise<{ sesi_id: string }>;
}

async function fetchPageData(accessToken: string | undefined, sesiId: string) {
  const client = withServerAuth(accessToken);
  const [sesiRes, hasilRes] = await Promise.all([
    client.GET("/api/v1/opm/sesi/{sesi_id}", { params: { path: { sesi_id: sesiId } } }),
    client.GET("/api/v1/opm/sesi/{sesi_id}/hasil", { params: { path: { sesi_id: sesiId } } }),
  ]);
  const reqId = sesiRes.response.headers.get("x-request-id");
  if (!sesiRes.data) throw toApiError(null, reqId);
  if (!hasilRes.data) throw toApiError(null, hasilRes.response.headers.get("x-request-id"));

  return {
    sesi: sesiRes.data as OpmSesiRead,
    hasil: hasilRes.data as OpmHasilSesiRead,
  };
}

function Badge({ ya, label }: { ya: boolean; label: string }) {
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
          Sesi OPM
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
          Periode <span className="font-mono">{hasil.periode}</span> · {hasil.n_responden_submit}{" "}
          responden telah mengisi
        </p>
      </div>

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
                  <p className="font-mono text-xs text-gray-400">{t.task_kode}</p>
                  <p className="text-gray-900">{t.uraian_tugas}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t.tugas_pokok}
                    {t.detil_tugas && <span> — {t.detil_tugas}</span>}
                  </p>
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-700">
                  {t.mean_importance.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-700">
                  {t.mean_frequency.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-700">
                  {t.mean_criticality.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400">
                  {(t.sd_importance ?? 0).toFixed(2)} / {(t.sd_frequency ?? 0).toFixed(2)} /{" "}
                  {(t.sd_criticality ?? 0).toFixed(2)}
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
