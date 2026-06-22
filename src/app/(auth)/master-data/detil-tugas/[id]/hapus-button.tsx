"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";

interface Props {
  id: string;
  nama: string;
  accessToken: string | undefined;
}

export function HapusDetilTugasButton({ id, nama, accessToken }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleHapus() {
    if (!confirm(`Hapus detil tugas "${nama}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    setIsDeleting(true);
    setServerError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error, response } = await client.DELETE(
        "/api/v1/task-inventory/detil-tugas/{dt_id}",
        { params: { path: { dt_id: id } } },
      );
      const requestId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, requestId);
      router.push("/master-data/detil-tugas");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-2">
      {serverError && (
        <div role="alert" className="form-server-error">
          {serverError}
        </div>
      )}
      <button
        type="button"
        onClick={handleHapus}
        disabled={isDeleting}
        className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        {isDeleting ? "Menghapus…" : "Hapus Detil Tugas"}
      </button>
    </div>
  );
}
