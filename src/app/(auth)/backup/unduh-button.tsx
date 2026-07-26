"use client";

import { useState } from "react";
import { pesanGagal } from "@/lib/notify";

/**
 * Ekstrak nama berkas dari header `Content-Disposition` (`attachment; filename="..."`).
 *
 * Jatuh ke `"backup.dump"` bila header tidak ada atau tidak mengandung `filename`.
 */
function namaBerkasDari(contentDisposition: string | null): string {
  if (!contentDisposition) return "backup.dump";
  const match = /filename="?([^";]+)"?/.exec(contentDisposition);
  return match?.[1] ?? "backup.dump";
}

/**
 * Tombol untuk memicu unduhan cadangan penuh basis data.
 *
 * Memanggil proxy server-side `/api/backup/unduh` (BUKAN backend langsung — token
 * akses tidak pernah ada di browser), lalu memicu unduhan berkas lewat elemen `<a>`
 * sementara dengan nama dari header `Content-Disposition` yang diteruskan proxy apa
 * adanya dari backend.
 */
export function UnduhButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/backup/unduh", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? "Gagal mengunduh cadangan.");
      }
      const blob = await res.blob();
      const nama = namaBerkasDari(res.headers.get("content-disposition"));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nama;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(pesanGagal(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Mengunduh…" : "Unduh Cadangan"}
      </button>
    </div>
  );
}
