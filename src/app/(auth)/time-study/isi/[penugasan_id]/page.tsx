import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isPartisipan } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { components } from "@/lib/api/schema";

type TsLogRead = components["schemas"]["TsLogRead"];
type TsPenugasanRead = components["schemas"]["TsPenugasanRead"];

export const metadata = { title: "Time Study — Log Harian" };

const DAY_COLOR_LABEL: Record<string, { label: string; cls: string }> = {
  GREEN: { label: "Hijau (Hari Biasa)", cls: "bg-green-100 text-green-700" },
  YELLOW: { label: "Kuning (Hari Sibuk)", cls: "bg-yellow-100 text-yellow-700" },
  RED: { label: "Merah (Hari Puncak)", cls: "bg-red-100 text-red-700" },
};

function formatMenit(menit: number): string {
  const jam = Math.floor(menit / 60);
  const sisa = menit % 60;
  if (jam === 0) return `${sisa}m`;
  if (sisa === 0) return `${jam}j`;
  return `${jam}j ${sisa}m`;
}

interface Props {
  params: Promise<{ penugasan_id: string }>;
}

async function fetchPageData(accessToken: string | undefined, penugasanId: string) {
  const client = withServerAuth(accessToken);
  const [penugasanRes, logRes] = await Promise.all([
    client.GET("/api/v1/time-study/penugasan/{penugasan_id}", {
      params: { path: { penugasan_id: penugasanId } },
    }),
    client.GET("/api/v1/time-study/penugasan/{penugasan_id}/log", {
      params: { path: { penugasan_id: penugasanId } },
    }),
  ]);
  if (!penugasanRes.data) throw apiErrorDari(penugasanRes);
  // Log harian milik partisipan sendiri — kegagalan yang ditelan jadi `[]`
  // membuat log yang sudah dicatat tampak hilang.
  if (!logRes.data) throw apiErrorDari(logRes);
  return {
    penugasan: penugasanRes.data as TsPenugasanRead,
    logs: logRes.data as TsLogRead[],
  };
}

export default async function TimeStudyIsiPage({ params }: Props) {
  const session = await auth();
  if (!isPartisipan(session)) notFound();

  const { penugasan_id } = await params;
  const { penugasan, logs } = await fetchPageData(session?.accessToken, penugasan_id);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/kuesioner" className="hover:text-gray-700">
          Kuesioner Saya
        </Link>
        <span>/</span>
        <span className="text-gray-900">Time Study</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-heading">Log Harian — Time Study</h1>
          <p className="page-subtext">Catat aktivitas harian Anda untuk keperluan Studi Waktu.</p>
        </div>
        {penugasan.aktif && (
          <Link
            href={`/time-study/isi/${penugasan_id}/tambah`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Tambah Log
          </Link>
        )}
      </div>

      {!penugasan.aktif && (
        <div role="alert" className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-700">
          Penugasan Time Study Anda sedang tidak aktif. Log baru tidak dapat ditambahkan atau diubah
          untuk sementara.
        </div>
      )}

      {logs.length === 0 ? (
        <div className="empty-state">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Belum ada log harian. Mulai catat aktivitas Anda.
          </p>
          {penugasan.aktif && (
            <Link
              href={`/time-study/isi/${penugasan_id}/tambah`}
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Tambah Log Hari Ini
            </Link>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Masuk–Keluar
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Inti
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Karakter
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Pengembangan
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Strategis
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Administrasi
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Istirahat
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  Warna Hari
                </th>
                {penugasan.aktif && (
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {logs.map((log) => {
                const dc = DAY_COLOR_LABEL[log.day_color] ?? {
                  label: log.day_color,
                  cls: "bg-gray-100 text-gray-500",
                };
                return (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-mono text-gray-900">{log.tanggal}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">
                      {log.waktu_masuk}–{log.waktu_keluar}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {formatMenit(log.menit_core)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {formatMenit(log.menit_character)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {formatMenit(log.menit_improve)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {formatMenit(log.menit_strategic)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {formatMenit(log.menit_admin)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {formatMenit(log.menit_recovery)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${dc.cls}`}
                      >
                        {dc.label}
                      </span>
                    </td>
                    {penugasan.aktif && (
                      <td className="px-4 py-3">
                        <Link
                          href={`/time-study/isi/${penugasan_id}/${log.id}/edit`}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-sm text-gray-500 dark:text-gray-400">
        Total: <strong>{logs.length}</strong> log hari
      </div>
    </div>
  );
}
