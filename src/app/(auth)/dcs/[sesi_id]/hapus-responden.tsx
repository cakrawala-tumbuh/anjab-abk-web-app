"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";

interface Props {
  respondenId: string;
  nama: string;
  accessToken: string | undefined;
}

export function HapusResponden({ respondenId, nama, accessToken }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleHapus() {
    if (!confirm(`Hapus responden "${nama}" dari sesi ini?`)) return;
    setLoading(true);
    try {
      const client = withServerAuth(accessToken);
      const { error, response } = await client.DELETE("/api/v1/dcs/sesi/responden/{responden_id}", {
        params: { path: { responden_id: respondenId } },
      });
      const reqId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, reqId);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus responden.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleHapus}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
      aria-label={`Hapus responden ${nama}`}
    >
      {loading ? "…" : "Hapus"}
    </button>
  );
}
