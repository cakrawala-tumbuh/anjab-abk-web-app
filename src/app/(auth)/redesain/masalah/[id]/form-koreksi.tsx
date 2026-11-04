"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

/** Properti {@link FormKoreksi}. */
export interface FormKoreksiProps {
  /** ID langkah yang dikoreksi. */
  langkahId: string;
  accessToken: string | undefined;
}

/**
 * Form tambah koreksi Tim pada sebuah langkah.
 *
 * Mengirim `POST /langkah/{id}/koreksi` dengan `{isi}` saja (tanpa `konfirmasi_id`,
 * sehingga berasal "Tim"). Koreksi bersifat append-only; tidak ada ubah/hapus.
 * POST membawa `Idempotency-Key` per upaya (`keyUntuk(body)`: isi kiriman berubah → key baru) (key diganti hanya setelah sukses); 409 `conflict` dipetakan ke pesan "masih diproses".
 *
 * @param props - Lihat {@link FormKoreksiProps}.
 */
export function FormKoreksi({ langkahId, accessToken }: FormKoreksiProps) {
  const router = useRouter();
  const [isi, setIsi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idem = useIdempotencyKey();

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body = { isi: isi.trim() };
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/redesain/langkah/{langkah_id}/koreksi",
        {
          params: { path: { langkah_id: langkahId } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      notifySukses("Koreksi ditambahkan.");
      setIsi("");
      router.refresh();
    } catch (galatMentah) {
      const err = petakanKonkurensi(galatMentah, true);
      setError(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={kirim} className="space-y-2">
      <PeringatanPrivasi />
      <textarea
        aria-label="Isi koreksi"
        value={isi}
        required
        rows={2}
        onChange={(e) => setIsi(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
      />
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || isi.trim() === ""}
        className="rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
      >
        {loading ? "Menyimpan…" : "Tambah koreksi Tim"}
      </button>
    </form>
  );
}
