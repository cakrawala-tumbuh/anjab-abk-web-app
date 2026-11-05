"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { ApiError, apiErrorDari } from "@/lib/api/errors";
import type { AksiTinjauan as KodeAksi, NarasiSumberRingkas } from "@/lib/api/schema";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import {
  AKSI_WAJIB_CATATAN,
  BARIS_KOREKSI_BARU,
  KODE_NARASI_TANPA_TEKS,
  KODE_VERSI_BASI,
  LABEL_AKSI,
  bodyTinjauan,
  koreksiValid,
  pesanSelesaiTinjauan,
  validasiCatatan,
  validasiKoreksi,
  type GalatKoreksi,
  type IsianKoreksi,
} from "@/lib/narasi-tinjauan";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";
import { FormKoreksi } from "./form-koreksi";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";
const TOMBOL =
  "rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800";

/** Properti {@link AksiTinjauan}. */
export interface AksiTinjauanProps {
  /** Id kasus. */
  narasiId: string;
  /** Id versi yang sedang ditampilkan; selalu dikirim sebagai `narasi_versi_id`. */
  versiId: string;
  /** `true` bila versi punya teks; `TERIMA` nonaktif bila `false`. */
  adaTeks: boolean;
  /** Pilihan sumber untuk formulir koreksi. */
  sumberOpsi: NarasiSumberRingkas[];
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

/**
 * Empat aksi tinjauan satu kasus: Terima, Koreksi, Tolak, Butuh sumber. Tidak ada aksi
 * massal; setiap keputusan berlaku atas satu versi yang sedang dilihat.
 *
 * `POST /api/v1/narasi/kasus/{id}/tinjauan` dengan `Idempotency-Key` dari
 * `useIdempotencyKey().keyUntuk(body)`. Sukses ditampilkan hanya setelah respons 2xx, lalu
 * kembali ke antrean dengan pesan yang menyebut `ke_status`. 409 `versi_basi` meminta memuat
 * ulang tanpa membuang isian (state ada di komponen ini, yang tetap terpasang saat
 * `router.refresh()`).
 *
 * @param props - Lihat {@link AksiTinjauanProps}.
 */
export function AksiTinjauan({
  narasiId,
  versiId,
  adaTeks,
  sumberOpsi,
  accessToken,
}: AksiTinjauanProps) {
  const router = useRouter();
  const idem = useIdempotencyKey();
  const [catatan, setCatatan] = useState("");
  const [galatCatatan, setGalatCatatan] = useState<string | null>(null);
  const [koreksiBuka, setKoreksiBuka] = useState(false);
  const [koreksi, setKoreksi] = useState<IsianKoreksi>({
    teks: "",
    catatan: "",
    sumber: [{ ...BARIS_KOREKSI_BARU }],
  });
  const [galatKoreksi, setGalatKoreksi] = useState<GalatKoreksi>({});
  const [umum, setUmum] = useState<string | null>(null);
  const [basi, setBasi] = useState(false);
  const [loading, setLoading] = useState(false);

  async function kirim(aksi: KodeAksi, catatanKirim: string, isian?: IsianKoreksi) {
    setUmum(null);
    setBasi(false);
    setLoading(true);
    const body = bodyTinjauan(aksi, versiId, catatanKirim, isian);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/narasi/kasus/{narasi_id}/tinjauan",
        {
          params: { path: { narasi_id: narasiId } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      notifySukses(pesanSelesaiTinjauan(res.data.ke_status));
      router.push("/narasi/antrean");
      router.refresh();
    } catch (err) {
      const g = petakanKonkurensi(err, true);
      if (g instanceof ApiError && g.code === KODE_VERSI_BASI) setBasi(true);
      setUmum(
        g instanceof ApiError && g.code === KODE_NARASI_TANPA_TEKS
          ? "Versi ini tidak punya teks, sehingga tidak dapat diterima."
          : pesanGagal(g),
      );
      notifyGagal(g);
    } finally {
      setLoading(false);
    }
  }

  function terima() {
    if (!adaTeks) return;
    if (
      !window.confirm(
        "Terima versi ini? Keputusan tercatat atas nama Anda dan hanya berarti sudah diperiksa Tim Kajian.",
      )
    )
      return;
    void kirim("TERIMA", "");
  }

  function dengan(aksi: (typeof AKSI_WAJIB_CATATAN)[number]) {
    const salah = validasiCatatan(catatan);
    setGalatCatatan(salah);
    if (salah) return;
    void kirim(aksi, catatan);
  }

  function kirimKoreksi() {
    const salah = validasiKoreksi(koreksi);
    setGalatKoreksi(salah);
    if (!koreksiValid(salah)) return;
    void kirim("KOREKSI", koreksi.catatan, koreksi);
  }

  return (
    <section aria-labelledby="aksi-tinjauan" className="space-y-3">
      <h2 id="aksi-tinjauan" className="text-base font-semibold">
        Keputusan atas versi ini
      </h2>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Satu keputusan per kasus. Hasil tertinggi dari tinjauan ini hanyalah
        &ldquo;TEAM_VERIFIED&rdquo; (sudah diperiksa Tim Kajian).
      </p>

      <div className="text-sm">
        <label htmlFor="catatan-tinjauan" className="block text-gray-600 dark:text-gray-400">
          Catatan (wajib untuk Tolak dan Butuh sumber, minimal 5 karakter)
        </label>
        <textarea
          id="catatan-tinjauan"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          rows={3}
          className={INPUT}
        />
        {galatCatatan && (
          <span role="alert" className="mt-1 block text-xs text-red-600">
            {galatCatatan}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading || !adaTeks}
          onClick={terima}
          title={adaTeks ? undefined : "Versi tanpa teks tidak dapat diterima."}
          className={TOMBOL}
        >
          {LABEL_AKSI.TERIMA}
        </button>
        <button
          type="button"
          disabled={loading}
          aria-expanded={koreksiBuka}
          onClick={() => setKoreksiBuka((b) => !b)}
          className={TOMBOL}
        >
          {LABEL_AKSI.KOREKSI}
        </button>
        <button type="button" disabled={loading} onClick={() => dengan("TOLAK")} className={TOMBOL}>
          {LABEL_AKSI.TOLAK}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => dengan("BUTUH_SUMBER")}
          className={TOMBOL}
        >
          {LABEL_AKSI.BUTUH_SUMBER}
        </button>
      </div>
      {!adaTeks && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Versi ini belum punya teks, jadi Terima dinonaktifkan.
        </p>
      )}

      {koreksiBuka && (
        <div className="space-y-3 rounded-md border border-gray-200 p-3 dark:border-gray-700">
          <FormKoreksi
            isian={koreksi}
            onUbah={setKoreksi}
            galat={galatKoreksi}
            sumberOpsi={sumberOpsi}
          />
          <button
            type="button"
            disabled={loading}
            onClick={kirimKoreksi}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Menyimpan…" : "Kirim koreksi"}
          </button>
        </div>
      )}

      {umum && (
        <p role="alert" className="form-error">
          {umum}
          {basi && (
            <>
              {" "}
              Versi kasus sudah berubah sejak halaman dimuat. Isian Anda tetap dipertahankan; baca
              versi terbaru sebelum memutuskan.{" "}
              <button type="button" onClick={() => router.refresh()} className="underline">
                Muat ulang versi terbaru
              </button>
            </>
          )}
        </p>
      )}
    </section>
  );
}
