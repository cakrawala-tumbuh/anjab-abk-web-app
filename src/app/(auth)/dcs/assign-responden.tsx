"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { DaftarPilihTerpaginasi } from "@/components/daftar-pilih-terpaginasi";
import { formatAlasanSkip } from "@/lib/format/bulk-skip-alasan";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import type { JabatanRead, PartisipanRead, DcsRespondenBulkResult } from "@/lib/api/schema";

interface Props {
  partisipan: PartisipanRead[];
  jabatan: JabatanRead[];
  accessToken: string | undefined;
}

/**
 * Form penugasan (assign) responden DCS — multi-select, satu submit untuk
 * banyak partisipan sekaligus (`POST /api/v1/dcs/responden` menerima
 * `partisipan_ids: string[]`).
 *
 * Daftar kandidat dirender oleh `DaftarPilihTerpaginasi` sehingga terpaginasi
 * sendiri, lepas dari paginasi URL (`?hlm_responden=`) milik tabel "Daftar
 * Responden" di halaman yang sama. Himpunan `selected` tetap dipegang di sini
 * agar centangan bertahan saat pengguna berpindah halaman kandidat, dan satu
 * submit mengirim seluruh id terpilih lintas halaman.
 */
export function AssignResponden({ partisipan, jabatan, accessToken }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DcsRespondenBulkResult | null>(null);

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

  /** Tambahkan `ids` ke pilihan tanpa menghapus centangan halaman lain. */
  function pilihSemua(ids: string[]) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
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
      } = await client.POST("/api/v1/dcs/responden", {
        body: { partisipan_ids: Array.from(selected) },
      });
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      setResult(data ?? null);
      const createdIds = (data?.created ?? [])
        .map((r) => r.partisipan_id)
        .filter((id): id is string => !!id);
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of createdIds) {
          next.delete(id);
        }
        return next;
      });
      notifySukses(`${data?.created.length ?? 0} responden berhasil ditambahkan.`);
      router.refresh();
    } catch (err) {
      setError(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (partisipan.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500 dark:text-gray-400">
        Seluruh partisipan sudah ditugaskan sebagai responden DCS.
      </div>
    );
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

      <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
        Pilih satu atau lebih partisipan untuk ditugaskan sebagai responden DCS. Centangan bertahan
        saat berpindah halaman.
      </p>

      <DaftarPilihTerpaginasi
        items={partisipan.map((p) => ({
          id: p.id,
          label: p.nama,
          keterangan: jabatanMap[p.jabatan_utama_id] ?? p.jabatan_utama_id,
        }))}
        terpilih={selected}
        onToggle={toggle}
        onPilihSemua={pilihSemua}
        onBatalkan={clearAll}
      />

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
