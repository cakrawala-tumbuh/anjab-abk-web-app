"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { TiTahap2ReviewRead, TiTahap2TaskRead } from "@/lib/api/schema";

interface Props {
  sesiId: string;
  review: TiTahap2ReviewRead;
  accessToken: string | undefined;
  readOnly: boolean;
  kodeToUraian: Record<string, string>;
}

type Keputusan = Record<string, boolean | null>;

export function ReviewForm({ sesiId, review, accessToken, readOnly, kodeToUraian }: Props) {
  const router = useRouter();
  const [keputusan, setKeputusan] = useState<Keputusan>(() => {
    const init: Keputusan = {};
    for (const t of review.tasks) {
      init[t.task_kode] = t.disetujui ?? null;
    }
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const belumDiputuskan = Object.values(keputusan).filter((v) => v === null).length;

  function setAll(val: boolean) {
    const next: Keputusan = {};
    for (const t of review.tasks) next[t.task_kode] = val;
    setKeputusan(next);
  }

  async function onSubmit() {
    const pending = Object.entries(keputusan).filter(([, v]) => v === null);
    if (pending.length > 0) {
      if (
        !confirm(
          `Masih ada ${pending.length} task yang belum diputuskan. Submit sekarang? Task yang belum diputuskan tidak akan disertakan.`,
        )
      )
        return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = Object.entries(keputusan)
        .filter(([, v]) => v !== null)
        .map(([task_kode, disetujui]) => ({ task_kode, disetujui: disetujui as boolean }));
      const client = withServerAuth(accessToken);
      const { error: apiError, response } = await client.POST(
        "/api/v1/task-inventory/sesi/{sesi_id}/tahap2",
        { params: { path: { sesi_id: sesiId } }, body: { keputusan: payload } },
      );
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {!readOnly && belumDiputuskan > 0 && (
        <div className="flex gap-4 text-sm text-gray-600">
          <span className="text-amber-600">
            Belum diputuskan: <strong>{belumDiputuskan}</strong>
          </span>
        </div>
      )}

      {error && (
        <div role="alert" className="form-server-error">
          {error}
        </div>
      )}

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => setAll(true)}
              className="rounded-md border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50"
            >
              Setujui Semua
            </button>
            <button
              onClick={() => setAll(false)}
              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              Tolak Semua
            </button>
          </div>
          <div className="flex items-center gap-3">
            {belumDiputuskan > 0 && (
              <span className="text-xs text-amber-600">{belumDiputuskan} belum diputuskan</span>
            )}
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Menyimpan…" : "Simpan Keputusan"}
            </button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                Task
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Pilih</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">
                {readOnly ? "Keputusan" : "Setujui?"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {review.tasks.map((t: TiTahap2TaskRead) => {
              const val = keputusan[t.task_kode];
              return (
                <tr key={t.task_kode} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-800">
                    <span>{kodeToUraian[t.task_kode] ?? t.task_kode}</span>
                    {kodeToUraian[t.task_kode] && (
                      <span className="ml-2 text-xs text-gray-400">{t.task_kode}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {t.n_relevan}/{t.n_total}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {readOnly ? (
                      <span
                        className={
                          t.disetujui === true
                            ? "text-green-700"
                            : t.disetujui === false
                              ? "text-red-600"
                              : "text-gray-400"
                        }
                      >
                        {t.disetujui === true
                          ? "✓ Disetujui"
                          : t.disetujui === false
                            ? "✗ Ditolak"
                            : "—"}
                      </span>
                    ) : (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setKeputusan((p) => ({ ...p, [t.task_kode]: true }))}
                          className={`rounded px-3 py-1 text-xs font-medium ${
                            val === true
                              ? "bg-green-600 text-white"
                              : "border border-green-300 text-green-700 hover:bg-green-50"
                          }`}
                        >
                          Ya
                        </button>
                        <button
                          onClick={() => setKeputusan((p) => ({ ...p, [t.task_kode]: false }))}
                          className={`rounded px-3 py-1 text-xs font-medium ${
                            val === false
                              ? "bg-red-600 text-white"
                              : "border border-red-300 text-red-700 hover:bg-red-50"
                          }`}
                        >
                          Tidak
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => setAll(true)}
              className="rounded-md border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50"
            >
              Setujui Semua
            </button>
            <button
              onClick={() => setAll(false)}
              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              Tolak Semua
            </button>
          </div>
          <div className="flex items-center gap-3">
            {belumDiputuskan > 0 && (
              <span className="text-xs text-amber-600">{belumDiputuskan} belum diputuskan</span>
            )}
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Menyimpan…" : "Simpan Keputusan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
