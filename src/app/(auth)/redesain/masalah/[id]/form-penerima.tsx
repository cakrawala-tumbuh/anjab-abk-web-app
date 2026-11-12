"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { PenerimaCreate } from "@/lib/api/schema";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link FormPenerima}. */
export interface FormPenerimaProps {
  alternatifId: string;
  /** Pilihan jabatan penerima (label = nama jabatan). */
  jabatan: { id: string; label: string }[];
  accessToken: string | undefined;
}

/**
 * Form tambah penerima sebuah alternatif (`POST .../alternatif/{id}/penerima`).
 *
 * Jabatan wajib dipilih; `material` bawaan hidup (penerima material menahan opsi bila belum
 * siap). Kirim membawa `Idempotency-Key`; sukses hanya setelah 2xx lalu `router.refresh()`.
 *
 * @param props - Lihat {@link FormPenerimaProps}.
 */
export function FormPenerima({ alternatifId, jabatan, accessToken }: FormPenerimaProps) {
  const router = useRouter();
  const [jabatanId, setJabatanId] = useState("");
  const [material, setMaterial] = useState(true);
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idem = useIdempotencyKey();

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!jabatanId) return;
    setLoading(true);
    setError(null);
    try {
      const body: PenerimaCreate = {
        penerima_jabatan_id: jabatanId,
        material,
        catatan: catatan.trim() || null,
      };
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/redesain/alternatif/{alternatif_id}/penerima",
        {
          params: { path: { alternatif_id: alternatifId } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      notifySukses("Penerima ditambahkan.");
      setJabatanId("");
      setCatatan("");
      router.refresh();
    } catch (galat) {
      const err = petakanKonkurensi(galat, true);
      setError(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={simpan} className="grid gap-2 text-sm sm:grid-cols-2">
      <label>
        <span className="block text-gray-600 dark:text-gray-400">Jabatan penerima</span>
        <select
          aria-label="Jabatan penerima"
          value={jabatanId}
          onChange={(e) => setJabatanId(e.target.value)}
          className={INPUT}
        >
          <option value="">— pilih jabatan —</option>
          {jabatan.map((j) => (
            <option key={j.id} value={j.id}>
              {j.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="block text-gray-600 dark:text-gray-400">Catatan</span>
        <input
          aria-label="Catatan penerima"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          className={INPUT}
        />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          aria-label="Penerima material"
          checked={material}
          onChange={(e) => setMaterial(e.target.checked)}
        />
        <span>Penerima material</span>
      </label>
      {error && (
        <p role="alert" className="form-error sm:col-span-2">
          {error}
        </p>
      )}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={!jabatanId || loading}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Menyimpan…" : "Tambah penerima"}
        </button>
      </div>
    </form>
  );
}
