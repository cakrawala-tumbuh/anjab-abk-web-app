"use client";

import { useState } from "react";
import Link from "next/link";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { bodyP04, validasiP04 } from "@/lib/ai-usulan-narasi";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { labelIzinAi, type OpsiSumberAi } from "@/lib/narasi-permintaan";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

/** Properti {@link TanyaBuktiAi}. */
export interface TanyaBuktiAiProps {
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
  /** Id kasus narasi. */
  kasusId: string;
  /** Pilihan sumber (data inti, termuat penuh oleh halaman). */
  sumberOpsi: OpsiSumberAi[];
}

/**
 * Pengaju P04 (tanya bukti AI) di detail Kasus Narasi. Hanya saran: tidak ada yang terkirim ke
 * siapa pun dan narasi tidak berubah.
 *
 * Kirim `POST /api/v1/narasi/kasus/{narasi_id}/tanya-bukti-ai` dengan `Idempotency-Key` dari
 * `useIdempotencyKey().keyUntuk(body)`. `202` hanya berarti diterima. Isian tidak sah
 * (lihat `validasiP04`) tidak memicu POST; galat backend tampil apa adanya.
 *
 * @param props - Lihat {@link TanyaBuktiAiProps}.
 */
export function TanyaBuktiAi({ accessToken, kasusId, sumberOpsi }: TanyaBuktiAiProps) {
  const idem = useIdempotencyKey();
  const [klaim, setKlaim] = useState("");
  const [keputusan, setKeputusan] = useState("");
  const [terpilih, setTerpilih] = useState<string[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [usulanId, setUsulanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggle(id: string) {
    setTerpilih((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function kirim() {
    const salah = validasiP04(klaim, keputusan, terpilih.length);
    setUsulanId(null);
    setGalat(salah);
    if (salah) return;
    const body = bodyP04(klaim, keputusan, terpilih);
    setLoading(true);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/narasi/kasus/{narasi_id}/tanya-bukti-ai",
        {
          params: { path: { narasi_id: kasusId } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      setUsulanId(res.data.id);
      notifySukses("Permintaan tanya bukti diterima. Hasilnya muncul di layar Usulan AI.");
    } catch (err) {
      const g = petakanKonkurensi(err, true);
      setGalat(pesanGagal(g));
      notifyGagal(g);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="text-gray-600 dark:text-gray-400">
        AI menilai kecukupan bukti untuk sebuah klaim. Hasilnya hanya saran; tidak ada yang terkirim
        ke siapa pun.
      </p>
      <label className="block space-y-1">
        <span>Klaim</span>
        <textarea
          value={klaim}
          onChange={(e) => setKlaim(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
        />
      </label>
      <label className="block space-y-1">
        <span>Keputusan terkait</span>
        <textarea
          value={keputusan}
          onChange={(e) => setKeputusan(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
        />
      </label>
      <fieldset className="space-y-1 rounded-md border border-gray-200 p-3 dark:border-gray-700">
        <legend className="px-1 font-medium">Sumber bukti</legend>
        {sumberOpsi.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">Belum ada sumber narasi.</p>
        )}
        {sumberOpsi.map((s) => (
          <label key={s.id} className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={terpilih.includes(s.id)}
              onChange={() => toggle(s.id)}
              className="mt-1"
            />
            <span className="break-words">
              {s.judul} ({s.versi}, {s.periode}) — {labelIzinAi(s.izin_ai)}
            </span>
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        disabled={loading}
        onClick={() => void kirim()}
        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Mengirim…" : "Tanya bukti dengan AI"}
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
  );
}
