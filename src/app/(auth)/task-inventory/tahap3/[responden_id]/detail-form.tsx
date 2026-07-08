"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { TiDetailItem, TiDetailRead, TiTaskTerpilihRead } from "@/lib/api/schema";

/** Skema validasi satu entri detail CalHR (dipakai juga di unit test). */
export const detailItemSchema = z.object({
  task_kode: z.string().min(1),
  sumber_bukti: z.enum(["Formal", "Aktual", "Keduanya"]),
  kondisi: z.enum(["Baseline", "Peak", "Both"]),
  frekuensi_teks: z.string().min(1, "Frekuensi wajib diisi").max(100),
  durasi_per_kali: z.number().int().min(0, "Durasi ≥ 0"),
  jam_per_minggu: z.number().min(0, "Jam/minggu ≥ 0"),
  peak4w_hours: z.number().min(0).default(0),
  ai_mode: z.enum(["Human-led", "Co-Pilot", "AI-assisted"]),
  va_type: z.enum(["VA-Core", "VA-Enable", "NVA-Residual"]),
  dcs_flag: z.boolean().default(false),
  catatan: z.string().max(500).optional(),
});

const SUMBER_BUKTI = ["Formal", "Aktual", "Keduanya"] as const;
const KONDISI = ["Baseline", "Peak", "Both"] as const;
const AI_MODE = ["Human-led", "Co-Pilot", "AI-assisted"] as const;
const VA_TYPE = ["VA-Core", "VA-Enable", "NVA-Residual"] as const;

interface RowState {
  checked: boolean;
  sumber_bukti: TiDetailItem["sumber_bukti"];
  kondisi: TiDetailItem["kondisi"];
  frekuensi_teks: string;
  durasi_per_kali: number;
  jam_per_minggu: number;
  peak4w_hours: number;
  ai_mode: TiDetailItem["ai_mode"];
  va_type: TiDetailItem["va_type"];
  dcs_flag: boolean;
}

function defaultRow(): RowState {
  return {
    checked: false,
    sumber_bukti: "Aktual",
    kondisi: "Baseline",
    frekuensi_teks: "Mingguan",
    durasi_per_kali: 60,
    jam_per_minggu: 1,
    peak4w_hours: 0,
    ai_mode: "Human-led",
    va_type: "VA-Core",
    dcs_flag: false,
  };
}

interface Props {
  respondenId: string;
  tasks: TiTaskTerpilihRead[];
  detailAwal: TiDetailRead[];
  accessToken: string | undefined;
}

