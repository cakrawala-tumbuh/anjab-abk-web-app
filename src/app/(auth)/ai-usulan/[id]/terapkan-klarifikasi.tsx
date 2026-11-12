"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import {
  KETERANGAN_EXPOSURE,
  bodyDariUsulan,
  idKlarifikasiSudahAda,
  labelDari,
  petakanGalatKlarifikasi,
  validasiDariUsulan,
  type GalatForm,
  type IsianDariUsulan,
  type NilaiExposure,
} from "@/lib/narasi-klarifikasi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link TerapkanKlarifikasi}. */
export interface TerapkanKlarifikasiProps {
  /** Id usulan P04. */
  usulanId: string;
  /** Paparan kasus sasaran (baca-saja), dikirim sebagai `exposure`. */
  exposure: NilaiExposure;
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

/**
 * Panel "Terapkan ke register klarifikasi" pada detail usulan P04 (hanya tampil bila material
 * dan sudah diterima, lihat `panelTerapkanP04Tampil`). Pengguna mengisi klaim dan pemicu;
 * keputusan yang dibantu opsional (kosong = alasan bertanya dari usulan). Kirim lewat
 * `POST /api/v1/narasi/klarifikasi/dari-usulan/{ai_usulan_id}` dengan `Idempotency-Key`.
 * Sukses (201) hanya setelah 2xx: tautan ke detail klarifikasi. 409 `USULAN_SUDAH_DITERAPKAN`
 * menampilkan tautan ke klarifikasi yang sudah ada.
 */
export function TerapkanKlarifikasi({ usulanId, exposure, accessToken }: TerapkanKlarifikasiProps) {
  const router = useRouter();
  const idem = useIdempotencyKey();
  const [isian, setIsian] = useState<IsianDariUsulan>({
    claim_id: "",
    due_trigger: "",
    intended_decision: "",
  });
  const [galat, setGalat] = useState<GalatForm<keyof IsianDariUsulan>>({});
  const [umum, setUmum] = useState<string | null>(null);
  const [sudahAda, setSudahAda] = useState<string | null>(null);
  const [dibuat, setDibuat] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function ubah<K extends keyof IsianDariUsulan>(k: K, v: string) {
    setIsian((p) => ({ ...p, [k]: v }));
  }

  async function kirim() {
    const salah = validasiDariUsulan(isian);
    setGalat(salah);
    setUmum(null);
    setSudahAda(null);
    if (Object.keys(salah).length > 0) return;
    const body = bodyDariUsulan(exposure, isian);
    setLoading(true);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/narasi/klarifikasi/dari-usulan/{ai_usulan_id}",
        {
          params: { path: { ai_usulan_id: usulanId } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      notifySukses("Usulan diterapkan ke register klarifikasi");
      setDibuat(res.data.id);
      router.refresh();
    } catch (err) {
      setSudahAda(idKlarifikasiSudahAda(err));
      const g = petakanGalatKlarifikasi(petakanKonkurensi(err, true));
      setUmum(pesanGagal(g));
      notifyGagal(g);
    } finally {
      setLoading(false);
    }
  }

  const pesan = (k: keyof IsianDariUsulan) =>
    galat[k] ? (
      <span role="alert" className="mt-1 block text-xs text-red-600">
        {galat[k]}
      </span>
    ) : null;

  return (
    <section aria-labelledby="terapkan-klarifikasi-judul" className="space-y-3">
      <h2 id="terapkan-klarifikasi-judul" className="text-base font-semibold">
        Terapkan ke register klarifikasi
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Pertanyaan dari usulan ini masuk register menunggu persetujuan reviewer lain, lalu dikirim
        fasilitator di luar aplikasi. Paparan: <strong>{exposure}</strong> —{" "}
        {labelDari(KETERANGAN_EXPOSURE, exposure)} (dari kasus).
      </p>
      {dibuat ? (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          Klarifikasi dibuat.{" "}
          <Link href={`/narasi/klarifikasi/${dibuat}`} className="underline">
            Buka klarifikasi
          </Link>
        </p>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm" htmlFor="p04-claim">
            <span className="block text-gray-600 dark:text-gray-400">
              Klaim yang ditanyakan (Claim_ID)
            </span>
            <input
              id="p04-claim"
              value={isian.claim_id}
              onChange={(e) => ubah("claim_id", e.target.value)}
              maxLength={100}
              className={INPUT}
            />
            {pesan("claim_id")}
          </label>
          <label className="block text-sm" htmlFor="p04-due">
            <span className="block text-gray-600 dark:text-gray-400">
              Pemicu batas waktu (DueTrigger)
            </span>
            <textarea
              id="p04-due"
              value={isian.due_trigger}
              onChange={(e) => ubah("due_trigger", e.target.value)}
              rows={2}
              className={INPUT}
            />
            {pesan("due_trigger")}
          </label>
          <label className="block text-sm" htmlFor="p04-keputusan">
            <span className="block text-gray-600 dark:text-gray-400">
              Keputusan yang dibantu (IntendedDecision) — opsional; kosong memakai alasan bertanya
              dari usulan
            </span>
            <textarea
              id="p04-keputusan"
              value={isian.intended_decision}
              onChange={(e) => ubah("intended_decision", e.target.value)}
              rows={2}
              className={INPUT}
            />
          </label>
          <button
            type="button"
            disabled={loading}
            onClick={() => void kirim()}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Menerapkan…" : "Terapkan ke register"}
          </button>
          {umum && (
            <p role="alert" className="form-error">
              {umum}{" "}
              {sudahAda && (
                <Link href={`/narasi/klarifikasi/${sudahAda}`} className="underline">
                  Buka klarifikasi yang ada
                </Link>
              )}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
