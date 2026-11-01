"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { notifyGagal, notifySukses } from "@/lib/notify";

/** Properti {@link MulaiPenilaian}. */
export interface MulaiPenilaianProps {
  masalahId: string;
  accessToken: string | undefined;
}

/** Nilai awal wajib penilaian baru (isian wajib backend; K1–K4 dibiarkan kosong). */
const AWAL = {
  status_bukti: "Hipotesis",
  gap_material: "Belum tahu",
  indikasi_kritis: "Belum tahu",
} as const;

/**
 * Tombol "Mulai penilaian" saat masalah belum punya penilaian.
 *
 * `POST /api/v1/redesain/penilaian` (201) dengan isian wajib bernilai awal netral. Status
 * 409 (penilaian sudah dibuat pihak lain) bukan kegagalan bagi pengguna: cukup
 * `router.refresh()` tanpa toast sukses. Kegagalan lain → toast gagal.
 *
 * @param props - Lihat {@link MulaiPenilaianProps}.
 */
export function MulaiPenilaian({ masalahId, accessToken }: MulaiPenilaianProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function mulai() {
    setLoading(true);
    try {
      const res = await withServerAuth(accessToken).POST("/api/v1/redesain/penilaian", {
        body: { masalah_id: masalahId, ...AWAL },
      });
      if (!res.data) {
        if (res.response?.status === 409) {
          router.refresh();
          return;
        }
        throw apiErrorDari(res);
      }
      notifySukses("Penilaian dimulai.");
      router.refresh();
    } catch (err) {
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500 dark:text-gray-400">Masalah ini belum dinilai.</p>
      <button
        type="button"
        onClick={mulai}
        disabled={loading}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Memulai…" : "Mulai penilaian"}
      </button>
    </div>
  );
}
