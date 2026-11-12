"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { NarasiSumberRingkas } from "@/lib/api/schema";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import {
  ISIAN_BUAT_KOSONG,
  KETERANGAN_EXPOSURE,
  bodyBuat,
  labelDari,
  petakanGalatKlarifikasi,
  validasiBuat,
  type GalatForm,
  type IsianBuat,
  type NilaiExposure,
} from "@/lib/narasi-klarifikasi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link KlarifikasiForm}. */
export interface KlarifikasiFormProps {
  /** Id kasus narasi yang ditanyakan. */
  narasiId: string;
  /** Periode kasus, dipakai sebagai nilai awal isian Periode. */
  periodeAwal: string;
  /** Paparan kasus (baca-saja), dikirim sebagai `exposure`. */
  exposure: NilaiExposure;
  /** Seluruh sumber narasi sebagai pilihan `source_ids_checked`. */
  sumberOpsi: NarasiSumberRingkas[];
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

const TEKS: ReadonlyArray<readonly [keyof IsianBuat, string, number]> = [
  ["materiality_reason", "Alasan material (MaterialityReason)", 3],
  ["alternative_hypothesis", "Hipotesis alternatif (AlternativeHypothesis)", 3],
  ["intended_decision", "Keputusan yang dibantu (IntendedDecision)", 2],
  ["due_trigger", "Pemicu batas waktu (DueTrigger)", 2],
  ["question_text", "Pertanyaan (Question_Text) — paling banyak satu tanda tanya", 3],
];

/**
 * Form ajukan klarifikasi manual: 13 metadata tersusun dari isian ini dan kasusnya
 * (`narasi_id`, `exposure` baca-saja; `reviewer_approval`/`disposition` diatur backend).
 * Validasi klien {@link validasiBuat}; kirim lewat `POST /api/v1/narasi/klarifikasi` dengan
 * `Idempotency-Key`. Sukses hanya setelah 2xx: notifikasi, lalu pindah ke detail yang dibuat.
 * Galat 409/422 tampil sebagai pesan form; isian tidak dibuang.
 */
export function KlarifikasiForm({
  narasiId,
  periodeAwal,
  exposure,
  sumberOpsi,
  accessToken,
}: KlarifikasiFormProps) {
  const router = useRouter();
  const idem = useIdempotencyKey();
  const [isian, setIsian] = useState<IsianBuat>({ ...ISIAN_BUAT_KOSONG, periode: periodeAwal });
  const [galat, setGalat] = useState<GalatForm<keyof IsianBuat>>({});
  const [umum, setUmum] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function ubah<K extends keyof IsianBuat>(k: K, v: IsianBuat[K]) {
    setIsian((p) => ({ ...p, [k]: v }));
  }

  function toggleSumber(id: string) {
    ubah(
      "source_ids_checked",
      isian.source_ids_checked.includes(id)
        ? isian.source_ids_checked.filter((x) => x !== id)
        : [...isian.source_ids_checked, id],
    );
  }

  async function kirim() {
    const salah = validasiBuat(isian);
    setGalat(salah);
    setUmum(null);
    if (Object.keys(salah).length > 0) return;
    const body = bodyBuat(narasiId, exposure, isian);
    setLoading(true);
    try {
      const res = await withServerAuth(accessToken).POST("/api/v1/narasi/klarifikasi", {
        body,
        headers: headerIdempotencyKey(idem.keyUntuk(body)),
      });
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      notifySukses("Pertanyaan klarifikasi dibuat");
      router.push(`/narasi/klarifikasi/${res.data.id}`);
    } catch (err) {
      const g = petakanGalatKlarifikasi(petakanKonkurensi(err, true));
      setUmum(pesanGagal(g));
      notifyGagal(g);
    } finally {
      setLoading(false);
    }
  }

  const pesan = (k: keyof IsianBuat) =>
    galat[k] ? (
      <span role="alert" className="mt-1 block text-xs text-red-600">
        {galat[k]}
      </span>
    ) : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm" htmlFor="kl-claim">
          <span className="block text-gray-600 dark:text-gray-400">
            Klaim yang ditanyakan (Claim_ID)
          </span>
          <input
            id="kl-claim"
            value={isian.claim_id}
            onChange={(e) => ubah("claim_id", e.target.value)}
            maxLength={100}
            className={INPUT}
          />
          {pesan("claim_id")}
        </label>
        <label className="text-sm" htmlFor="kl-peran">
          <span className="block text-gray-600 dark:text-gray-400">
            Peran penerima (RecipientRole)
          </span>
          <input
            id="kl-peran"
            value={isian.recipient_role}
            onChange={(e) => ubah("recipient_role", e.target.value)}
            maxLength={100}
            className={INPUT}
          />
          {pesan("recipient_role")}
        </label>
        <label className="text-sm" htmlFor="kl-periode">
          <span className="block text-gray-600 dark:text-gray-400">Periode (Period)</span>
          <input
            id="kl-periode"
            value={isian.periode}
            onChange={(e) => ubah("periode", e.target.value)}
            maxLength={20}
            className={INPUT}
          />
          {pesan("periode")}
        </label>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300">
        Paparan (Exposure): <strong>{exposure}</strong> — {labelDari(KETERANGAN_EXPOSURE, exposure)}{" "}
        (diambil dari kasus; tidak dapat diubah di sini).
      </p>

      <fieldset className="space-y-1">
        <legend className="text-sm text-gray-600 dark:text-gray-400">
          Sumber yang sudah dicek (Source_IDs_checked)
        </legend>
        {sumberOpsi.length === 0 ? (
          <p role="status" className="text-sm text-gray-500">
            Belum ada sumber narasi. Tambahkan sumber lebih dulu.
          </p>
        ) : (
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {sumberOpsi.map((s) => (
              <li key={s.id}>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isian.source_ids_checked.includes(s.id)}
                    onChange={() => toggleSumber(s.id)}
                  />
                  <span>
                    {s.judul} ({s.jenis}, periode {s.periode})
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {pesan("source_ids_checked")}
      </fieldset>

      {TEKS.map(([f, label, baris]) => (
        <label key={f} className="block text-sm" htmlFor={`kl-${f}`}>
          <span className="block text-gray-600 dark:text-gray-400">{label}</span>
          <textarea
            id={`kl-${f}`}
            value={isian[f] as string}
            onChange={(e) => ubah(f, e.target.value)}
            rows={baris}
            className={INPUT}
          />
          {pesan(f)}
        </label>
      ))}

      <button
        type="button"
        disabled={loading}
        onClick={() => void kirim()}
        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Menyimpan…" : "Ajukan klarifikasi"}
      </button>
      {umum && (
        <p role="alert" className="form-error">
          {umum}
        </p>
      )}
    </div>
  );
}
