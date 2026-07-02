"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { OpmJawabanRead, OpmSesiTaskRead } from "@/lib/api/schema";

type Dimensi = "importance" | "frequency" | "criticality";

interface RatingState {
  importance?: number;
  frequency?: number;
  criticality?: number;
  catatan?: string;
}

const DIMENSI_LABEL: Record<Dimensi, { title: string; anchor: Record<number, string> }> = {
  importance: {
    title: "Importance — Seberapa Penting",
    anchor: { 1: "Tidak penting", 2: "", 3: "", 4: "", 5: "Sangat penting" },
  },
  frequency: {
    title: "Frequency — Seberapa Sering",
    anchor: { 1: "Insidental", 2: "", 3: "", 4: "", 5: "Sangat sering/Harian" },
  },
  criticality: {
    title: "Criticality — Dampak Jika Gagal",
    anchor: { 1: "Dampak minimal", 2: "", 3: "", 4: "", 5: "Dampak kritis" },
  },
};

/** True bila ketiga dimensi rating suatu task sudah terisi. */
export function isTaskLengkap(rating: RatingState | undefined): boolean {
  return (
    rating != null &&
    rating.importance != null &&
    rating.frequency != null &&
    rating.criticality != null
  );
}

interface Props {
  respondenId: string;
  task: OpmSesiTaskRead[];
  jawabanAwal: OpmJawabanRead[];
  sudahSubmit: boolean;
  accessToken: string | undefined;
}

export function OpmForm({ respondenId, task, jawabanAwal, sudahSubmit, accessToken }: Props) {
  const router = useRouter();

  const initialValues: Record<string, RatingState> = Object.fromEntries(
    jawabanAwal.map((j) => [
      j.task_kode,
      {
        importance: j.importance,
        frequency: j.frequency,
        criticality: j.criticality,
        catatan: j.catatan ?? undefined,
      },
    ]),
  );

  const [rating, setRating] = useState<Record<string, RatingState>>(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState(false);

  const sortedTask = task.slice().sort((a, b) => a.urutan - b.urutan);
  const jumlahLengkap = sortedTask.filter((t) => isTaskLengkap(rating[t.task_kode])).length;
  const allComplete = sortedTask.length > 0 && jumlahLengkap === sortedTask.length;

  function setSkor(taskKode: string, dimensi: Dimensi, nilai: number) {
    setRating((prev) => ({
      ...prev,
      [taskKode]: { ...prev[taskKode], [dimensi]: nilai },
    }));
  }

  function setCatatan(taskKode: string, catatan: string) {
    setRating((prev) => ({
      ...prev,
      [taskKode]: { ...prev[taskKode], catatan },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allComplete) {
      setError("Semua task wajib dinilai pada ketiga dimensi sebelum mengirim.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const client = withServerAuth(accessToken);
      const { error: apiError, response } = await client.POST(
        "/api/v1/opm/sesi/responden/{responden_id}/jawaban",
        {
          params: { path: { responden_id: respondenId } },
          body: {
            jawaban: sortedTask.map((t) => {
              const r = rating[t.task_kode]!;
              return {
                task_kode: t.task_kode,
                importance: r.importance!,
                frequency: r.frequency!,
                criticality: r.criticality!,
                catatan: r.catatan || null,
              };
            }),
          },
        },
      );
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      setSukses(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim jawaban.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sukses) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-lg font-medium text-green-800">Jawaban berhasil dikirim!</p>
        <p className="mt-1 text-sm text-green-600">Terima kasih telah mengisi kuesioner OPM.</p>
        <a
          href="/kuesioner"
          className="mt-4 inline-block rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Kembali ke Kuesioner Saya
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {sortedTask.map((t, idx) => {
        const r = rating[t.task_kode] ?? {};
        return (
          <div key={t.task_kode} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-400">
              {idx + 1}. {t.task_kode}
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">{t.uraian_tugas}</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {t.tugas_pokok}
              {t.detil_tugas && <span> — {t.detil_tugas}</span>}
            </p>

            <div className="mt-4 space-y-4">
              {(Object.keys(DIMENSI_LABEL) as Dimensi[]).map((dim) => (
                <div key={dim}>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {DIMENSI_LABEL[dim].title}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {([1, 2, 3, 4, 5] as const).map((nilai) => (
                      <label
                        key={nilai}
                        className={`flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          r[dim] === nilai
                            ? "border-blue-500 bg-blue-50 font-medium text-blue-700"
                            : "border-gray-200 text-gray-600 hover:border-blue-300"
                        } ${sudahSubmit ? "cursor-default" : ""}`}
                      >
                        <input
                          type="radio"
                          name={`${t.task_kode}-${dim}`}
                          value={nilai}
                          checked={r[dim] === nilai}
                          onChange={() => !sudahSubmit && setSkor(t.task_kode, dim, nilai)}
                          disabled={sudahSubmit}
                          className="sr-only"
                        />
                        {nilai}
                        {DIMENSI_LABEL[dim].anchor[nilai] &&
                          ` — ${DIMENSI_LABEL[dim].anchor[nilai]}`}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <label
                  htmlFor={`catatan-${t.task_kode}`}
                  className="text-xs font-medium text-gray-600 dark:text-gray-400"
                >
                  Catatan <span className="font-normal text-gray-400">(opsional)</span>
                </label>
                <textarea
                  id={`catatan-${t.task_kode}`}
                  rows={2}
                  value={r.catatan ?? ""}
                  disabled={sudahSubmit}
                  onChange={(e) => setCatatan(t.task_kode, e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>
        );
      })}

      {!sudahSubmit && (
        <div className="sticky bottom-0 border-t border-gray-200 bg-white/90 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {jumlahLengkap} / {sortedTask.length} tugas lengkap
            </p>
            <button
              type="submit"
              disabled={submitting || !allComplete}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Mengirim…" : "Kirim Jawaban"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
