"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/schema";

type TsPenugasanRead = components["schemas"]["TsPenugasanRead"];

interface Props {
  penugasan: TsPenugasanRead;
  accessToken: string | undefined;
}

export function ToggleAktif({ penugasan, accessToken }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setLoading(true);
    setError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error: apiError, response } = await client.PATCH(
        "/api/v1/time-study/penugasan/{penugasan_id}",
        {
          params: { path: { penugasan_id: penugasan.id } },
          body: { aktif: !penugasan.aktif },
        },
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

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      {error && (
        <p className="w-full text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {penugasan.aktif ? (
        <button
          onClick={handleToggle}
          disabled={loading}
          className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-60"
        >
          {loading ? "Memproses…" : "Nonaktifkan Penugasan"}
        </button>
      ) : (
        <button
          onClick={handleToggle}
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Memproses…" : "Aktifkan Kembali"}
        </button>
      )}
    </div>
  );
}
