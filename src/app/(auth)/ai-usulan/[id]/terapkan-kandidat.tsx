"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import {
  bodyTerapkan,
  isianAwalTerapkan,
  validasiTerapkan,
  type GalatTerapkan,
  type IsianTerapkan,
  type KandidatKonteks,
} from "@/lib/ai-usulan-konteks";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { GELOMBANG } from "@/lib/redesain-register";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link TerapkanKandidat}. */
export interface TerapkanKandidatProps {
  /** Id usulan P11. */
  usulanId: string;
  /** Kandidat dari `isi.konteks_candidates`. */
  kandidat: KandidatKonteks[];
  /** Peta indeks kandidat -> kode konteks yang sudah diterapkan. */
  terapan: ReadonlyMap<number, string>;
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

/**
 * Panel "Terapkan kandidat" pada detail usulan P11: satu bagian per kandidat. Kandidat yang
 * sudah diterapkan tampil sebagai penanda "Sudah diterapkan sebagai {kode}" tanpa form.
 *
 * @param props - Lihat {@link TerapkanKandidatProps}.
 */
export function TerapkanKandidat({
  usulanId,
  kandidat,
  terapan,
  accessToken,
}: TerapkanKandidatProps) {
  return (
    <section aria-labelledby="terapkan-judul" className="space-y-3">
      <h2 id="terapkan-judul" className="text-base font-semibold">
        Terapkan kandidat
      </h2>
      {kandidat.length === 0 ? (
        <p role="status" className="text-sm text-gray-600 dark:text-gray-400">
          Usulan ini tidak memuat kandidat konteks.
        </p>
      ) : (
        <ul className="space-y-3">
          {kandidat.map((k) => {
            const kode = terapan.get(k.indeks);
            return (
              <li
                key={k.indeks}
                className="rounded-md border border-gray-200 p-3 dark:border-gray-700"
              >
                <p className="text-sm font-medium">
                  Kandidat {k.indeks + 1}: {k.tema || "(tanpa tema)"}
                </p>
                {kode ? (
                  <p role="status" className="mt-1 text-sm text-green-700 dark:text-green-400">
                    Sudah diterapkan sebagai {kode}
                  </p>
                ) : (
                  <FormKandidat usulanId={usulanId} kandidat={k} accessToken={accessToken} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

interface FormKandidatProps {
  usulanId: string;
  kandidat: KandidatKonteks;
  accessToken: string | undefined;
}

/**
 * Form Terapkan satu kandidat. Validasi klien {@link validasiTerapkan}; kirim lewat
 * `POST /api/v1/ai/usulan/{usulan_id}/terapkan-konteks` dengan `Idempotency-Key`. Sukses (201)
 * hanya setelah 2xx: notifikasi `Konteks {kode} dibuat` lalu `router.refresh()`. Galat 409
 * (`KANDIDAT_SUDAH_DITERAPKAN`, `USULAN_BELUM_DITERIMA`, `conflict`) dan 422 tampil sebagai
 * pesan form; isian tidak dibuang.
 */
function FormKandidat({ usulanId, kandidat, accessToken }: FormKandidatProps) {
  const router = useRouter();
  const idem = useIdempotencyKey();
  const [isian, setIsian] = useState<IsianTerapkan>(() => isianAwalTerapkan(kandidat));
  const [galat, setGalat] = useState<GalatTerapkan>({});
  const [umum, setUmum] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function ubah<K extends keyof IsianTerapkan>(k: K, v: IsianTerapkan[K]) {
    setIsian((p) => ({ ...p, [k]: v }));
  }

  async function kirim() {
    const salah = validasiTerapkan(isian);
    setGalat(salah);
    setUmum(null);
    if (Object.keys(salah).length > 0) return;
    const body = bodyTerapkan(kandidat.indeks, isian);
    setLoading(true);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/ai/usulan/{usulan_id}/terapkan-konteks",
        {
          params: { path: { usulan_id: usulanId } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      notifySukses(`Konteks ${res.data.kode} dibuat`);
      router.refresh();
    } catch (err) {
      const g = petakanKonkurensi(err, true);
      setUmum(pesanGagal(g));
      notifyGagal(g);
    } finally {
      setLoading(false);
    }
  }

  const pesan = (k: keyof IsianTerapkan) =>
    galat[k] ? (
      <span role="alert" className="mt-1 block text-xs text-red-600">
        {galat[k]}
      </span>
    ) : null;
  const id = (f: string) => `kand-${kandidat.indeks}-${f}`;

  return (
    <div className="mt-2 space-y-3">
      {kandidat.mirip_kode.length > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Mirip konteks yang ada: {kandidat.mirip_kode.join(", ")}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm" htmlFor={id("kode")}>
          <span className="block text-gray-600 dark:text-gray-400">Kode (K-NN)</span>
          <input
            id={id("kode")}
            value={isian.kode}
            onChange={(e) => ubah("kode", e.target.value)}
            placeholder="K-15"
            className={INPUT}
          />
          {pesan("kode")}
        </label>
        <label className="text-sm" htmlFor={id("gelombang")}>
          <span className="block text-gray-600 dark:text-gray-400">Gelombang</span>
          <select
            id={id("gelombang")}
            value={isian.gelombang}
            onChange={(e) => ubah("gelombang", e.target.value)}
            className={INPUT}
          >
            {GELOMBANG.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          {pesan("gelombang")}
        </label>
      </div>
      {(
        [
          ["tema", "Tema", 2],
          ["ruang_dugaan", "Ruang dugaan", 3],
          ["sumber_draft", "Sumber draf", 3],
          ["batas_pemeriksaan", "Batas pemeriksaan", 3],
        ] as const
      ).map(([f, label, baris]) => (
        <label key={f} className="block text-sm" htmlFor={id(f)}>
          <span className="block text-gray-600 dark:text-gray-400">{label}</span>
          <textarea
            id={id(f)}
            value={isian[f]}
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
        {loading ? "Menerapkan…" : "Terapkan kandidat"}
      </button>
      {umum && (
        <p role="alert" className="form-error">
          {umum}
        </p>
      )}
    </div>
  );
}
