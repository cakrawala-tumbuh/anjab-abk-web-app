import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type {
  WcpHasilDimensiRespondenRead,
  WcpHasilRespondenRead,
  WcpRespondenRead,
  WcpSesiRead,
} from "@/lib/api/schema";

export const metadata = { title: "Hasil WCP Responden — ANJAB-ABK" };

const INTERPRETASI_LABEL: Record<string, { label: string; cls: string }> = {
  BAIK: { label: "Baik", cls: "bg-green-100 text-green-700" },
  CUKUP: { label: "Cukup", cls: "bg-blue-100 text-blue-700" },
  AMAN: { label: "Aman", cls: "bg-green-100 text-green-700" },
  PERLU_PERHATIAN: {
    label: "Perlu Perhatian",
    cls: "bg-yellow-100 text-yellow-700",
  },
  WASPADA: { label: "Waspada", cls: "bg-orange-100 text-orange-700" },
  RISIKO_TINGGI: { label: "Risiko Tinggi", cls: "bg-red-100 text-red-700" },
};

interface Props {
  params: Promise<{ sesi_id: string; responden_id: string }>;
}

async function fetchPageData(accessToken: string | undefined, sesiId: string, respondenId: string) {
  const client = withServerAuth(accessToken);
  const [sesiRes, respondenRes, hasilRes] = await Promise.all([
    client.GET("/api/v1/wcp/sesi/{sesi_id}", {
      params: { path: { sesi_id: sesiId } },
    }),
    client.GET("/api/v1/wcp/sesi/{sesi_id}/responden", {
      params: { path: { sesi_id: sesiId } },
    }),
    client.GET("/api/v1/wcp/sesi/responden/{responden_id}/hasil", {
      params: { path: { responden_id: respondenId } },
    }),
  ]);
  const reqId = sesiRes.response.headers.get("x-request-id");
  if (!sesiRes.data) throw toApiError(null, reqId);
  if (!hasilRes.data) throw toApiError(null, hasilRes.response.headers.get("x-request-id"));

  const responden = ((respondenRes.data ?? []) as WcpRespondenRead[]).find(
    (r) => r.id === respondenId,
  );

  return {
    sesi: sesiRes.data as WcpSesiRead,
    responden: responden ?? null,
    hasil: hasilRes.data as WcpHasilRespondenRead,
  };
}

export default async function WcpHasilRespondenPage({ params }: Props) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { sesi_id, responden_id } = await params;
  const { sesi, responden, hasil } = await fetchPageData(
    session?.accessToken,
    sesi_id,
    responden_id,
  );

  const sesiLabel = sesi.catatan ?? sesi.periode;
  const namaResponden = responden?.nama ?? "Anonim";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/wcp" className="hover:text-gray-700">
          Sesi WCP
        </Link>
        <span>/</span>
        <Link href={`/wcp/${sesi_id}`} className="hover:text-gray-700">
          {sesiLabel}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{namaResponden}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="page-heading">Hasil WCP — {namaResponden}</h1>
        <p className="page-subtext">
          Sesi: <span className="font-mono">{sesiLabel}</span>
        </p>
      </div>

      {/* Skor per dimensi */}
      <div>
        <h2 className="mb-4 text-lg font-medium text-gray-900">Skor per Dimensi</h2>
        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Dimensi
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                  Skor
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Interpretasi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {hasil.dimensi.map((d: WcpHasilDimensiRespondenRead) => {
                const interp = INTERPRETASI_LABEL[d.interpretasi] ?? {
                  label: d.interpretasi,
                  cls: "bg-gray-100 text-gray-600",
                };
                return (
                  <tr key={d.dimensi_kode} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-900">{d.dimensi_nama}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-700">{d.skor}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${interp.cls}`}
                      >
                        {interp.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
