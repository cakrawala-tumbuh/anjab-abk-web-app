"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari, type ApiResult } from "@/lib/api/errors";
import type { AiEffort, AiPenyediaMode, AiPenyediaRead, SaklarAiRead } from "@/lib/api/schema";
import {
  ALASAN_MIN_PENYEDIA,
  KETERANGAN_LANGGANAN,
  KUNCI_API_MIN,
  MODE_LANGGANAN,
  PERINTAH_MASUK_CLI,
  TAUTAN_LANGGANAN,
  labelMode,
  perluPeringatanCli,
  teksStatusKunci,
} from "@/lib/ai-penyedia";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

/** Properti {@link PenyediaPanel}. */
export interface PenyediaPanelProps {
  /** Pengaturan penyedia dari server (`GET /api/v1/system/ai/penyedia`). */
  penyedia: AiPenyediaRead;
  /** Status saklar dari server (`GET /api/v1/system/ai/saklar`), hanya untuk `boleh_jalan`. */
  saklar: SaklarAiRead;
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

/** Nama aksi; menentukan pesan sukses dan bagian key idempotensi. */
type Aksi = "mode" | "model" | "kredensial" | "hapus";

const SUKSES: Record<Aksi, string> = {
  mode: "Penyedia AI diganti.",
  model: "Model dan effort AI diperbarui.",
  kredensial: "Kunci API terpasang.",
  hapus: "Kunci API dihapus.",
};

/** Format waktu UTC apa adanya; `—` bila kosong. */
function waktu(v: string | null | undefined): string {
  return v ?? "—";
}

const KELAS_INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";
const KELAS_TOMBOL =
  "rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800";
const KELAS_CATATAN = "rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800";

/**
 * Panel pengaturan penyedia AI: status, ganti mode, ganti model dan effort, serta pasang atau
 * hapus kunci API.
 *
 * Opsi mode dan effort hanya dari `mode_tersedia` dan `effort_tersedia` milik API. Setiap
 * aksi beralasan (minimal {@link ALASAN_MIN_PENYEDIA} karakter), memakai klien bertipe, dan
 * sukses hanya ditampilkan setelah respons 2xx, lalu `router.refresh()`.
 *
 * Penanganan kunci API: satu-satunya input kredensial di layar ini. Nilainya hanya ada di
 * state input dan satu variabel lokal selama permintaan; ia dikosongkan di blok `finally`
 * setelah respons apa pun (sukses, galat server, atau galat jaringan), dan tidak pernah
 * masuk URL, toast, pesan galat, props, maupun `Idempotency-Key`. Aksi kunci memakai key BARU
 * per upaya (bukan `keyUntuk(body)`), karena hook itu menyimpan serialisasi isi kiriman di
 * memori dan backend membalas respons lama bila key sama dipakai dengan kunci berbeda.
 *
 * Memilih penyedia tidak menyalakan AI; panel menampilkan `boleh_jalan` saklar berdampingan.
 *
 * @param props - Lihat {@link PenyediaPanelProps}.
 */
export function PenyediaPanel({ penyedia, saklar, accessToken }: PenyediaPanelProps) {
  const router = useRouter();
  const idem = useIdempotencyKey();
  const [loading, setLoading] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const [mode, setMode] = useState<string>(penyedia.mode);
  const [alasanMode, setAlasanMode] = useState("");

  const [model, setModel] = useState(penyedia.model);
  const [effort, setEffort] = useState<string>(penyedia.effort);
  const [alasanModel, setAlasanModel] = useState("");

  const [kunci, setKunci] = useState("");
  const [alasanKunci, setAlasanKunci] = useState("");

  const dasarSiap = !loading;
  const kunciBisaDipasang = penyedia.enkripsi_siap;

  /**
   * Jalankan satu aksi beralasan.
   *
   * `isi` hanya dipakai menghitung `Idempotency-Key` lewat `keyUntuk` dan TIDAK PERNAH memuat
   * kunci API; `keyBaru` memaksa key baru per upaya (aksi kunci). `panggil` melakukan POST
   * bertipe. `selesai` dipanggil di `finally`, tempat state sensitif dikosongkan.
   */
  async function kirim(
    aksi: Aksi,
    alasan: string,
    isi: Record<string, unknown>,
    panggil: (
      alasanBersih: string,
      headers: Record<string, string>,
    ) => Promise<ApiResult & { data?: unknown }>,
    options: { keyBaru?: boolean; selesai?: () => void; sukses?: () => void } = {},
  ) {
    const alasanBersih = alasan.trim();
    if (alasanBersih.length < ALASAN_MIN_PENYEDIA) {
      setGalat(`Alasan minimal ${ALASAN_MIN_PENYEDIA} karakter.`);
      return;
    }
    setLoading(true);
    setGalat(null);
    try {
      const key = options.keyBaru
        ? crypto.randomUUID()
        : idem.keyUntuk({ aksi, ...isi, alasan: alasanBersih });
      const res = await panggil(alasanBersih, headerIdempotencyKey(key));
      if (!res.data) throw apiErrorDari(res);
      if (!options.keyBaru) idem.perbarui();
      options.sukses?.();
      notifySukses(SUKSES[aksi]);
      router.refresh();
    } catch (e) {
      const err = petakanKonkurensi(e, true);
      setGalat(pesanGagal(err));
      notifyGagal(err);
    } finally {
      options.selesai?.();
      setLoading(false);
    }
  }

  function kirimMode() {
    void kirim(
      "mode",
      alasanMode,
      { mode },
      (alasan, headers) =>
        withServerAuth(accessToken).POST("/api/v1/system/ai/penyedia/mode", {
          body: { mode: mode as AiPenyediaMode, alasan },
          headers,
        }),
      { sukses: () => setAlasanMode("") },
    );
  }

  function kirimModel() {
    const modelBersih = model.trim() === "" ? null : model.trim();
    void kirim(
      "model",
      alasanModel,
      { model: modelBersih, effort },
      (alasan, headers) =>
        withServerAuth(accessToken).POST("/api/v1/system/ai/penyedia/model", {
          body: { model: modelBersih, effort: effort as AiEffort, alasan },
          headers,
        }),
      { sukses: () => setAlasanModel("") },
    );
  }

  function kirimKunci() {
    const nilai = kunci.trim();
    if (nilai.length < KUNCI_API_MIN) {
      setGalat(`Kunci API minimal ${KUNCI_API_MIN} karakter.`);
      return;
    }
    void kirim(
      "kredensial",
      alasanKunci,
      {},
      (alasan, headers) =>
        withServerAuth(accessToken).POST("/api/v1/system/ai/penyedia/kredensial", {
          body: { kunci_api: nilai, alasan },
          headers,
        }),
      {
        keyBaru: true,
        sukses: () => setAlasanKunci(""),
        selesai: () => setKunci(""),
      },
    );
  }

  function hapusKunci() {
    void kirim(
      "hapus",
      alasanKunci,
      {},
      (alasan, headers) =>
        withServerAuth(accessToken).POST("/api/v1/system/ai/penyedia/kredensial/hapus", {
          body: { alasan },
          headers,
        }),
      { sukses: () => setAlasanKunci("") },
    );
  }

  const peringatanCli = perluPeringatanCli(penyedia);
  const kunciTerpasangTakTerbaca = penyedia.kredensial_terpasang && !penyedia.kredensial_terbaca;

  return (
    <div className="space-y-8">
      <section className="form-card space-y-4 p-6" aria-labelledby="judul-status-penyedia">
        <h2
          id="judul-status-penyedia"
          className="text-base font-semibold text-gray-900 dark:text-gray-50"
        >
          Status penyedia
        </h2>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Mode</dt>
            <dd>{labelMode(penyedia.mode)}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Model</dt>
            <dd className="font-mono text-xs break-all">{penyedia.model}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Effort</dt>
            <dd>{penyedia.effort}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Kunci API</dt>
            <dd>{teksStatusKunci(penyedia)}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">CLI langganan</dt>
            <dd>
              {penyedia.langganan_cli_terpasang
                ? `Terpasang${penyedia.langganan_cli_versi ? ` (${penyedia.langganan_cli_versi})` : ""}`
                : "Belum terpasang"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Masuk CLI langganan</dt>
            <dd>{penyedia.langganan_cli_masuk ? "Sudah masuk" : "Belum masuk"}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Boleh jalan (saklar)</dt>
            <dd>{saklar.boleh_jalan ? "Ya" : "Tidak"}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Diperbarui oleh · waktu</dt>
            <dd className="break-words">
              {penyedia.diperbarui_oleh ?? "—"} · {waktu(penyedia.diperbarui_pada)}
            </dd>
          </div>
        </dl>
        <p role="note" className="text-sm text-gray-600 dark:text-gray-300">
          Memilih penyedia tidak menyalakan AI. Menyalakan AI tetap memerlukan flag layanan dan
          saklar yang hidup.
        </p>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Lokasi inferensi (env, baca-saja)</dt>
            <dd>{penyedia.inference_geo || "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Refusal fallback (env, baca-saja)</dt>
            <dd>{penyedia.refusal_fallback ? "Aktif" : "Mati"}</dd>
          </div>
        </dl>
      </section>

      {galat && (
        <p role="alert" className="text-sm text-red-600">
          {galat}
        </p>
      )}

      <section className="form-card space-y-4 p-6" aria-labelledby="judul-mode-penyedia">
        <h2
          id="judul-mode-penyedia"
          className="text-base font-semibold text-gray-900 dark:text-gray-50"
        >
          Mode penyedia
        </h2>
        <div className="space-y-2">
          <label htmlFor="mode-penyedia" className="block text-sm font-medium">
            Mode
          </label>
          <select
            id="mode-penyedia"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className={KELAS_INPUT}
          >
            {penyedia.mode_tersedia.map((m) => (
              <option key={m} value={m}>
                {labelMode(m)}
              </option>
            ))}
          </select>
          <label htmlFor="alasan-mode" className="block text-sm font-medium">
            Alasan perubahan mode (min. {ALASAN_MIN_PENYEDIA} karakter)
          </label>
          <textarea
            id="alasan-mode"
            value={alasanMode}
            onChange={(e) => setAlasanMode(e.target.value)}
            rows={2}
            maxLength={2000}
            className={KELAS_INPUT}
          />
          <button type="button" onClick={kirimMode} disabled={!dasarSiap} className={KELAS_TOMBOL}>
            Ganti mode
          </button>
        </div>

        <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            {labelMode(MODE_LANGGANAN)}
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-200">{KETERANGAN_LANGGANAN}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {TAUTAN_LANGGANAN.map((t) => (
              <li key={t.href}>
                <a
                  href={t.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {t.label}
                </a>{" "}
                <span className="break-all text-xs text-gray-500 dark:text-gray-400">
                  ({t.href})
                </span>
              </li>
            ))}
          </ul>
          {peringatanCli && (
            <p role="note" className={KELAS_CATATAN}>
              Mode langganan terpilih, tetapi CLI langganan belum siap (
              {penyedia.langganan_cli_terpasang ? "belum masuk" : "belum terpasang"}), sehingga
              panggilan model akan gagal. Operator perlu masuk di dalam kontainer dengan{" "}
              <code>{PERINTAH_MASUK_CLI}</code>.
            </p>
          )}
        </div>
      </section>

      <section className="form-card space-y-4 p-6" aria-labelledby="judul-model-penyedia">
        <h2
          id="judul-model-penyedia"
          className="text-base font-semibold text-gray-900 dark:text-gray-50"
        >
          Model dan effort
        </h2>
        <div className="space-y-2">
          <label htmlFor="model-penyedia" className="block text-sm font-medium">
            Model
          </label>
          <input
            id="model-penyedia"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            maxLength={100}
            autoComplete="off"
            spellCheck={false}
            className={KELAS_INPUT}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Bawaan: <span className="font-mono">{penyedia.model_bawaan}</span>. Kosongkan untuk
            memakai bawaan.
          </p>
          <label htmlFor="effort-penyedia" className="block text-sm font-medium">
            Effort
          </label>
          <select
            id="effort-penyedia"
            value={effort}
            onChange={(e) => setEffort(e.target.value)}
            className={KELAS_INPUT}
          >
            {penyedia.effort_tersedia.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Bawaan: <span className="font-mono">{penyedia.effort_bawaan}</span>.
          </p>
          <label htmlFor="alasan-model" className="block text-sm font-medium">
            Alasan perubahan model (min. {ALASAN_MIN_PENYEDIA} karakter)
          </label>
          <textarea
            id="alasan-model"
            value={alasanModel}
            onChange={(e) => setAlasanModel(e.target.value)}
            rows={2}
            maxLength={2000}
            className={KELAS_INPUT}
          />
          <button type="button" onClick={kirimModel} disabled={!dasarSiap} className={KELAS_TOMBOL}>
            Simpan model dan effort
          </button>
        </div>
      </section>

      <section className="form-card space-y-4 p-6" aria-labelledby="judul-kunci-penyedia">
        <h2
          id="judul-kunci-penyedia"
          className="text-base font-semibold text-gray-900 dark:text-gray-50"
        >
          Kunci API Anthropic
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Status: <strong>{teksStatusKunci(penyedia)}</strong>. Kunci disimpan terenkripsi dan tidak
          pernah ditampilkan kembali. Formulir ini hanya untuk kunci API.
        </p>
        {!penyedia.enkripsi_siap && (
          <p role="note" className={KELAS_CATATAN}>
            Penyimpanan kunci belum siap: operator perlu mengisi{" "}
            <code>AI_KREDENSIAL_KUNCI_INDUK</code> pada deployment, lalu memulai ulang layanan.
          </p>
        )}
        {kunciTerpasangTakTerbaca && (
          <p role="note" className={KELAS_CATATAN}>
            Kunci yang tersimpan tidak dapat dibaca dengan kunci induk saat ini. Pasang ulang kunci
            API.
          </p>
        )}
        <div className="space-y-2">
          <label htmlFor="kunci-api" className="block text-sm font-medium">
            Kunci API (min. {KUNCI_API_MIN} karakter)
          </label>
          <input
            id="kunci-api"
            type="password"
            value={kunci}
            onChange={(e) => setKunci(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={!kunciBisaDipasang}
            className={KELAS_INPUT}
          />
          <label htmlFor="alasan-kunci" className="block text-sm font-medium">
            Alasan perubahan kunci (min. {ALASAN_MIN_PENYEDIA} karakter)
          </label>
          <textarea
            id="alasan-kunci"
            value={alasanKunci}
            onChange={(e) => setAlasanKunci(e.target.value)}
            rows={2}
            maxLength={2000}
            className={KELAS_INPUT}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={kirimKunci}
              disabled={!dasarSiap || !kunciBisaDipasang}
              className={KELAS_TOMBOL}
            >
              Pasang kunci
            </button>
            {penyedia.kredensial_terpasang && (
              <button
                type="button"
                onClick={hapusKunci}
                disabled={!dasarSiap}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Hapus kunci
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
