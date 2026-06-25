"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { TiCatalogRead } from "@/lib/api/schema";

interface Props {
  respondenId: string;
  catalog: TiCatalogRead[];
  accessToken: string | undefined;
}

/** Sentinel untuk task yang langsung berada di bawah tugas pokok (tanpa detil tugas). */
const NO_DETIL = "__none__";
const NO_DETIL_LABEL = "(Langsung di bawah tugas pokok)";

/**
 * Kunci detil tugas yang konsisten: pakai `detil_tugas_id` bila ada, atau sentinel
 * per tugas pokok bila task langsung melekat ke tugas pokok (detil_tugas null).
 */
function detilKey(item: TiCatalogRead): string {
  return item.detil_tugas_id ?? `${item.tugas_pokok_id}::${NO_DETIL}`;
}

/**
 * Formulir Tahap 1 — seleksi relevansi bertingkat (cascade 3 level):
 *   1. Tugas Pokok  → partisipan pilih tugas pokok yang relevan dengan jabatannya.
 *   2. Detil Tugas  → hanya detil tugas dari tugas pokok terpilih yang ditampilkan.
 *   3. Uraian Tugas → hanya uraian tugas dari detil tugas terpilih yang ditampilkan;
 *      uraian tugas terpilih (kode) inilah yang disubmit sebagai seleksi.
 *
 * Catalog sudah difilter backend ke jabatan (dan unit) sesi, sehingga seluruh
 * cascade konsisten dengan jabatan dari sesi yang diikuti partisipan.
 */
