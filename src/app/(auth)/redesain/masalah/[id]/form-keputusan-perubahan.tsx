"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { StatusKesiapan } from "@/lib/api/schema";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import {
  OPSI_KEPUTUSAN_PERUBAHAN,
  opsiKeputusanAktif,
  payloadKeputusanPerubahan,
  validasiKeputusanPerubahan,
  type IsianKeputusanPerubahan,
} from "@/lib/redesain-alternatif";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link FormKeputusanPerubahan}. */
export interface FormKeputusanPerubahanProps {
  alternatifId: string;
  periode: string;
  /** Status opsi dari matriks; menentukan pilihan keputusan yang aktif. */
  statusOpsi: StatusKesiapan;
  accessToken: string | undefined;
}

/**
 * Form keputusan perubahan (ChangeDecision), terpisah dari keputusan prioritas
 * (`POST .../alternatif/{id}/keputusan-perubahan`).
 *
 * Pilihan APPROVE dinonaktifkan bila `statusOpsi` bukan READY dan CONDITIONAL dinonaktifkan
 * bila HOLD. `stop_rule` wajib bila CONDITIONAL, alasan minimal 5 karakter. Galat 409 backend
 * (mis. `KESIAPAN_BELUM_READY`) ditampilkan apa adanya. Sukses hanya setelah 2xx.
 *
 * @param props - Lihat {@link FormKeputusanPerubahanProps}.
 */
export function FormKeputusanPerubahan({
  alternatifId,
  periode,
  statusOpsi,
  accessToken,
}: FormKeputusanPerubahanProps) {
  const router = useRouter();
  const [isian, setIsian] = useState<IsianKeputusanPerubahan>({
    keputusan: "",
    alasan: "",
    stop_rule: "",
  });
  const [dicoba, setDicoba] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idem = useIdempotencyKey();
  const aktif = opsiKeputusanAktif(statusOpsi);
  const galat = validasiKeputusanPerubahan(isian);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setDicoba(true);
    if (galat.length > 0) return;
    setLoading(true);
    setError(null);
    try {
      const body = payloadKeputusanPerubahan(isian, periode);
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/redesain/alternatif/{alternatif_id}/keputusan-perubahan",
        {
          params: { path: { alternatif_id: alternatifId } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      notifySukses("Keputusan perubahan dicatat.");
      setIsian({ keputusan: "", alasan: "", stop_rule: "" });
      setDicoba(false);
      router.refresh();
    } catch (g) {
      const err = petakanKonkurensi(g, true);
      setError(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={simpan} className="space-y-3 text-sm" aria-label="Form keputusan perubahan">
      <label className="block">
        <span className="block text-gray-600 dark:text-gray-400">Keputusan</span>
        <select
          aria-label="Keputusan perubahan"
          value={isian.keputusan}
          onChange={(e) =>
            setIsian((v) => ({
              ...v,
              keputusan: e.target.value as IsianKeputusanPerubahan["keputusan"],
            }))
          }
          className={INPUT}
        >
          <option value="">— pilih keputusan —</option>
          {OPSI_KEPUTUSAN_PERUBAHAN.map((k) => (
            <option key={k} value={k} disabled={!aktif[k]}>
              {k}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-gray-600 dark:text-gray-400">Alasan</span>
        <textarea
          aria-label="Alasan keputusan perubahan"
          rows={3}
          value={isian.alasan}
          onChange={(e) => setIsian((v) => ({ ...v, alasan: e.target.value }))}
          className={INPUT}
        />
      </label>
      {isian.keputusan === "CONDITIONAL" && (
        <label className="block">
          <span className="block text-gray-600 dark:text-gray-400">Stop rule</span>
          <textarea
            aria-label="Stop rule"
            rows={2}
            value={isian.stop_rule}
            onChange={(e) => setIsian((v) => ({ ...v, stop_rule: e.target.value }))}
            className={INPUT}
          />
        </label>
      )}
      {dicoba && galat.length > 0 && (
        <ul role="alert" className="form-error list-disc pl-5">
          {galat.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Menyimpan…" : "Catat keputusan perubahan"}
      </button>
    </form>
  );
}
