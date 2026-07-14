"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { notifyGagal, notifySukses } from "@/lib/notify";

interface Props {
  respondenId: string;
  nama: string;
  accessToken: string | undefined;
}

export function HapusResponden({ respondenId, nama, accessToken }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleHapus() {
    if (!confirm(`Hapus responden "${nama}" dari WCP?`)) return;
    setLoading(true);
    try {
      const client = withServerAuth(accessToken);
      const { error, response } = await client.DELETE("/api/v1/wcp/responden/{responden_id}", {
        params: { path: { responden_id: respondenId } },
      });
      const reqId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, reqId);
      notifySukses("Responden berhasil dihapus.");
      router.refresh();
    } catch (err) {
      notifyGagal(err);
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
