"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";

interface Props {
  penugasanId: string;
  nama: string;
  accessToken: string | undefined;
}

export function HapusPenugasan({ penugasanId, nama, accessToken }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleHapus() {
    if (
      !confirm(
        `Hapus penugasan Time Study untuk "${nama}"? Riwayat log harian tidak akan bisa diakses lagi lewat penugasan ini.`,
      )
    )
      return;
    setLoading(true);
    try {
      const client = withServerAuth(accessToken);
      const { error, response } = await client.DELETE(
        "/api/v1/time-study/penugasan/{penugasan_id}",
        {
          params: { path: { penugasan_id: penugasanId } },
        },
      );
      const reqId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, reqId);
      router.push("/time-study");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus penugasan.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleHapus}
      disabled={loading}
      className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
    >
      {loading ? "Menghapus…" : "Hapus Penugasan"}
    </button>
  );
}
