import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { DcsHasilRead, DcsHasilSubSkalaRead, DcsInstrumenRead } from "@/lib/api/schema";

export const metadata = { title: "Hasil DCS" };

const RISK_LABEL: Record<string, { label: string; cls: string }> = {
  HIGH: { label: "Tinggi", cls: "bg-red-100 text-red-700" },
  MODERATE: { label: "Sedang", cls: "bg-yellow-100 text-yellow-700" },
  LOW: { label: "Rendah", cls: "bg-green-100 text-green-700" },
};

async function fetchPageData(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const instrumenRes = await client.GET("/api/v1/dcs/instrumen");
  if (!instrumenRes.data) throw apiErrorDari(instrumenRes);
  const instrumen = instrumenRes.data as DcsInstrumenRead;

  if (instrumen.status !== "ANALYZED") {
    return { instrumen, hasil: null };
  }

  const hasilRes = await client.GET("/api/v1/dcs/hasil");
  if (!hasilRes.data) throw apiErrorDari(hasilRes);

  return { instrumen, hasil: hasilRes.data as DcsHasilRead };
}

export default async function DcsHasilPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { instrumen, hasil } = await fetchPageData(session?.accessToken);
  if (!hasil) redirect("/dcs");

  const risk = RISK_LABEL[hasil.risk_flag] ?? {
    label: hasil.risk_flag,
    cls: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dcs" className="hover:text-gray-700">
          DCS
        </Link>
        <span>/</span>
        <span className="text-gray-900">Hasil</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-heading">Hasil DCS</h1>
          <p className="page-subtext">
            {hasil.n_responden} responden dianalisis
            {instrumen.catatan && (
              <>
                {" "}
                · <span className="italic">{instrumen.catatan}</span>
              </>
            )}
          </p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${risk.cls}`}>
          Risiko {risk.label}
        </span>
      </div>

      {/* K-Index */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {hasil.k_index != null ? hasil.k_index.toFixed(2) : "—"}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            K-Index Psikososial
            {hasil.k_index == null && " (menunggu responden WCP ber-submit)"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-500">
            {hasil.k_index_wcp_risk != null ? hasil.k_index_wcp_risk.toFixed(2) : "—"}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Komponen WCP Risk</p>
        </div>
      </div>

      {/* Sub-skala */}
      <div>
        <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-50">
          Skor per Sub-skala
        </h2>
        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Sub-skala
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                  N
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                  Mean
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                  Std
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                  Cronbach α
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {hasil.sub_skala.map((s: DcsHasilSubSkalaRead) => (
                <tr key={s.subskala_kode} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{s.subskala_nama}</td>
                  <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                    {s.n_responden}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                    {s.skor_mean.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                    {s.skor_std.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                    {s.cronbach_alpha != null ? s.cronbach_alpha.toFixed(2) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
