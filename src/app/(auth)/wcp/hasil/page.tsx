import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { WcpHasilDimensiRead, WcpHasilRead, WcpInstrumenRead } from "@/lib/api/schema";

export const metadata = { title: "Hasil WCP — ANJAB-ABK" };

const INTERPRETASI_LABEL: Record<string, string> = {
  BAIK: "bg-green-100 text-green-700",
  CUKUP: "bg-yellow-100 text-yellow-700",
  PERLU_PERHATIAN: "bg-red-100 text-red-700",
  AMAN: "bg-green-100 text-green-700",
  WASPADA: "bg-yellow-100 text-yellow-700",
  RISIKO_TINGGI: "bg-red-100 text-red-700",
};

async function fetchPageData(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const instrumenRes = await client.GET("/api/v1/wcp/instrumen");
  const reqId = instrumenRes.response.headers.get("x-request-id");
  if (!instrumenRes.data) throw toApiError(null, reqId);
  const instrumen = instrumenRes.data as WcpInstrumenRead;

  if (instrumen.status !== "ANALYZED") {
    return { instrumen, hasil: null };
  }

  const hasilRes = await client.GET("/api/v1/wcp/hasil");
  if (!hasilRes.data) throw toApiError(null, hasilRes.response.headers.get("x-request-id"));

  return { instrumen, hasil: hasilRes.data as WcpHasilRead };
}

export default async function WcpHasilPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { instrumen, hasil } = await fetchPageData(session?.accessToken);
  if (!hasil) redirect("/wcp");

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/wcp" className="hover:text-gray-700">
          WCP
        </Link>
        <span>/</span>
        <span className="text-gray-900">Hasil</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="page-heading">Hasil WCP</h1>
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

      {/* Dimensi */}
      <div className="table-container">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                Dimensi
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
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                Interpretasi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {hasil.dimensi.map((d: WcpHasilDimensiRead) => (
              <tr key={d.dimensi_kode} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                  {d.dimensi_nama}
                  {d.is_risk && (
                    <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      Risiko
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                  {d.n_responden}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                  {d.skor_mean.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                  {d.skor_std.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                  {d.cronbach_alpha != null ? d.cronbach_alpha.toFixed(2) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      INTERPRETASI_LABEL[d.interpretasi] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {d.interpretasi.replaceAll("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
