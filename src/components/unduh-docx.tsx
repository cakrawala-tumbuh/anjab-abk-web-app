"use client";

import { useState } from "react";
import { notifyGagal } from "@/lib/notify";

/** Nama berkas dari `Content-Disposition` (`filename="..."`); jatuh ke `fallback`. */
function namaBerkasDari(contentDisposition: string | null, fallback: string): string {
  if (!contentDisposition) return fallback;
  const match = /filename="?([^";]+)"?/.exec(contentDisposition);
  return match?.[1] ?? fallback;
}

/**
 * Tombol unduh DOCX lewat route handler proxy server (`/api/redesain/ekspor/*`) —
 * token akses TIDAK pernah ada di browser. Nama berkas diambil dari `Content-Disposition`
 * yang diteruskan proxy. Kegagalan dilaporkan lewat `notifyGagal`; status 404 memakai
 * `pesan404` bila diberikan (mis. agenda kosong), selain itu pesan dari backend.
 *
 * @param props.href - URL route proxy (relatif).
 * @param props.label - Teks tombol.
 * @param props.pesan404 - Pesan toast khusus untuk jawaban 404 (opsional).
 * @param props.namaCadangan - Nama berkas bila `Content-Disposition` tak ada.
 */
export function UnduhDocx({
  href,
  label,
  pesan404,
  namaCadangan = "ringkasan.docx",
}: {
  href: string;
  label: string;
  pesan404?: string;
  namaCadangan?: string;
}) {
  const [memuat, setMemuat] = useState(false);

  async function klik() {
    setMemuat(true);
    try {
      const res = await fetch(href);
      if (!res.ok) {
        if (res.status === 404 && pesan404) throw new Error(pesan404);
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? "Gagal mengunduh berkas.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = namaBerkasDari(res.headers.get("content-disposition"), namaCadangan);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      notifyGagal(err);
    } finally {
      setMemuat(false);
    }
  }

  return (
    <button
      type="button"
      onClick={klik}
      disabled={memuat}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:hover:bg-gray-800"
    >
      {memuat ? "Mengunduh…" : label}
    </button>
  );
}
