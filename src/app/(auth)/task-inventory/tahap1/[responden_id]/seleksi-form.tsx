"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { TiCatalogRead } from "@/lib/api/schema";

interface Props {
  respondenId: string;
  sesiId: string;
  catalog: TiCatalogRead[];
  accessToken: string | undefined;
}

export function SeleksiForm({ respondenId, sesiId, catalog, accessToken }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kelompokkan task per Tugas Pokok agar mudah ditelusuri partisipan.
  const grouped = useMemo(() => {
    const map = new Map<string, TiCatalogRead[]>();
    for (const t of catalog) {
      const arr = map.get(t.tugas_pokok) ?? [];
      arr.push(t);
      map.set(t.tugas_pokok, arr);
    }
    return Array.from(map.entries());
  }, [catalog]);

  function toggle(kode: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(kode)) next.delete(kode);
      else next.add(kode);
      return next;
    });
  }

  async function onSubmit() {
    if (selected.size === 0) {
      setError("Pilih minimal satu task yang relevan.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error: apiError, response } = await client.POST(
        "/api/v1/task-inventory/sesi/responden/{responden_id}/seleksi",
        {
          params: { path: { responden_id: respondenId } },
          body: { task_kode: Array.from(selected) },
        },
      );
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      router.push(`/task-inventory/${sesiId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div role="alert" className="form-server-error">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Terpilih: <strong>{selected.size}</strong> dari {catalog.length} task
        </p>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Mengirim…" : "Kirim Seleksi"}
        </button>
      </div>

      <div className="space-y-6">
        {grouped.map(([tugasPokok, tasks]) => (
          <fieldset key={tugasPokok} className="rounded-lg border border-gray-200 bg-white p-4">
            <legend className="px-2 text-sm font-semibold text-gray-800">{tugasPokok}</legend>
            <ul className="space-y-2">
              {tasks.map((t) => (
                <li key={t.kode}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selected.has(t.kode)}
                      onChange={() => toggle(t.kode)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {t.uraian_tugas}
                      {t.detil_tugas && (
                        <span className="ml-1 text-xs text-gray-400">({t.detil_tugas})</span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ))}
      </div>
    </div>
  );
}
