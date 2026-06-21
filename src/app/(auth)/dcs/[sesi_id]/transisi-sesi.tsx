"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { DcsSesiRead } from "@/lib/api/schema";

interface Props {
  sesi: DcsSesiRead;
  accessToken: string | undefined;
}

export function TransisiSesi({ sesi, accessToken }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doTransisi(aksi: "buka" | "tutup") {
    setLoading(true);
    setError(null);
    try {
      const client = withServerAuth(accessToken);
      const path =
        aksi === "buka" ? "/api/v1/dcs/sesi/{sesi_id}/buka" : "/api/v1/dcs/sesi/{sesi_id}/tutup";
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

  async function doHapus() {
    if (!confirm("Hapus sesi ini? Tindakan tidak dapat dibatalkan.")) return;
    setLoading(true);
    setError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error: apiError, response } = await client.DELETE("/api/v1/dcs/sesi/{sesi_id}", {
        params: { path: { sesi_id: sesi.id } },
      });
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      router.push("/dcs");
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
            onClick={() => doTransisi("buka")}
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Memproses…" : "Buka Sesi"}
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

      {sesi.status === "OPEN" && (
        <button
          onClick={() => doTransisi("tutup")}
          disabled={loading}
          className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-60"
        >
          {loading ? "Memproses…" : "Tutup Sesi"}
        </button>
      )}

      {sesi.status === "CLOSED" && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Sesi tertutup. Jalankan analisis dari backend untuk memproses hasil.
        </p>
      )}

      {sesi.status === "ANALYZED" && (
        <p className="text-sm text-green-700 font-medium">
          ✓ Analisis selesai. Lihat hasil di halaman laporan.
        </p>
      )}
    </div>
  );
}
