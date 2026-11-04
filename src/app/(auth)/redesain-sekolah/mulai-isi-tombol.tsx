"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

/**
 * Tombol "Mulai isi": membuat konfirmasi draf untuk satu masalah lalu membuka wizard.
 *
 * 409 (sudah ada draf/terkirim — mis. dibuat di tab lain) → `router.refresh()` agar
 * tombol berganti menjadi "Lanjutkan"/"Lihat", bukan pesan galat. Kecuali 409 `conflict`
 * (key masih diproses): itu ditampilkan sebagai pesan baku. POST membawa `Idempotency-Key`
 * per upaya; key diganti hanya setelah respons sukses.
 *
 * @param props.masalahId - ID masalah yang akan dikonfirmasi.
 * @param props.accessToken - Token akses dari Server Component induk.
 */
export function MulaiIsiTombol({
  masalahId,
  accessToken,
}: {
  masalahId: string;
  accessToken: string | undefined;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idem = useIdempotencyKey();

  async function mulai() {
    setLoading(true);
    setError(null);
    try {
      const res = await withServerAuth(accessToken).POST("/api/v1/redesain/konfirmasi", {
        body: { masalah_id: masalahId },
        headers: headerIdempotencyKey(idem.key),
      });
      if (res.response.status === 409) {
        const galat = apiErrorDari(res);
        if (galat.code !== "conflict") {
          router.refresh();
          return;
        }
        throw galat;
      }
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      notifySukses("Konfirmasi dimulai.");
      router.push(`/redesain-sekolah/konfirmasi/${res.data.id}`);
    } catch (galatMentah) {
      const err = petakanKonkurensi(galatMentah, true);
      setError(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={mulai}
        disabled={loading}
        className="rounded-md bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Memulai…" : "Mulai isi"}
      </button>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}
