"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AutoRefresh } from "@/components/auto-refresh";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { PermintaanAiRead } from "@/lib/api/schema";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import {
  PERINGATAN_TANPA_SUMBER,
  PESAN_DITERIMA,
  PESAN_JALUR_MANUAL,
  STATUS_KASUS_BOLEH_AJUKAN,
  adaBelumDiserap,
  bodyPengajuan,
  labelIzinAi,
  pesanGagalPengajuan,
  statusPermintaanAi,
  type OpsiSumberAi,
} from "@/lib/narasi-permintaan";
import { notifyGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

/** Properti {@link PermintaanDrafAi}. */
export interface PermintaanDrafAiProps {
  /** Id kasus. */
  kasusId: string;
  /** Status kasus saat halaman dimuat. */
  statusKasus: string;
  /** Pilihan sumber (data inti, termuat penuh). */
  sumberOpsi: OpsiSumberAi[];
  /** Permintaan yang sudah ada (data inti, termuat penuh; terbaru dulu). */
  permintaan: PermintaanAiRead[];
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

/**
 * Panel permintaan draf AI atas satu kasus.
 *
 * Daftar permintaan dirender langsung dari prop (tanpa cermin state); setelah 202 halaman
 * disegarkan lewat `router.refresh()`. Sukses TIDAK pernah dinyatakan: 202 hanya berarti
 * permintaan diterima. `AutoRefresh` berjalan hanya selagi ada permintaan yang belum diserap.
 * Flag AI tidak diperiksa di klien: backend pemutusnya, dan 409-nya tampil sebagai pesan.
 *
 * @param props - Lihat {@link PermintaanDrafAiProps}.
 */
export function PermintaanDrafAi({
  kasusId,
  statusKasus,
  sumberOpsi,
  permintaan,
  accessToken,
}: PermintaanDrafAiProps) {
  const router = useRouter();
  const idem = useIdempotencyKey();
  const [terpilih, setTerpilih] = useState<string[]>([]);
  const [kirim, setKirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [diterima, setDiterima] = useState(false);

  const boleh = (STATUS_KASUS_BOLEH_AJUKAN as readonly string[]).includes(statusKasus);
  const perluSegar = adaBelumDiserap(permintaan);

  function toggle(id: string) {
    setTerpilih((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function ajukan(e: React.FormEvent) {
    e.preventDefault();
    setGalat(null);
    setDiterima(false);
    setKirim(true);
    const body = bodyPengajuan(terpilih);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/narasi/kasus/{narasi_id}/draf-ai",
        {
          params: { path: { narasi_id: kasusId } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      setDiterima(true);
      router.refresh();
    } catch (err) {
      const g = petakanKonkurensi(err, true);
      setGalat(pesanGagalPengajuan(g));
      notifyGagal(g);
    } finally {
      setKirim(false);
    }
  }

  return (
    <div className="space-y-4">
      {perluSegar && <AutoRefresh intervalMs={10000} />}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Draf AI hanya kandidat dan belum diperiksa siapa pun. {PESAN_JALUR_MANUAL}
      </p>

      {permintaan.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Belum ada permintaan draf AI untuk kasus ini.
        </p>
      ) : (
        <ul className="space-y-2" aria-label="Permintaan draf AI">
          {permintaan.map((p) => {
            const t = statusPermintaanAi(p);
            return (
              <li
                key={p.id}
                className="rounded-md border border-gray-200 p-3 text-sm dark:border-gray-700"
              >
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-medium">{t.judul}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    diajukan {new Date(p.created_at).toLocaleString("id-ID")}
                    {p.diserap_at
                      ? `, diserap ${new Date(p.diserap_at).toLocaleString("id-ID")}`
                      : ", belum diserap"}
                  </span>
                </div>
                <p className="mt-1 whitespace-normal break-words">{t.keterangan}</p>
                {t.kodeTeknis.length > 0 && (
                  <p className="mt-1 break-words text-xs text-gray-500 dark:text-gray-400">
                    Kode: {t.kodeTeknis.join(", ")}
                  </p>
                )}
                {t.tautanAntrean && (
                  <p className="mt-1">
                    <Link href={`/narasi/antrean/${kasusId}`} className="text-sm underline">
                      Buka di antrean tinjauan
                    </Link>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {boleh ? (
        <form onSubmit={ajukan} className="space-y-3" noValidate>
          <fieldset className="space-y-1 rounded-md border border-gray-200 p-3 dark:border-gray-700">
            <legend className="px-1 text-sm font-medium">Sumber yang diajukan</legend>
            {sumberOpsi.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">Belum ada sumber narasi.</p>
            )}
            {sumberOpsi.map((s) => (
              <label key={s.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={terpilih.includes(s.id)}
                  onChange={() => toggle(s.id)}
                  className="mt-1"
                />
                <span className="break-words">
                  {s.judul} ({s.versi}, {s.periode}) —{" "}
                  <span className={s.izin_ai ? "" : "text-amber-700 dark:text-amber-400"}>
                    {labelIzinAi(s.izin_ai)}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          {terpilih.length === 0 && (
            <p role="status" className="text-xs text-amber-700 dark:text-amber-400">
              {PERINGATAN_TANPA_SUMBER}
            </p>
          )}
          <button
            type="submit"
            disabled={kirim}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {kirim ? "Mengirim…" : "Minta draf AI"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Permintaan draf AI hanya untuk kasus berstatus SOURCE_CHECKED atau NEED_FACT. Status kasus
          ini {statusKasus}.
        </p>
      )}

      {diterima && (
        <p role="status" className="text-sm">
          {PESAN_DITERIMA}
        </p>
      )}
      {galat && (
        <p role="alert" className="form-error">
          {galat}
        </p>
      )}
    </div>
  );
}
