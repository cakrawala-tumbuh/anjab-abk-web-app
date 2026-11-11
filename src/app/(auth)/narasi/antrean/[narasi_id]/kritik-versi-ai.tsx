"use client";

import { useState } from "react";
import Link from "next/link";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { bodyP09 } from "@/lib/ai-usulan-narasi";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

/** Properti {@link KritikVersiAi}. */
export interface KritikVersiAiProps {
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
  /** Id kasus narasi. */
  narasiId: string;
  /** Id versi yang ditampilkan di halaman tinjauan. */
  versiId: string;
  /** Apakah versi punya teks; tanpa teks komponen tidak dirender. */
  adaTeks: boolean;
}

/**
 * Pengaju P09 (kritik AI) di halaman tinjauan versi draf. Membantu peninjau, tidak menggantikan
 * tinjauan. Teks draf tidak dikirim: hanya `narasi_versi_id`.
 *
 * Kirim `POST /api/v1/narasi/kasus/{narasi_id}/kritik-ai` dengan `Idempotency-Key` dari
 * `useIdempotencyKey().keyUntuk(body)`. `202` hanya berarti diterima. Galat backend tampil apa adanya.
 *
 * @param props - Lihat {@link KritikVersiAiProps}.
 */
export function KritikVersiAi({ accessToken, narasiId, versiId, adaTeks }: KritikVersiAiProps) {
  const idem = useIdempotencyKey();
  const [galat, setGalat] = useState<string | null>(null);
  const [usulanId, setUsulanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!adaTeks) return null;

  async function kirim() {
    const body = bodyP09(versiId);
    setUsulanId(null);
    setGalat(null);
    setLoading(true);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/narasi/kasus/{narasi_id}/kritik-ai",
        {
          params: { path: { narasi_id: narasiId } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      setUsulanId(res.data.id);
      notifySukses("Permintaan kritik diterima. Hasilnya muncul di layar Usulan AI.");
    } catch (err) {
      const g = petakanKonkurensi(err, true);
      setGalat(pesanGagal(g));
      notifyGagal(g);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      aria-labelledby="kritik-ai"
      className="space-y-2 rounded-lg border border-gray-200 p-4 text-sm dark:border-gray-700"
    >
      <h2 id="kritik-ai" className="text-base font-semibold">
        Kritik AI atas draf
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Membantu peninjau menemukan kelemahan draf; tidak menggantikan tinjauan Anda.
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={() => void kirim()}
        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Mengirim…" : "Minta kritik AI"}
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
    </section>
  );
}
