import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type {
  DcsHasilRespondenRead,
  DcsHasilSubSkalaRespondenRead,
  DcsRespondenRead,
  DcsSesiRead,
} from "@/lib/api/schema";

export const metadata = { title: "Hasil DCS Responden — ANJAB-ABK" };

const RISK_LABEL: Record<string, { label: string; cls: string }> = {
  HIGH: { label: "Tinggi", cls: "bg-red-100 text-red-700" },
  MODERATE: { label: "Sedang", cls: "bg-yellow-100 text-yellow-700" },
  LOW: { label: "Rendah", cls: "bg-green-100 text-green-700" },
};

interface Props {
  params: Promise<{ sesi_id: string; responden_id: string }>;
}

async function fetchPageData(accessToken: string | undefined, sesiId: string, respondenId: string) {
  const client = withServerAuth(accessToken);
  const [sesiRes, respondenRes, hasilRes] = await Promise.all([
    client.GET("/api/v1/dcs/sesi/{sesi_id}", {
      params: { path: { sesi_id: sesiId } },
    }),
    client.GET("/api/v1/dcs/sesi/{sesi_id}/responden", {
      params: { path: { sesi_id: sesiId } },
    }),
    client.GET("/api/v1/dcs/sesi/responden/{responden_id}/hasil", {
      params: { path: { responden_id: respondenId } },
    }),
  ]);
  const reqId = sesiRes.response.headers.get("x-request-id");
  if (!sesiRes.data) throw toApiError(null, reqId);
  if (!hasilRes.data) throw toApiError(null, hasilRes.response.headers.get("x-request-id"));

  const responden = ((respondenRes.data ?? []) as DcsRespondenRead[]).find(
    (r) => r.id === respondenId,
  );

  return {
    sesi: sesiRes.data as DcsSesiRead,
    responden: responden ?? null,
    hasil: hasilRes.data as DcsHasilRespondenRead,
  };
}

export default async function DcsHasilRespondenPage({ params }: Props) {
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
  const risk = RISK_LABEL[hasil.risk_flag] ?? {
    label: hasil.risk_flag,
    cls: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dcs" className="hover:text-gray-700">
          Sesi DCS
        </Link>
        <span>/</span>
        <Link href={`/dcs/${sesi_id}`} className="hover:text-gray-700">
          {sesiLabel}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{namaResponden}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-heading">Hasil DCS — {namaResponden}</h1>
          <p className="page-subtext">
            Sesi: <span className="font-mono">{sesiLabel}</span>
          </p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${risk.cls}`}>
          Risiko {risk.label}
        </span>
      </div>

      {/* Skor per sub-skala */}
      <div>
        <h2 className="mb-4 text-lg font-medium text-gray-900">Skor per Sub-skala</h2>
        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Sub-skala
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                  Skor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {hasil.sub_skala.map((s: DcsHasilSubSkalaRespondenRead) => (
                <tr key={s.subskala_kode} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-900">{s.subskala_nama}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">{s.skor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
