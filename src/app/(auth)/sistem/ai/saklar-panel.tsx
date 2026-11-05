"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { SaklarAiRead } from "@/lib/api/schema";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

/** Panjang minimum alasan yang diterima backend. */
export const ALASAN_MIN = 5;

/** Properti {@link SaklarPanel}. */
export interface SaklarPanelProps {
  /** Status saklar dari server (`GET /api/v1/system/ai/saklar`). */
  saklar: SaklarAiRead;
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

/** Format waktu UTC apa adanya; `—` bila kosong. */
function waktu(v: string | null | undefined): string {
  return v ?? "—";
}

/**
 * Panel saklar AI: menampilkan status dan mengirim aksi `Matikan` / `Hidupkan` beralasan.
 *
 * Panel ini hanya mencatat event saklar; ia TIDAK menyalakan flag env. Bila `flag_aktif`
 * `false`, panel menyatakan AI tetap tidak berjalan walau saklar hidup. `Matikan` tidak
 * meminta konfirmasi tambahan selain alasan (minimal {@link ALASAN_MIN} karakter) agar
 * penghentian saat insiden cepat. Sukses ditampilkan hanya setelah respons 2xx; setiap
 * upaya membawa `Idempotency-Key` (`keyUntuk` per isi kiriman), 409 tampil sebagai pesan.
 *
 * Galat dipetakan dengan `petakanKonkurensi(e, false)` (hanya 412 diganti pesan tetap): 409
 * `conflict` pada rute ini juga berarti penolakan keadaan ("Layanan X sudah dimatikan."), bukan
 * hanya idempotensi, jadi pesan backend ditampilkan apa adanya.
 *
 * @param props - Lihat {@link SaklarPanelProps}.
 */
export function SaklarPanel({ saklar, accessToken }: SaklarPanelProps) {
  const router = useRouter();
  const [alasan, setAlasan] = useState("");
  const [loading, setLoading] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const idem = useIdempotencyKey();

  const alasanBersih = alasan.trim();
  const alasanSah = alasanBersih.length >= ALASAN_MIN;

  /**
   * Kirim satu aksi saklar beralasan. Galat dipetakan `petakanKonkurensi(e, false)`: 409
   * `conflict` (penolakan keadaan maupun idempotensi) tampil dengan pesan backend apa adanya.
   */
  async function kirim(aksi: "matikan" | "hidupkan") {
    if (!alasanSah) {
      setGalat(`Alasan minimal ${ALASAN_MIN} karakter.`);
      return;
    }
    setLoading(true);
    setGalat(null);
    try {
      const body = { alasan: alasanBersih };
      const path =
        aksi === "matikan"
          ? "/api/v1/system/ai/saklar/matikan"
          : "/api/v1/system/ai/saklar/hidupkan";
      const res = await withServerAuth(accessToken).POST(path, {
        body,
        headers: headerIdempotencyKey(idem.keyUntuk({ aksi, ...body })),
      });
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      setAlasan("");
      notifySukses(aksi === "matikan" ? "Layanan AI dimatikan." : "Saklar AI dihidupkan kembali.");
      router.refresh();
    } catch (e) {
      const err = petakanKonkurensi(e, false);
      setGalat(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="form-card space-y-4 p-6" aria-labelledby="judul-saklar">
      <h2 id="judul-saklar" className="text-base font-semibold text-gray-900 dark:text-gray-50">
        Saklar AI
      </h2>

      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Layanan</dt>
          <dd className="font-mono text-xs">{saklar.layanan}</dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Flag env</dt>
          <dd>{saklar.flag_aktif ? "Aktif" : "Mati"}</dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Saklar</dt>
          <dd>{saklar.dimatikan ? "Dimatikan" : "Hidup"}</dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Boleh jalan</dt>
          <dd>{saklar.boleh_jalan ? "Ya" : "Tidak"}</dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Alasan terakhir</dt>
          <dd className="break-words">{saklar.alasan ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Aktor · waktu</dt>
          <dd className="break-words">
            {saklar.aktor ?? "—"} · {waktu(saklar.pada)}
          </dd>
        </div>
      </dl>

      {!saklar.flag_aktif && (
        <p
          role="note"
          className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          Flag env layanan ini mati, jadi AI tetap tidak berjalan walau saklar hidup. Saklar ini
          tidak dapat menyalakan flag.
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="alasan-saklar" className="block text-sm font-medium">
          Alasan (min. {ALASAN_MIN} karakter)
        </label>
        <textarea
          id="alasan-saklar"
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          rows={2}
          maxLength={2000}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
        />
        {galat && (
          <p role="alert" className="text-sm text-red-600">
            {galat}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => kirim("matikan")}
            disabled={loading}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Matikan
          </button>
          <button
            type="button"
            onClick={() => kirim("hidupkan")}
            disabled={loading}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            Hidupkan
          </button>
        </div>
      </div>
    </section>
  );
}
