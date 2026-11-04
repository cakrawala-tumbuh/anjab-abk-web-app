"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { PartisipanRead } from "@/lib/api/schema";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

/** Pesan konflik saat partisipan sudah punya kode orang (HTTP 409). */
export const PESAN_KONFLIK_KODE = "Partisipan ini sudah punya kode";

/**
 * Form "Tambah narasumber": membuat kode orang baru (`POST /api/v1/redesain/kode-orang`).
 *
 * Partisipan opsional. Respons 409 menampilkan {@link PESAN_KONFLIK_KODE} tanpa toast
 * sukses (kecuali 409 `conflict` = key masih diproses → pesan baku); galat lain ditampilkan
 * inline dan lewat `notifyGagal`. POST membawa `Idempotency-Key` per upaya; key diganti
 * hanya setelah respons sukses.
 *
 * @param props.partisipan - Master partisipan untuk dropdown.
 * @param props.accessToken - Token akses dari Server Component induk.
 */
export function TambahKodeOrang({
  partisipan,
  accessToken,
}: {
  partisipan: PartisipanRead[];
  accessToken: string | undefined;
}) {
  const router = useRouter();
  const [keterangan, setKeterangan] = useState("");
  const [partisipanId, setPartisipanId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idem = useIdempotencyKey();

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await withServerAuth(accessToken).POST("/api/v1/redesain/kode-orang", {
        body: {
          keterangan_peran: keterangan.trim(),
          partisipan_id: partisipanId || undefined,
        },
        headers: headerIdempotencyKey(idem.key),
      });
      if (res.response.status === 409 && apiErrorDari(res).code !== "conflict") {
        setError(PESAN_KONFLIK_KODE);
        return;
      }
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      notifySukses(`Kode ${res.data.kode} dibuat.`);
      setKeterangan("");
      setPartisipanId("");
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
    <form
      onSubmit={kirim}
      className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
    >
      <h2 className="font-medium">Tambah narasumber</h2>
      <PeringatanPrivasi />
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Keterangan peran</span>
          <input
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            required
            maxLength={200}
            className="rounded-md border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
          />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Partisipan (opsional)</span>
          <select
            value={partisipanId}
            onChange={(e) => setPartisipanId(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="">— tanpa partisipan —</option>
            {partisipan.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Menyimpan…" : "Tambah"}
        </button>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </form>
  );
}
