"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import {
  SISI_DELTA,
  STATUS_KESIAPAN,
  TEKS_TIDAK_DAPAT_DIESTIMASI,
  isianKesiapanAwal,
  payloadKesiapan,
  validasiKesiapan,
  type IsianKesiapan,
  type SisiDelta,
} from "@/lib/redesain-alternatif";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

const LABEL_SISI: Record<SisiDelta, string> = {
  asal: "Delta pihak asal",
  penerima: "Delta penerima",
  organisasi: "Delta organisasi",
};

/** Properti {@link FormKesiapan}. */
export interface FormKesiapanProps {
  alternatifId: string;
  /** Periode `YYYY/YY` terpilih; ikut terkirim di badan. */
  periode: string;
  /** Penerima yang dapat dinilai (label = nama jabatan). */
  penerima: { id: string; label: string }[];
  accessToken: string | undefined;
}

/**
 * Form penilaian kesiapan satu penerima pada satu periode
 * (`POST .../alternatif/{id}/kesiapan`, append-only).
 *
 * Status wajib tanpa nilai bawaan; `syarat` wajib bila CONDITIONAL dan `alasan_hold` wajib
 * bila HOLD. Tiap delta memilih "angka" (jam kerja efektif per periode) atau
 * "Tidak dapat diestimasi" (angka tidak dikirim). Validasi klien mencerminkan backend dan
 * pesan galatnya ditampilkan sebelum kirim; kirim membawa `Idempotency-Key`, sukses hanya
 * setelah 2xx lalu `router.refresh()`.
 *
 * @param props - Lihat {@link FormKesiapanProps}.
 */
export function FormKesiapan({ alternatifId, periode, penerima, accessToken }: FormKesiapanProps) {
  const router = useRouter();
  const [isian, setIsian] = useState<IsianKesiapan>(isianKesiapanAwal);
  const [dicoba, setDicoba] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idem = useIdempotencyKey();
  const galat = validasiKesiapan(isian);

  const ubahDelta = (s: SisiDelta, d: Partial<IsianKesiapan["delta"][SisiDelta]>) =>
    setIsian((v) => ({ ...v, delta: { ...v.delta, [s]: { ...v.delta[s], ...d } } }));

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setDicoba(true);
    if (galat.length > 0) return;
    setLoading(true);
    setError(null);
    try {
      const body = payloadKesiapan(isian, periode);
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/redesain/alternatif/{alternatif_id}/kesiapan",
        {
          params: { path: { alternatif_id: alternatifId } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      notifySukses("Kesiapan dicatat.");
      setIsian(isianKesiapanAwal());
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
    <form onSubmit={simpan} className="space-y-3 text-sm" aria-label="Form kesiapan">
      <div className="grid gap-2 sm:grid-cols-2">
        <label>
          <span className="block text-gray-600 dark:text-gray-400">Penerima</span>
          <select
            aria-label="Penerima kesiapan"
            value={isian.penerima_id}
            onChange={(e) => setIsian((v) => ({ ...v, penerima_id: e.target.value }))}
            className={INPUT}
          >
            <option value="">— pilih penerima —</option>
            {penerima.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-gray-600 dark:text-gray-400">Status kesiapan</span>
          <select
            aria-label="Status kesiapan"
            value={isian.status}
            onChange={(e) =>
              setIsian((v) => ({ ...v, status: e.target.value as IsianKesiapan["status"] }))
            }
            className={INPUT}
          >
            <option value="">— pilih status —</option>
            {STATUS_KESIAPAN.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isian.status === "CONDITIONAL" && (
        <label className="block">
          <span className="block text-gray-600 dark:text-gray-400">Syarat</span>
          <textarea
            aria-label="Syarat"
            rows={2}
            value={isian.syarat}
            onChange={(e) => setIsian((v) => ({ ...v, syarat: e.target.value }))}
            className={INPUT}
          />
        </label>
      )}
      {isian.status === "HOLD" && (
        <label className="block">
          <span className="block text-gray-600 dark:text-gray-400">Alasan hold</span>
          <textarea
            aria-label="Alasan hold"
            rows={2}
            value={isian.alasan_hold}
            onChange={(e) => setIsian((v) => ({ ...v, alasan_hold: e.target.value }))}
            className={INPUT}
          />
        </label>
      )}

      <fieldset className="space-y-2">
        <legend className="text-gray-600 dark:text-gray-400">
          Delta beban kerja (jam kerja efektif per periode; positif = beban bertambah)
        </legend>
        {SISI_DELTA.map((s) => (
          <div key={s} className="grid items-end gap-2 sm:grid-cols-[10rem_14rem_1fr]">
            <span>{LABEL_SISI[s]}</span>
            <select
              aria-label={`Mode ${LABEL_SISI[s]}`}
              value={isian.delta[s].mode}
              onChange={(e) =>
                ubahDelta(s, {
                  mode: e.target.value as "ANGKA" | "NOT_ESTIMABLE",
                  jam: "",
                })
              }
              className={INPUT}
            >
              <option value="ANGKA">Angka (jam)</option>
              <option value="NOT_ESTIMABLE">{TEKS_TIDAK_DAPAT_DIESTIMASI}</option>
            </select>
            {isian.delta[s].mode === "ANGKA" && (
              <input
                type="number"
                step="any"
                aria-label={`Jam ${LABEL_SISI[s]}`}
                value={isian.delta[s].jam}
                onChange={(e) => ubahDelta(s, { jam: e.target.value })}
                className={INPUT}
              />
            )}
          </div>
        ))}
      </fieldset>

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
        {loading ? "Menyimpan…" : `Catat kesiapan (${periode})`}
      </button>
    </form>
  );
}
