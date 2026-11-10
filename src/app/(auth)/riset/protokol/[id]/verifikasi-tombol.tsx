"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";

/** Properti {@link VerifikasiTombol}. */
export interface VerifikasiTombolProps {
  /** ID statistik berstatus `DRAF`. */
  statistikId: string;
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

/**
 * Tombol "Verifikasi" per statistik `DRAF`.
 *
 * `POST /api/v1/riset/statistik/{id}/verifikasi` (tanpa badan). Pemverifikasi harus akun
 * berbeda dari pengunggah: bila backend menolak (409 `PEMVERIFIKASI_TIDAK_INDEPENDEN`,
 * `STATISTIK_SUDAH_TERVERIFIKASI`, dst.), pesan backend tampil di `role="alert"` dan
 * TIDAK ada notifikasi sukses. Sukses hanya setelah 2xx, lalu `router.refresh()`.
 *
 * @param props - Lihat {@link VerifikasiTombolProps}.
 */
export function VerifikasiTombol({ statistikId, accessToken }: VerifikasiTombolProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function verifikasi() {
    setGalat(null);
    setLoading(true);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/riset/statistik/{statistik_id}/verifikasi",
        { params: { path: { statistik_id: statistikId } } },
      );
      if (!res.data) throw apiErrorDari(res);
      notifySukses("Statistik diverifikasi.");
      router.refresh();
    } catch (err) {
      setGalat(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={verifikasi}
        disabled={loading}
        className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
      >
        {loading ? "Memverifikasi…" : "Verifikasi"}
      </button>
      {galat && (
        <p role="alert" className="text-xs text-red-600">
          {galat}
        </p>
      )}
    </div>
  );
}
