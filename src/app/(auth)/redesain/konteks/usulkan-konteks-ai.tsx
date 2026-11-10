"use client";

import { useState } from "react";
import Link from "next/link";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import {
  JUMLAH_KANDIDAT_BAWAAN,
  JUMLAH_KANDIDAT_MAX,
  JUMLAH_KANDIDAT_MIN,
  bodyPengajuan,
  validasiPengajuan,
} from "@/lib/ai-usulan-konteks";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

const INPUT =
  "w-20 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link UsulkanKontekAi}. */
export interface UsulkanKontekAiProps {
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

/**
 * Tombol "Usulkan dengan AI" di halaman Konteks: meminta fungsi P11 mengusulkan kandidat
 * konteks. Hasilnya bukan konteks, melainkan usulan yang ditinjau Tim di layar Usulan AI.
 *
 * Kirim `POST /api/v1/redesain/konteks/usulan-ai` (`Idempotency-Key` dari
 * `useIdempotencyKey().keyUntuk(body)`). `202` -> notifikasi bahwa permintaan DITERIMA
 * (bukan selesai) plus tautan ke `/ai-usulan/{id}`. Galat 404/409/422 (mis. fungsi belum
 * aktif) tampil sebagai pesan dari backend, tanpa notifikasi sukses.
 *
 * @param props - Lihat {@link UsulkanKontekAiProps}.
 */
export function UsulkanKontekAi({ accessToken }: UsulkanKontekAiProps) {
  const idem = useIdempotencyKey();
  const [sertakan, setSertakan] = useState(true);
  const [jumlah, setJumlah] = useState(String(JUMLAH_KANDIDAT_BAWAAN));
  const [galat, setGalat] = useState<string | null>(null);
  const [usulanId, setUsulanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function kirim() {
    const isian = { sertakan_masalah: sertakan, jumlah_kandidat: jumlah };
    const salah = validasiPengajuan(isian);
    setUsulanId(null);
    setGalat(salah);
    if (salah) return;
    const body = bodyPengajuan(isian);
    setLoading(true);
    try {
      const res = await withServerAuth(accessToken).POST("/api/v1/redesain/konteks/usulan-ai", {
        body,
        headers: headerIdempotencyKey(idem.keyUntuk(body)),
      });
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      setUsulanId(res.data.id);
      notifySukses("Permintaan usulan konteks diterima. Hasilnya muncul di layar Usulan AI.");
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
      <summary className="cursor-pointer font-medium">Usulkan dengan AI</summary>
      <div className="mt-3 space-y-3 text-sm">
        <p className="text-gray-600 dark:text-gray-400">
          AI mengusulkan kandidat konteks dari konteks dan masalah yang sudah ada. Hasilnya berupa
          usulan yang harus Anda tinjau dan putuskan; tidak ada konteks yang tersimpan sebelum
          kandidat diterapkan.
        </p>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={sertakan}
            onChange={(e) => setSertakan(e.target.checked)}
          />
          <span>Sertakan masalah redesain sebagai sumber</span>
        </label>
        <label className="flex items-center gap-2">
          <span>Jumlah kandidat</span>
          <input
            type="number"
            min={JUMLAH_KANDIDAT_MIN}
            max={JUMLAH_KANDIDAT_MAX}
            value={jumlah}
            onChange={(e) => setJumlah(e.target.value)}
            className={INPUT}
          />
          <span className="text-xs text-gray-500">
            ({JUMLAH_KANDIDAT_MIN}-{JUMLAH_KANDIDAT_MAX})
          </span>
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={() => void kirim()}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Mengirim…" : "Usulkan dengan AI"}
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
