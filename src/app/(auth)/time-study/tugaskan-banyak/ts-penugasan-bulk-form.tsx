"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { formatAlasanSkip } from "@/lib/format/bulk-skip-alasan";
import type { PartisipanRead, JabatanRead, TsPenugasanBulkResult } from "@/lib/api/schema";

interface Props {
  partisipan: PartisipanRead[];
  jabatan: JabatanRead[];
  accessToken: string | undefined;
}

/**
 * Form penugasan (assign) Time Study secara massal — multi-select partisipan,
 * satu submit untuk menugaskan banyak sekaligus
 * (`POST /api/v1/time-study/penugasan/bulk`).
 *
 * Berdampingan dengan form single (`/time-study/buat`) — endpoint single
 * tidak dihapus. `catatan` diterapkan ke SELURUH baris dalam batch ini.
 */
export function TsPenugasanBulkForm({ partisipan, jabatan, accessToken }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TsPenugasanBulkResult | null>(null);

  const jabatanMap = Object.fromEntries(jabatan.map((j) => [j.id, j.nama]));
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
      } = await client.POST("/api/v1/time-study/penugasan/bulk", {
        body: {
          partisipan_ids: Array.from(selected),
          aktif: true,
          catatan: catatan || null,
        },
      });
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      setResult(data ?? null);
      setSelected(new Set());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  }

  if (partisipan.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500 dark:text-gray-400">
        Seluruh partisipan sudah memiliki penugasan Time Study.
      </div>
    );
  }

  return (
    <div className="form-card space-y-5 p-6">
      {error && (
        <div role="alert" className="form-server-error">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800/50">
          <p className="text-gray-700 dark:text-gray-300">
            {result.created.length} partisipan berhasil ditugaskan.
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

      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="form-label">
            Partisipan <span aria-hidden>*</span>
          </label>
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
              <span className="text-xs text-gray-400">
                {jabatanMap[p.jabatan_utama_id] ?? p.jabatan_utama_id}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="catatan" className="form-label">
          Catatan{" "}
          <span className="font-normal text-gray-400">
            (opsional, berlaku untuk seluruh partisipan terpilih)
          </span>
        </label>
        <textarea
          id="catatan"
          rows={3}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || selected.size === 0}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Menugaskan…" : `Tugaskan Terpilih (${selected.size})`}
        </button>
        <Link
          href="/time-study"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Kembali
        </Link>
      </div>
    </div>
  );
}
