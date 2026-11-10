"use client";

import { useState } from "react";
import Link from "next/link";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { validasiPeriodeAi } from "@/lib/ai-usulan-konteks";
import { bodyP02 } from "@/lib/ai-usulan-ti";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

const INPUT =
  "w-40 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link NormalisasiJabatanAi}. */
export interface NormalisasiJabatanAiProps {
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
  /** Id jabatan (segmen `kategori` rute, sudah di-decode). */
  jabatanId: string;
  /** Kode unit (segmen `unit` rute). */
  unit: string;
}

/**
 * Tombol "Normalisasi tugas dengan AI" (P02) di halaman katalog TI per jabatan. Hasilnya
 * usulan yang ditinjau di layar Usulan AI, bukan perubahan katalog.
 *
 * Kirim `POST /api/v1/task-inventory/jabatan/{jabatan_id}/normalisasi-ai` dengan
 * `Idempotency-Key` dari `useIdempotencyKey().keyUntuk(body)`. `202` -> notifikasi bahwa
 * permintaan DITERIMA (bukan selesai) plus tautan `/ai-usulan/{id}`. Galat 404/409/422
 * tampil sebagai pesan backend, tanpa notifikasi sukses.
 *
 * @param props - Lihat {@link NormalisasiJabatanAiProps}.
 */
export function NormalisasiJabatanAi({ accessToken, jabatanId, unit }: NormalisasiJabatanAiProps) {
  const idem = useIdempotencyKey();
  const [periode, setPeriode] = useState("");
  const [hanyaUnit, setHanyaUnit] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [usulanId, setUsulanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function kirim() {
    const salah = validasiPeriodeAi(periode);
    setUsulanId(null);
    setGalat(salah);
    if (salah) return;
    const body = bodyP02(periode, unit, hanyaUnit);
    setLoading(true);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/task-inventory/jabatan/{jabatan_id}/normalisasi-ai",
        {
          params: { path: { jabatan_id: jabatanId } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      setUsulanId(res.data.id);
      notifySukses("Permintaan normalisasi tugas diterima. Hasilnya muncul di layar Usulan AI.");
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
      <summary className="cursor-pointer font-medium">Normalisasi tugas dengan AI (P02)</summary>
      <div className="mt-3 space-y-3 text-sm">
        <p className="text-gray-600 dark:text-gray-400">
          AI menormalkan daftar tugas jabatan ini. Hasilnya berupa usulan yang harus Anda tinjau dan
          putuskan; katalog tidak berubah.
        </p>
        <label className="flex items-center gap-2">
          <span>Periode</span>
          <input
            type="text"
            value={periode}
            placeholder="2026/27"
            onChange={(e) => setPeriode(e.target.value)}
            className={INPUT}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hanyaUnit}
            onChange={(e) => setHanyaUnit(e.target.checked)}
          />
          <span>Hanya unit ini ({unit})</span>
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={() => void kirim()}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Mengirim…" : "Normalisasi dengan AI"}
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
