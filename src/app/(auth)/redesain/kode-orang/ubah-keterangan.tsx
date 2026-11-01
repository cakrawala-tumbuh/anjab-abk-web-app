"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";

/**
 * Sel "Keterangan peran" yang dapat diubah (`PATCH /api/v1/redesain/kode-orang/{id}`).
 *
 * Hanya `keterangan_peran` yang bisa diubah; tidak ada tombol hapus.
 *
 * @param props.id - ID record kode orang.
 * @param props.awal - Keterangan peran saat ini.
 * @param props.accessToken - Token akses dari Server Component induk.
 */
export function UbahKeterangan({
  id,
  awal,
  accessToken,
}: {
  id: string;
  awal: string;
  accessToken: string | undefined;
}) {
  const router = useRouter();
  const [nilai, setNilai] = useState(awal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function simpan() {
    setLoading(true);
    setError(null);
    try {
      const res = await withServerAuth(accessToken).PATCH(
        "/api/v1/redesain/kode-orang/{kode_orang_id}",
        {
          params: { path: { kode_orang_id: id } },
          body: { keterangan_peran: nilai.trim() },
        },
      );
      if (!res.data) throw apiErrorDari(res);
      notifySukses("Keterangan peran disimpan.");
      router.refresh();
    } catch (err) {
      setError(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        aria-label="Keterangan peran"
        value={nilai}
        onChange={(e) => setNilai(e.target.value)}
        maxLength={200}
        className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
      />
      <button
        type="button"
        onClick={simpan}
        disabled={loading || nilai.trim() === awal}
        className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
      >
        {loading ? "Menyimpan…" : "Simpan"}
      </button>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}
