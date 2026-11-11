"use client";

import { useState } from "react";
import Link from "next/link";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { validasiPeriodeAi } from "@/lib/ai-usulan-konteks";
import { bodyP01, validasiPeranRef } from "@/lib/ai-usulan-narasi";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

const INPUT =
  "w-48 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link EkstraksiSumberAi}. */
export interface EkstraksiSumberAiProps {
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
  /** Id sumber narasi. */
  sumberId: string;
  /** Periode sumber, dipakai sebagai nilai awal isian (boleh diubah). */
  periodeAwal: string;
}

/**
 * Pengaju P01 (ekstraksi AI) di detail Sumber Narasi. Hasilnya usulan yang ditinjau di
 * `/ai-usulan`, bukan perubahan narasi.
 *
 * Kirim `POST /api/v1/narasi/sumber/{sumber_id}/ekstraksi-ai` dengan `Idempotency-Key` dari
 * `useIdempotencyKey().keyUntuk(body)`. `202` hanya berarti diterima. Galat tampil sebagai pesan
 * backend apa adanya; isian tidak sah tidak memicu POST.
 *
 * @param props - Lihat {@link EkstraksiSumberAiProps}.
 */
export function EkstraksiSumberAi({ accessToken, sumberId, periodeAwal }: EkstraksiSumberAiProps) {
  const idem = useIdempotencyKey();
  const [peran, setPeran] = useState("");
  const [periode, setPeriode] = useState(periodeAwal);
  const [galat, setGalat] = useState<string | null>(null);
  const [usulanId, setUsulanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function kirim() {
    const salah = validasiPeranRef(peran) ?? validasiPeriodeAi(periode);
    setUsulanId(null);
    setGalat(salah);
    if (salah) return;
    const body = bodyP01(peran, periode);
    setLoading(true);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/narasi/sumber/{sumber_id}/ekstraksi-ai",
        {
          params: { path: { sumber_id: sumberId } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      setUsulanId(res.data.id);
      notifySukses("Permintaan ekstraksi diterima. Hasilnya muncul di layar Usulan AI.");
    } catch (err) {
      const g = petakanKonkurensi(err, true);
      setGalat(pesanGagal(g));
      notifyGagal(g);
    } finally {
      setLoading(false);
    }
  }

  return (
    <details className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <summary className="cursor-pointer font-medium">Ekstraksi dengan AI (P01)</summary>
      <div className="mt-3 space-y-3 text-sm">
        <p className="text-gray-600 dark:text-gray-400">
          AI mengekstrak butir dari sumber ini. Hasilnya berupa usulan yang harus Anda tinjau;
          narasi tidak berubah.
        </p>
        <label className="flex flex-wrap items-center gap-2">
          <span>Peran</span>
          <input
            type="text"
            value={peran}
            onChange={(e) => setPeran(e.target.value)}
            className={INPUT}
          />
        </label>
        <label className="flex flex-wrap items-center gap-2">
          <span>Periode</span>
          <input
            type="text"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className={INPUT}
          />
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={() => void kirim()}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Mengirim…" : "Ekstrak dengan AI"}
        </button>
        {galat && (
          <p role="alert" className="form-error">
            {galat}
          </p>
        )}
        {usulanId && (
          <p role="status">
            Permintaan diterima.{" "}
            <Link href={`/ai-usulan/${usulanId}`} className="text-blue-600 dark:text-blue-400">
              Buka usulan
            </Link>
          </p>
        )}
      </div>
    </details>
  );
}