export function SeleksiForm({ respondenId, catalog, accessToken }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTP, setSelectedTP] = useState<Set<string>>(new Set());
  const [selectedDT, setSelectedDT] = useState<Set<string>>(new Set());
  const [selectedUT, setSelectedUT] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Level 1: daftar tugas pokok unik (id → nama) ───────────────────────────
  const tugasPokokList = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of catalog) map.set(t.tugas_pokok_id, t.tugas_pokok);
    return Array.from(map, ([id, nama]) => ({ id, nama })).sort((a, b) =>
      a.nama.localeCompare(b.nama),
    );
  }, [catalog]);

  // ── Level 2: detil tugas dari tugas pokok terpilih, dikelompokkan per tugas pokok ─
  const detilGroups = useMemo(() => {
    const groups = new Map<string, { tugasPokok: string; detils: Map<string, string> }>();
    for (const t of catalog) {
      if (!selectedTP.has(t.tugas_pokok_id)) continue;
      const g = groups.get(t.tugas_pokok_id) ?? {
        tugasPokok: t.tugas_pokok,
        detils: new Map<string, string>(),
      };
      g.detils.set(detilKey(t), t.detil_tugas ?? NO_DETIL_LABEL);
      groups.set(t.tugas_pokok_id, g);
    }
    return Array.from(groups.values())
      .sort((a, b) => a.tugasPokok.localeCompare(b.tugasPokok))
      .map((g) => ({
        tugasPokok: g.tugasPokok,
        detils: Array.from(g.detils, ([key, label]) => ({ key, label })).sort((a, b) =>
          a.label.localeCompare(b.label),
        ),
      }));
  }, [catalog, selectedTP]);

  // ── Level 3: uraian tugas dari detil tugas terpilih, dikelompokkan per detil ─
  const uraianGroups = useMemo(() => {
    const groups = new Map<string, { label: string; tasks: TiCatalogRead[] }>();
    for (const t of catalog) {
      const key = detilKey(t);
      if (!selectedDT.has(key)) continue;
      const label = `${t.detil_tugas ?? NO_DETIL_LABEL} · ${t.tugas_pokok}`;
      const g = groups.get(key) ?? { label, tasks: [] };
      g.tasks.push(t);
      groups.set(key, g);
    }
    return Array.from(groups.values())
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((g) => ({
        label: g.label,
        tasks: g.tasks.slice().sort((a, b) => a.urutan - b.urutan),
      }));
  }, [catalog, selectedDT]);

  function toggle(setFn: typeof setSelectedTP, key: string) {
    setError(null);
    setFn((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Lanjut dari Level 1 → 2: buang detil terpilih yang tugas pokoknya tak lagi dipilih.
  function nextFromTugasPokok() {
    if (selectedTP.size === 0) {
      setError("Pilih minimal satu tugas pokok yang relevan.");
      return;
    }
    const validDetil = new Set(
      catalog.filter((t) => selectedTP.has(t.tugas_pokok_id)).map(detilKey),
    );
    setSelectedDT((prev) => new Set([...prev].filter((k) => validDetil.has(k))));
    setError(null);
    setStep(2);
  }

  // Lanjut dari Level 2 → 3: buang uraian terpilih yang detilnya tak lagi dipilih.
  function nextFromDetilTugas() {
    if (selectedDT.size === 0) {
      setError("Pilih minimal satu detil tugas yang relevan.");
      return;
    }
    const validKode = new Set(
      catalog.filter((t) => selectedDT.has(detilKey(t))).map((t) => t.kode),
    );
    setSelectedUT((prev) => new Set([...prev].filter((k) => validKode.has(k))));
    setError(null);
    setStep(3);
  }

  async function onSubmit() {
    if (selectedUT.size === 0) {
      setError("Pilih minimal satu uraian tugas yang relevan.");
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
          body: { task_kode: Array.from(selectedUT) },
        },
      );
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      // Partisipan kembali ke daftar kuesioner miliknya, bukan ke halaman
      // detail sesi yang khusus admin (akan memicu notFound bagi partisipan).
      router.push("/kuesioner");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setSubmitting(false);
    }
  }

  const stepTitle = step === 1 ? "Tugas Pokok" : step === 2 ? "Detil Tugas" : "Uraian Tugas";

  return (
    <div className="space-y-5">
      {error && (
        <div role="alert" className="form-server-error">
          {error}
        </div>
      )}

      {/* Indikator langkah */}
      <ol className="flex items-center gap-2 text-xs font-medium">
        {(["Tugas Pokok", "Detil Tugas", "Uraian Tugas"] as const).map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const active = n === step;
          const done = n < step;
          return (
            <li
              key={label}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${
                active
                  ? "bg-blue-600 text-white"
                  : done
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              <span>{n}</span>
              <span>{label}</span>
            </li>
          );
        })}
      </ol>

      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Langkah {step} dari 3 — <strong>{stepTitle}</strong>
        </p>
      </div>

      {/* ── Level 1: Tugas Pokok ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Pilih tugas pokok yang relevan untuk jabatan Anda.
          </p>
          <fieldset className="rounded-lg border border-gray-200 bg-white p-4">
            <legend className="px-2 text-sm font-semibold text-gray-800">
              Tugas Pokok ({selectedTP.size} terpilih)
            </legend>
            <ul className="space-y-2">
              {tugasPokokList.map((tp) => (
                <li key={tp.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedTP.has(tp.id)}
                      onChange={() => toggle(setSelectedTP, tp.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{tp.nama}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          <div className="flex justify-end">
            <button
              onClick={nextFromTugasPokok}
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Lanjut ke Detil Tugas
            </button>
          </div>
        </div>
      )}

      {/* ── Level 2: Detil Tugas ─────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Pilih detil tugas yang relevan — hanya dari tugas pokok yang Anda pilih.
          </p>
          {detilGroups.map((g) => (
            <fieldset key={g.tugasPokok} className="rounded-lg border border-gray-200 bg-white p-4">
              <legend className="px-2 text-sm font-semibold text-gray-800">{g.tugasPokok}</legend>
              <ul className="space-y-2">
                {g.detils.map((d) => (
                  <li key={d.key}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedDT.has(d.key)}
                        onChange={() => toggle(setSelectedDT, d.key)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{d.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          ))}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setError(null);
                setStep(1);
              }}
              className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Kembali
            </button>
            <button
              onClick={nextFromDetilTugas}
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Lanjut ke Uraian Tugas
            </button>
          </div>
        </div>
      )}

      {/* ── Level 3: Uraian Tugas ────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Pilih uraian tugas yang relevan — hanya dari detil tugas yang Anda pilih.
          </p>
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Terpilih: <strong>{selectedUT.size}</strong> uraian tugas
            </p>
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Mengirim…" : "Kirim Seleksi"}
            </button>
          </div>
          {uraianGroups.map((g) => (
            <fieldset key={g.label} className="rounded-lg border border-gray-200 bg-white p-4">
              <legend className="px-2 text-sm font-semibold text-gray-800">{g.label}</legend>
              <ul className="space-y-2">
                {g.tasks.map((t) => (
                  <li key={t.kode}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedUT.has(t.kode)}
                        onChange={() => toggle(setSelectedUT, t.kode)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{t.uraian_tugas}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          ))}
          <div className="flex justify-start">
            <button
              onClick={() => {
                setError(null);
                setStep(2);
              }}
              className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Kembali
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
