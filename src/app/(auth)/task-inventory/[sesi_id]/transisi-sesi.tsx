"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { TiSesiRead } from "@/lib/api/schema";

interface Props {
  sesi: TiSesiRead;
  accessToken: string | undefined;
}

export function TransisiSesi({ sesi, accessToken }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post(
    path:
      | "/api/v1/task-inventory/sesi/{sesi_id}/mulai-tahap1"
      | "/api/v1/task-inventory/sesi/{sesi_id}/tutup"
      | "/api/v1/task-inventory/sesi/{sesi_id}/analisis",
  ) {
    setLoading(true);
    setError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error: apiError, response } = await client.POST(path, {
        params: { path: { sesi_id: sesi.id } },
      });
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  async function mulaiTahap2() {
    const paksa = !confirm(
      "Mulai Tahap 2 sekarang? Tekan OK bila semua partisipan sudah submit Tahap 1, " +
        "atau Cancel untuk memaksa lanjut walau belum semua submit.",
    );
    setLoading(true);
    setError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error: apiError, response } = await client.POST(
        "/api/v1/task-inventory/sesi/{sesi_id}/mulai-tahap2",
        { params: { path: { sesi_id: sesi.id }, query: { paksa } } },
      );
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  async function doHapus() {
    if (!confirm("Hapus sesi ini? Tindakan tidak dapat dibatalkan.")) return;
    setLoading(true);
    setError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error: apiError, response } = await client.DELETE(
        "/api/v1/task-inventory/sesi/{sesi_id}",
        { params: { path: { sesi_id: sesi.id } } },
      );
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      router.push("/task-inventory");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
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
            onClick={() => post("/api/v1/task-inventory/sesi/{sesi_id}/mulai-tahap1")}
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Memproses…" : "Mulai Tahap 1"}
          </button>
          <button
            onClick={doHapus}
            disabled={loading}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Hapus Sesi
          </button>
        </>
      )}

      {sesi.status === "TAHAP1" && (
        <button
          onClick={mulaiTahap2}
          disabled={loading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Memproses…" : "Mulai Tahap 2 (bekukan task relevan)"}
        </button>
      )}

      {sesi.status === "TAHAP2" && (
        <button
          onClick={() => post("/api/v1/task-inventory/sesi/{sesi_id}/tutup")}
          disabled={loading}
          className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-60"
        >
          {loading ? "Memproses…" : "Tutup Sesi"}
        </button>
      )}

      {sesi.status === "CLOSED" && (
        <button
          onClick={() => post("/api/v1/task-inventory/sesi/{sesi_id}/analisis")}
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
    </div>
  );
}
