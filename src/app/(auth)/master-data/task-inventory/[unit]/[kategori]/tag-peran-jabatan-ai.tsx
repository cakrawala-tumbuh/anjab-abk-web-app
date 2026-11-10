"use client";

import { useState } from "react";
import Link from "next/link";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { validasiPeriodeAi } from "@/lib/ai-usulan-konteks";
import { bodyP03 } from "@/lib/ai-usulan-ti";
import type { AiUsulanRingkas } from "@/lib/api/schema";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

const INPUT =
  "rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link TagPeranJabatanAi}. */
export interface TagPeranJabatanAiProps {
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
  /** Id jabatan (segmen `kategori` rute, sudah di-decode). */
  jabatanId: string;
  /** Usulan P02 jabatan ini yang sudah diterima reviewer (APPROVE/REVISE). */
  usulanP02: ReadonlyArray<AiUsulanRingkas>;
}

/**
 * Tombol "Beri tag peran dengan AI" (P03) di halaman katalog TI per jabatan. Hanya bisa
 * diajukan dari usulan P02 yang sudah diterima; tanpa pilihan, tombol nonaktif.
 *
 * Kirim `POST /api/v1/task-inventory/jabatan/{jabatan_id}/tag-peran-ai` dengan
 * `Idempotency-Key` dari `useIdempotencyKey().keyUntuk(body)`. `202` -> notifikasi
 * "diterima (bukan selesai)" plus tautan `/ai-usulan/{id}`. Galat (mis. 409
 * `fungsi_belum_aktif`) tampil sebagai pesan backend, tanpa notifikasi sukses.
 *
 * @param props - Lihat {@link TagPeranJabatanAiProps}.
 */
export function TagPeranJabatanAi({ accessToken, jabatanId, usulanP02 }: TagPeranJabatanAiProps) {
  const idem = useIdempotencyKey();
  const [pilihan, setPilihan] = useState(usulanP02[0]?.id ?? "");
  const [periode, setPeriode] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const [usulanId, setUsulanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const kosong = usulanP02.length === 0;

  async function kirim() {
    const salah = validasiPeriodeAi(periode);
    setUsulanId(null);
    setGalat(salah);
    if (salah || !pilihan) return;
    const body = bodyP03(pilihan, periode);
    setLoading(true);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/task-inventory/jabatan/{jabatan_id}/tag-peran-ai",
        {
          params: { path: { jabatan_id: jabatanId } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      setUsulanId(res.data.id);
      notifySukses("Permintaan tag peran diterima. Hasilnya muncul di layar Usulan AI.");
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
      <summary className="cursor-pointer font-medium">Beri tag peran dengan AI (P03)</summary>
      <div className="mt-3 space-y-3 text-sm">
        <p className="text-gray-600 dark:text-gray-400">
          AI memberi tag peran pada tugas hasil normalisasi (P02) yang sudah Anda terima. Hasilnya
          berupa usulan yang harus ditinjau dan diputuskan.
        </p>
        {kosong ? (
          <p>Belum ada usulan P02 yang diterima untuk jabatan ini.</p>
        ) : (
          <label className="flex flex-wrap items-center gap-2">
            <span>Usulan P02</span>
            <select value={pilihan} onChange={(e) => setPilihan(e.target.value)} className={INPUT}>
              {usulanP02.map((u) => (
                <option key={u.id} value={u.id}>
                  {new Date(u.created_at).toLocaleString("id-ID")} — {u.putusan_terakhir?.putusan}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex items-center gap-2">
          <span>Periode</span>
          <input
            type="text"
            value={periode}
            placeholder="2026/27"
            onChange={(e) => setPeriode(e.target.value)}
            className={`${INPUT} w-40`}
          />
        </label>
        <button
          type="button"
          disabled={loading || kosong}
          onClick={() => void kirim()}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Mengirim…" : "Beri tag peran dengan AI"}
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
