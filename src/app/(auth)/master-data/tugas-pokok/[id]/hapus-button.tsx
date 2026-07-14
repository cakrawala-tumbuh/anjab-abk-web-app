"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";

interface Props {
  id: string;
  nama: string;
  accessToken: string | undefined;
}

export function HapusTugasPokokButton({ id, nama, accessToken }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleHapus() {
    if (!confirm(`Hapus tugas pokok "${nama}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    setIsDeleting(true);
    setServerError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error, response } = await client.DELETE(
        "/api/v1/task-inventory/tugas-pokok/{tp_id}",
        { params: { path: { tp_id: id } } },
      );
      const requestId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, requestId);
      notifySukses("Tugas pokok berhasil dihapus.");
      router.push("/master-data/tugas-pokok");
      router.refresh();
    } catch (err) {
      setServerError(pesanGagal(err));
      notifyGagal(err);
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
        {isDeleting ? "Menghapus…" : "Hapus Tugas Pokok"}
      </button>
    </div>
  );
}
