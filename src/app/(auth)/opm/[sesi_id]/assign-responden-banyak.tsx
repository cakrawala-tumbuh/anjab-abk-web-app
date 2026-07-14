"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { formatAlasanSkip } from "@/lib/format/bulk-skip-alasan";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import type { PartisipanRead, OpmRespondenBulkResult } from "@/lib/api/schema";

interface Props {
  sesiId: string;
  /** Hanya partisipan yang merupakan anggota SME panel jabatan sesi ini dan belum terdaftar. */
  partisipan: PartisipanRead[];
  accessToken: string | undefined;
}

/**
 * Form penugasan (assign) responden OPM secara massal — multi-select, satu
 * submit untuk banyak partisipan sekaligus
 * (`POST /api/v1/opm/sesi/{sesi_id}/responden/bulk`).
 *
 * Berdampingan dengan `TambahResponden` (form single) — endpoint single tidak
 * dihapus. Beda dari form single: `nama`/`jabatan_label` diresolusi otomatis
 * oleh backend, tidak perlu dikirim di sini.
 */
export function AssignRespondenBanyak({ sesiId, partisipan, accessToken }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OpmRespondenBulkResult | null>(null);

  const partisipanMap = Object.fromEntries(partisipan.map((p) => [p.id, p.nama]));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(partisipan.map((p) => p.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  async function onSubmit() {
    if (selected.size === 0) return;
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const client = withServerAuth(accessToken);
      const {
        data,
        error: apiError,
        response,
      } = await client.POST("/api/v1/opm/sesi/{sesi_id}/responden/bulk", {
        params: { path: { sesi_id: sesiId } },
        body: { partisipan_ids: Array.from(selected) },
      });
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      setResult(data ?? null);
      setSelected(new Set());
      notifySukses(`${data!.created.length} responden berhasil ditambahkan.`);
      router.refresh();
    } catch (err) {
      setError(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (partisipan.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      {error && (
        <div role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mb-4 rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800/50">
          <p className="text-gray-700 dark:text-gray-300">
            {result.created.length} responden berhasil ditambahkan.
          </p>
          {result.skipped.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-gray-500 dark:text-gray-400">
              {result.skipped.map((s) => (
                <li key={s.partisipan_id}>
                  {partisipanMap[s.partisipan_id] ?? s.partisipan_id} — {formatAlasanSkip(s.alasan)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Atau tugaskan banyak anggota SME panel sekaligus.
        </p>
        <div className="flex gap-3 text-xs">
          <button
            type="button"
            onClick={selectAll}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            Pilih semua
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="text-gray-500 hover:text-gray-700 hover:underline"
          >
            Batalkan pilihan
          </button>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto rounded-md border border-gray-100 dark:border-gray-700">
        {partisipan.map((p) => (
          <label
            key={p.id}
            className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
          >
            <input
              type="checkbox"
              checked={selected.has(p.id)}
              onChange={() => toggle(p.id)}
              className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-900 dark:text-gray-100">{p.nama}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || selected.size === 0}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Menugaskan…" : `Tugaskan Terpilih (${selected.size})`}
        </button>
      </div>
    </div>
  );
}
