"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { ApiError, apiErrorDari } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { PESAN_RALAT_409 } from "@/lib/redesain-konfirmasi";

/**
 * Tombol "Ralat isian": membuat draf ralat dari isian terkirim lalu membuka wizard
 * record BARU (cerita & dugaan sudah tersalin backend, sehingga wizard langsung di langkah 2).
 *
 * Versi lama tidak pernah ditimpa. 409 → "Isian ini sudah diralat atau masih draf".
 *
 * @param props.konfirmasiId - ID isian terkirim yang diralat.
 * @param props.accessToken - Token akses dari Server Component induk.
 */
export function RalatTombol({
  konfirmasiId,
  accessToken,
}: {
  konfirmasiId: string;
  accessToken: string | undefined;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ralat() {
    setLoading(true);
    setError(null);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/redesain/konfirmasi/{konfirmasi_id}/ralat",
        { params: { path: { konfirmasi_id: konfirmasiId } } },
      );
      if (!res.data) throw apiErrorDari(res);
      notifySukses("Draf ralat dibuat.");
      router.push(`/redesain-sekolah/konfirmasi/${res.data.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(PESAN_RALAT_409);
        notifyGagal(
          new ApiError(
            { code: err.code, message: PESAN_RALAT_409, details: err.details },
            err.requestId,
            err.status,
          ),
        );
        router.refresh();
      } else {
        setError(pesanGagal(err));
        notifyGagal(err);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={ralat}
        disabled={loading}
        className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
      >
        {loading ? "Memproses…" : "Ralat isian"}
      </button>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}
