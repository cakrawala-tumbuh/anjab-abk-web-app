"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { notifyGagal, notifySukses } from "@/lib/notify";

/**
 * Tombol "Buka untuk konfirmasi sekolah" / "Tutup" sebuah masalah.
 *
 * Memanggil `POST .../masalah/{id}/status-konfirmasi` dengan `{dibuka: !dibuka}` lalu
 * `router.refresh()`. Kegagalan lewat `notifyGagal`, tidak ada toast sukses.
 *
 * @param props.id - ID masalah.
 * @param props.dibuka - Status sekarang (`dibuka_untuk_konfirmasi`).
 * @param props.accessToken - Token akses dari Server Component induk.
 */
export function ToggleKonfirmasi({
  id,
  dibuka,
  accessToken,
}: {
  id: string;
  dibuka: boolean;
  accessToken: string | undefined;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function ganti() {
    setLoading(true);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/redesain/masalah/{masalah_id}/status-konfirmasi",
        { params: { path: { masalah_id: id } }, body: { dibuka: !dibuka } },
      );
      if (!res.data) throw apiErrorDari(res);
      notifySukses(
        dibuka ? "Masalah ditutup untuk konfirmasi." : "Masalah dibuka untuk konfirmasi.",
      );
      router.refresh();
    } catch (err) {
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={
          dibuka ? "text-green-700 dark:text-green-400" : "text-gray-500 dark:text-gray-400"
        }
      >
        {dibuka ? "Dibuka" : "Tertutup"}
      </span>
      <button
        type="button"
        onClick={ganti}
        disabled={loading}
        className="rounded-md border border-gray-300 px-2 py-0.5 text-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
      >
        {dibuka ? "Tutup" : "Buka untuk konfirmasi sekolah"}
      </button>
    </div>
  );
}