export function DetailForm({ respondenId, tasks, detailAwal, accessToken }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      tasks.map((t) => {
        const existing = detailAwal.find((d) => d.task_kode === t.kode);
        if (!existing) return [t.kode, defaultRow()];
        const row: RowState = {
          checked: true,
          sumber_bukti: existing.sumber_bukti,
          kondisi: existing.kondisi,
          frekuensi_teks: existing.frekuensi_teks,
          durasi_per_kali: existing.durasi_per_kali,
          jam_per_minggu: existing.jam_per_minggu,
          peak4w_hours: existing.peak4w_hours,
          ai_mode: existing.ai_mode,
          va_type: existing.va_type,
          dcs_flag: existing.dcs_flag,
        };
        return [t.kode, row];
      }),
    ),
  );
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  function update(kode: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [kode]: { ...prev[kode], ...patch } }));
  }

  const checkedCount = Object.values(rows).filter((r) => r.checked).length;

  /** Kumpulkan entri detail yang ditandai & valid; null bila ada isian tidak valid. */
  function buildDetailPayload(): { detail: TiDetailItem[] } | null {
    const detail: TiDetailItem[] = [];
    for (const t of tasks) {
      const r = rows[t.kode];
      if (!r.checked) continue;
      const parsed = detailItemSchema.safeParse({
        task_kode: t.kode,
        sumber_bukti: r.sumber_bukti,
        kondisi: r.kondisi,
        frekuensi_teks: r.frekuensi_teks,
        durasi_per_kali: r.durasi_per_kali,
        jam_per_minggu: r.jam_per_minggu,
        peak4w_hours: r.peak4w_hours,
        ai_mode: r.ai_mode,
        va_type: r.va_type,
        dcs_flag: r.dcs_flag,
      });
      if (!parsed.success) {
        setError(`Periksa isian pada task "${t.uraian_tugas}".`);
        return null;
      }
      detail.push(parsed.data as TiDetailItem);
    }
    return { detail };
  }

  async function handleSave() {
    setError(null);
    setSaveMessage(null);
    const payload = buildDetailPayload();
    if (!payload) return;
    setSaving(true);
    try {
      const client = withServerAuth(accessToken);
      const { error: apiError, response } = await client.PUT(
        "/api/v1/task-inventory/sesi/responden/{responden_id}/detail",
        { params: { path: { responden_id: respondenId } }, body: payload },
      );
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      setSaveMessage("Draft tersimpan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan draft.");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit() {
    setError(null);
    setSaveMessage(null);
    const payload = buildDetailPayload();
    if (!payload) return;
    if (payload.detail.length === 0) {
      setError("Tandai minimal satu tugas yang Anda kerjakan, lalu isi rinciannya.");
      return;
    }
    setSubmitting(true);
    try {
      const client = withServerAuth(accessToken);
      const { error: saveError, response: saveResponse } = await client.PUT(
        "/api/v1/task-inventory/sesi/responden/{responden_id}/detail",
        { params: { path: { responden_id: respondenId } }, body: payload },
      );
      const saveReqId = saveResponse.headers.get("x-request-id");
      if (saveError) throw toApiError(saveError, saveReqId);

      const { error: apiError, response } = await client.POST(
        "/api/v1/task-inventory/sesi/responden/{responden_id}/detail/submit",
        { params: { path: { responden_id: respondenId } } },
      );
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      router.push("/kuesioner");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setSubmitting(false);
    }
  }

  const selectCls =
    "rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const numCls =
    "w-24 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="space-y-5">
      {error && (
        <div role="alert" className="form-server-error">
          {error}
        </div>
      )}
      {saveMessage && !error && (
        <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">{saveMessage}</div>
      )}

      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ditandai dikerjakan: <strong>{checkedCount}</strong> dari {tasks.length} task
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || submitting}
            className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || saving}
            className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? "Mengirim…" : "Kirim Detail"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.map((t) => {
          const r = rows[t.kode];
          return (
            <div key={t.kode} className="rounded-lg border border-gray-200 bg-white p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={r.checked}
                  onChange={(e) => update(t.kode, { checked: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-800">
                  {t.uraian_tugas}
                  <span className="ml-1 text-xs font-normal text-gray-400">({t.tugas_pokok})</span>
                </span>
              </label>

              {r.checked && (
                <div className="mt-4 grid gap-3 pl-7 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="text-xs text-gray-600">
                    Sumber Bukti
                    <select
                      value={r.sumber_bukti}
                      onChange={(e) =>
                        update(t.kode, { sumber_bukti: e.target.value as RowState["sumber_bukti"] })
                      }
                      className={`mt-1 block w-full ${selectCls}`}
                    >
                      {SUMBER_BUKTI.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-gray-600">
                    Kondisi
                    <select
                      value={r.kondisi}
                      onChange={(e) =>
                        update(t.kode, { kondisi: e.target.value as RowState["kondisi"] })
                      }
                      className={`mt-1 block w-full ${selectCls}`}
                    >
                      {KONDISI.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-gray-600">
                    Frekuensi
                    <input
                      type="text"
                      value={r.frekuensi_teks}
                      onChange={(e) => update(t.kode, { frekuensi_teks: e.target.value })}
                      className={`mt-1 block w-full ${selectCls}`}
                    />
                  </label>
                  <label className="text-xs text-gray-600">
                    Durasi/kali (menit)
                    <input
                      type="number"
                      min={0}
                      value={r.durasi_per_kali}
                      onChange={(e) => update(t.kode, { durasi_per_kali: Number(e.target.value) })}
                      className={`mt-1 block ${numCls}`}
                    />
                  </label>
                  <label className="text-xs text-gray-600">
                    Jam/minggu
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={r.jam_per_minggu}
                      onChange={(e) => update(t.kode, { jam_per_minggu: Number(e.target.value) })}
                      className={`mt-1 block ${numCls}`}
                    />
                  </label>
                  <label className="text-xs text-gray-600">
                    Jam peak (4 minggu)
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={r.peak4w_hours}
                      onChange={(e) => update(t.kode, { peak4w_hours: Number(e.target.value) })}
                      className={`mt-1 block ${numCls}`}
                    />
                  </label>
                  <label className="text-xs text-gray-600">
                    AI Mode
                    <select
                      value={r.ai_mode}
                      onChange={(e) =>
                        update(t.kode, { ai_mode: e.target.value as RowState["ai_mode"] })
                      }
                      className={`mt-1 block w-full ${selectCls}`}
                    >
                      {AI_MODE.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-gray-600">
                    VA Type
                    <select
                      value={r.va_type}
                      onChange={(e) =>
                        update(t.kode, { va_type: e.target.value as RowState["va_type"] })
                      }
                      className={`mt-1 block w-full ${selectCls}`}
                    >
                      {VA_TYPE.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 self-end text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={r.dcs_flag}
                      onChange={(e) => update(t.kode, { dcs_flag: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Ada risiko DCS
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ditandai dikerjakan: <strong>{checkedCount}</strong> dari {tasks.length} task
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || submitting}
            className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || saving}
            className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? "Mengirim…" : "Kirim Detail"}
          </button>
        </div>
      </div>
    </div>
  );
}
