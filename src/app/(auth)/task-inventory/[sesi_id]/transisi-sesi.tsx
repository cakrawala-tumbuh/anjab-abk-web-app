"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import type { TiSesiRead } from "@/lib/api/schema";

type SimplePath =
  | "/api/v1/task-inventory/sesi/{sesi_id}/mulai-tahap1"
  | "/api/v1/task-inventory/sesi/{sesi_id}/tutup"
  | "/api/v1/task-inventory/sesi/{sesi_id}/analisis";

type PaksaPath =
  | "/api/v1/task-inventory/sesi/{sesi_id}/mulai-tahap2"
  | "/api/v1/task-inventory/sesi/{sesi_id}/mulai-tahap3";

interface Props {
  sesi: TiSesiRead;
  accessToken: string | undefined;
  /** Jumlah partisipan yang belum submit Tahap 1 — dipakai untuk tombol "Mulai Tahap 2". */
  belumSubmitTahap1?: number;
  /** Jumlah task partial yang belum diputuskan koordinator — dipakai untuk "Mulai Tahap 3". */
  belumDiputuskanTahap2?: number;
}

export function TransisiSesi({
  sesi,
  accessToken,
  belumSubmitTahap1 = 0,
  belumDiputuskanTahap2 = 0,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paksaTahap2, setPaksaTahap2] = useState(false);
  const [paksaTahap3, setPaksaTahap3] = useState(false);

  /** Helper bersama: kirim POST transisi, opsional query `paksa`, refresh pada sukses. */
  async function post(path: SimplePath, pesanSukses: string): Promise<void>;
  async function post(path: PaksaPath, pesanSukses: string, paksa: boolean): Promise<void>;
  async function post(
    path: SimplePath | PaksaPath,
    pesanSukses: string,
    paksa?: boolean,
  ): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error: apiError, response } =
        paksa === undefined
          ? await client.POST(path as SimplePath, { params: { path: { sesi_id: sesi.id } } })
          : await client.POST(path as PaksaPath, {
              params: { path: { sesi_id: sesi.id }, query: { paksa } },
            });
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      notifySukses(pesanSukses);
      router.refresh();
    } catch (err) {
      setError(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  function mulaiTahap2() {
    const pesan =
      paksaTahap2 && belumSubmitTahap1 > 0
        ? `Mulai Tahap 2 sekarang? Masih ada ${belumSubmitTahap1} partisipan yang belum submit ` +
          'Tahap 1 — mereka akan dilewati sesuai centang "lanjutkan walau belum semua submit".'
        : "Mulai Tahap 2 sekarang? Pastikan semua partisipan sudah submit Tahap 1.";
    if (!confirm(pesan)) return;
    void post(
      "/api/v1/task-inventory/sesi/{sesi_id}/mulai-tahap2",
      "Sesi dilanjutkan ke Tahap 2.",
      paksaTahap2,
    );
  }

  function mulaiTahap3() {
    const pesan =
      paksaTahap3 && belumDiputuskanTahap2 > 0
        ? `Mulai Tahap 3 sekarang? Masih ada ${belumDiputuskanTahap2} task partial yang belum ` +
          'diputuskan koordinator — sesuai centang "lanjutkan walau belum diputuskan", task tersebut akan diabaikan.'
        : "Mulai Tahap 3 sekarang? Pastikan koordinator sudah memutuskan semua task partial.";
    if (!confirm(pesan)) return;
    void post(
      "/api/v1/task-inventory/sesi/{sesi_id}/mulai-tahap3",
      "Sesi dilanjutkan ke Tahap 3.",
      paksaTahap3,
    );
  }

  async function doHapus(paksa: boolean) {
    const pesan = paksa
      ? "Hapus PAKSA analisis ini beserta SELURUH responden, seleksi, detail, dan " +
        "keputusan Tahap 2-nya? Tindakan ini PERMANEN dan TIDAK DAPAT DIBATALKAN."
      : "Hapus analisis ini? Tindakan tidak dapat dibatalkan.";
    if (!confirm(pesan)) return;
    setLoading(true);
    setError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error: apiError, response } = await client.DELETE(
        "/api/v1/task-inventory/sesi/{sesi_id}",
        { params: { path: { sesi_id: sesi.id }, query: { paksa } } },
      );
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      notifySukses("Analisis jabatan berhasil dihapus.");
      router.push("/task-inventory");
      router.refresh();
    } catch (err) {
      setError(pesanGagal(err));
      notifyGagal(err);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      {error && (
        <p className="w-full text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {sesi.status === "DRAFT" && (
        <>
          <button
            onClick={() =>
              post(
                "/api/v1/task-inventory/sesi/{sesi_id}/mulai-tahap1",
                "Sesi dilanjutkan ke Tahap 1.",
              )
            }
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Memproses…" : "Mulai Tahap 1"}
          </button>
          <button
            onClick={() => doHapus(false)}
            disabled={loading}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Hapus Analisis
          </button>
        </>
      )}

      {sesi.status === "TAHAP1" && (
        <div className="flex flex-col gap-2">
          <button
            onClick={mulaiTahap2}
            disabled={loading}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
          >
            {loading ? "Memproses…" : "Mulai Tahap 2 — Review Koordinator"}
          </button>
          {belumSubmitTahap1 > 0 && (
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={paksaTahap2}
                onChange={(e) => setPaksaTahap2(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              Lanjutkan walau {belumSubmitTahap1} partisipan belum submit Tahap 1
            </label>
          )}
        </div>
      )}

      {sesi.status === "TAHAP2" && (
        <div className="flex flex-col gap-2">
          <button
            onClick={mulaiTahap3}
            disabled={loading}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Memproses…" : "Mulai Tahap 3 — Bekukan Task Relevan"}
          </button>
          {belumDiputuskanTahap2 > 0 && (
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={paksaTahap3}
                onChange={(e) => setPaksaTahap3(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Lanjutkan walau {belumDiputuskanTahap2} task belum diputuskan koordinator
            </label>
          )}
        </div>
      )}

      {sesi.status === "TAHAP3" && (
        <button
          onClick={() => post("/api/v1/task-inventory/sesi/{sesi_id}/tutup", "Sesi ditutup.")}
          disabled={loading}
          className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-60"
        >
          {loading ? "Memproses…" : "Tutup Analisis"}
        </button>
      )}

      {sesi.status === "CLOSED" && (
        <button
          onClick={() =>
            post("/api/v1/task-inventory/sesi/{sesi_id}/analisis", "Analisis selesai.")
          }
          disabled={loading}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? "Memproses…" : "Jalankan Analisis"}
        </button>
      )}

      {sesi.status === "ANALYZED" && (
        <p className="text-sm font-medium text-green-700">
          ✓ Analisis selesai. Hasil tersedia di bawah.
        </p>
      )}

      {sesi.status !== "DRAFT" && (
        <div className="mt-1 w-full border-t border-red-200 pt-3 dark:border-red-900">
          <button
            onClick={() => doHapus(true)}
            disabled={loading}
            className="text-xs text-red-600 underline hover:text-red-800 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
          >
            Hapus paksa analisis ini — SELURUH responden, seleksi & detail ikut terhapus permanen
          </button>
        </div>
      )}
    </div>
  );
}
