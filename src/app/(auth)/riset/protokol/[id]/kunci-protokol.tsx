"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";

/** Teks konfirmasi sebelum protokol dikunci. */
export const KONFIRMASI_KUNCI = "Protokol yang dikunci tidak bisa diubah. Lanjutkan?";

/** Properti {@link KunciProtokol}. */
export interface KunciProtokolProps {
  /** ID protokol berstatus `DRAF`. */
  protokolId: string;
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

/**
 * Tombol "Kunci protokol" (hanya dirender untuk protokol `DRAF` oleh halaman detail).
 *
 * Setelah `confirm()` diterima, `POST /api/v1/riset/protokol/{id}/kunci` (tanpa badan).
 * Penolakan `confirm()` tidak memanggil API. Sukses hanya setelah 2xx, lalu
 * `router.refresh()`; galat backend (mis. `PROTOKOL_TERKUNCI`) tampil apa adanya.
 *
 * @param props - Lihat {@link KunciProtokolProps}.
 */
export function KunciProtokol({ protokolId, accessToken }: KunciProtokolProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function kunci() {
    if (!window.confirm(KONFIRMASI_KUNCI)) return;
    setGalat(null);
    setLoading(true);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/riset/protokol/{protokol_id}/kunci",
        { params: { path: { protokol_id: protokolId } } },
      );
      if (!res.data) throw apiErrorDari(res);
      notifySukses("Protokol dikunci.");
      router.refresh();
    } catch (err) {
      setGalat(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={kunci}
        disabled={loading}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Mengunci…" : "Kunci protokol"}
      </button>
      {galat && (
        <p role="alert" className="form-error">
          {galat}
        </p>
      )}
    </div>
  );
}
