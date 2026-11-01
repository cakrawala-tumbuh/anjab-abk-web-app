"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { withServerAuth } from "@/lib/api/client";
import { ApiError, apiErrorDari } from "@/lib/api/errors";
import type {
  AlurRead,
  DugaanRead,
  KonfirmasiRead,
  KonfirmasiUpdate,
  MasalahSekolahRead,
} from "@/lib/api/schema";
import { PanelAlur } from "./panel-alur";
import { PetunjukKonfirmasi } from "./petunjuk-konfirmasi";
import { notifyGagal, notifySukses } from "@/lib/notify";
import {
  OPSI_INDIKASI,
  OPSI_KESESUAIAN,
  OPSI_SKALA,
  RUBRIK_K,
  TEKS_ESKALASI,
  langkahAwal,
  langkahMaks,
  pesanGagalWizard,
  type Langkah,
} from "@/lib/redesain-konfirmasi";

const NAMA_LANGKAH: ReadonlyArray<string> = [
  "Ceritakan dahulu",
  "Periksa dugaan",
  "Jelaskan akibat",
  "Periksa sumber",
  "Tutup sesi",
];

type Isian = {
  cerita_sebelum: string;
  kesesuaian: string;
  koreksi: string;
  k1: string;
  k2: string;
  k3: string;
  k4: string;
  alasan_k: string;
  indikasi_risiko: string;
  bukti_dapat_diperiksa: string;
  hal_belum_jelas: string;
  masalah_baru: string;
  catatan_independensi: string;
  catatan_akses: string;
  peran: string;
};

function isianAwal(k: KonfirmasiRead): Isian {
  return {
    cerita_sebelum: k.cerita_sebelum ?? "",
    kesesuaian: k.kesesuaian ?? "",
    koreksi: k.koreksi ?? "",
    k1: k.k1 ?? "",
    k2: k.k2 ?? "",
    k3: k.k3 ?? "",
    k4: k.k4 ?? "",
    alasan_k: k.alasan_k ?? "",
    indikasi_risiko: k.indikasi_risiko ?? "",
    bukti_dapat_diperiksa: k.bukti_dapat_diperiksa ?? "",
    hal_belum_jelas: k.hal_belum_jelas ?? "",
    masalah_baru: k.masalah_baru ?? "",
    catatan_independensi: k.catatan_independensi ?? "",
    catatan_akses: k.catatan_akses ?? "",
    peran: k.peran ?? "",
  };
}

/** Field langkah 2–4 (hanya boleh dikirim setelah dugaan ditampilkan). */
const FIELD_C_E = [
  "kesesuaian",
  "koreksi",
  "k1",
  "k2",
  "k3",
  "k4",
  "alasan_k",
  "indikasi_risiko",
  "bukti_dapat_diperiksa",
  "hal_belum_jelas",
  "masalah_baru",
  "catatan_independensi",
  "catatan_akses",
  "peran",
] as const;

/** Ubah isian string menjadi payload PATCH: string kosong → `null`. */
function payloadDari(isian: Isian, kunci: ReadonlyArray<keyof Isian>): KonfirmasiUpdate {
  const out: Record<string, string | null> = {};
  for (const f of kunci) out[f] = isian[f].trim() === "" ? null : isian[f];
  return out as KonfirmasiUpdate;
}

interface Props {
  konfirmasi: KonfirmasiRead;
  masalah: MasalahSekolahRead;
  dugaanAwal: DugaanRead | null;
  /** Peta alur sekolah; `null` selama dugaan belum ditampilkan (endpoint tidak dipanggil). */
  alur?: AlurRead | null;
  accessToken: string | undefined;
}

/**
 * Wizard lima langkah pengisian konfirmasi sekolah.
 *
 * Langkah yang boleh dibuka DITURUNKAN dari cap waktu server (`cerita_dikunci_pada`,
 * `dugaan_ditampilkan_pada`, `status`) lewat {@link langkahMaks} — bukan state lokal; state
 * lokal hanya menyimpan langkah yang sedang dilihat (ter-clamp) dan isian teks. Setelah
 * tiap aksi sukses, `router.refresh()` memuat ulang cap waktu dari server. Rumusan dugaan
 * tidak pernah ada di komponen ini sebelum `tampilkan-dugaan` dijawab 200.
 *
 * @param props.konfirmasi - Konfirmasi dari server.
 * @param props.masalah - Baris `sekolah/masalah` untuk bagian A (identitas masalah).
 * @param props.dugaanAwal - Rumusan bila dugaan sudah pernah ditampilkan, selain itu `null`.
 * @param props.alur - Peta alur untuk panel langkah 2; `null`/kosong bila dugaan belum tampil.
 * @param props.accessToken - Token akses dari Server Component induk.
 */
export function WizardKonfirmasi({ konfirmasi, masalah, dugaanAwal, alur, accessToken }: Props) {
  const router = useRouter();
  const [isian, setIsian] = useState<Isian>(() => isianAwal(konfirmasi));
  const [dilihat, setDilihat] = useState<Langkah | null>(null);
  const [dugaanLokal, setDugaanLokal] = useState<DugaanRead | null>(dugaanAwal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const terkirim = konfirmasi.status === "terkirim";
  const maks = langkahMaks(konfirmasi);
  const langkah = Math.min(dilihat ?? langkahAwal(konfirmasi), maks) as Langkah;
  const ceritaTerkunci = !!konfirmasi.cerita_dikunci_pada;
  const dugaanTampil = !!konfirmasi.dugaan_ditampilkan_pada || dugaanLokal !== null;
  const rumusan = dugaanLokal?.rumusan_hipotesis ?? dugaanAwal?.rumusan_hipotesis ?? null;
  const bacaSaja = terkirim;
  const id = konfirmasi.id;

  function ubah<K extends keyof Isian>(k: K, v: string) {
    setIsian((prev) => ({ ...prev, [k]: v }));
  }

  /** Jalankan satu aksi API dengan penanganan loading/galat/notifikasi seragam. */
  async function jalankan(aksi: () => Promise<void>, sukses: string | null): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      await aksi();
      if (sukses) notifySukses(sukses);
      return true;
    } catch (err) {
      const pesan = pesanGagalWizard(err);
      setError(pesan);
      notifyGagal(
        err instanceof ApiError
          ? new ApiError(
              { code: err.code, message: pesan, details: err.details },
              err.requestId,
              err.status,
            )
          : err,
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  const client = () => withServerAuth(accessToken);

  async function patch(body: KonfirmasiUpdate) {
    const res = await client().PATCH("/api/v1/redesain/konfirmasi/{konfirmasi_id}", {
      params: { path: { konfirmasi_id: id } },
      body,
    });
    if (res.error) throw apiErrorDari(res);
  }

  async function simpanCerita() {
    const ok = await jalankan(
      () => patch(payloadDari(isian, ["cerita_sebelum"])),
      "Draf cerita disimpan.",
    );
    if (ok) router.refresh();
  }

  async function kunciCerita() {
    if (!confirm("Cerita tidak dapat diubah lagi")) return;
    const ok = await jalankan(async () => {
      await patch(payloadDari(isian, ["cerita_sebelum"]));
      const res = await client().POST("/api/v1/redesain/konfirmasi/{konfirmasi_id}/kunci-cerita", {
        params: { path: { konfirmasi_id: id } },
      });
      if (res.error) throw apiErrorDari(res);
    }, "Cerita dikunci.");
    if (ok) {
      setDilihat(null);
      router.refresh();
    }
  }

  async function tampilkanDugaan() {
    const ok = await jalankan(async () => {
      const res = await client().POST(
        "/api/v1/redesain/konfirmasi/{konfirmasi_id}/tampilkan-dugaan",
        { params: { path: { konfirmasi_id: id } } },
      );
      if (!res.data) throw apiErrorDari(res);
      setDugaanLokal(res.data);
    }, null);
    if (ok) {
      setDilihat(null);
      router.refresh();
    }
  }

  async function simpanDraf() {
    const ok = await jalankan(() => patch(payloadDari(isian, FIELD_C_E)), "Draf disimpan.");
    if (ok) router.refresh();
  }

  async function kirim() {
    if (!confirm("Kirim konfirmasi? Setelah dikirim, isian tidak dapat diubah lagi.")) return;
    const ok = await jalankan(async () => {
      await patch(payloadDari(isian, FIELD_C_E));
      const res = await client().POST("/api/v1/redesain/konfirmasi/{konfirmasi_id}/kirim", {
        params: { path: { konfirmasi_id: id } },
      });
      if (res.error) throw apiErrorDari(res);
    }, "Konfirmasi terkirim.");
    if (ok) router.refresh();
  }

  const teks = (k: keyof Isian, label: string, opsi?: { baris?: number }) => (
    <div>
      <label htmlFor={`f-${k}`} className="form-label">
        {label}
      </label>
      <textarea
        id={`f-${k}`}
        rows={opsi?.baris ?? 3}
        value={isian[k]}
        readOnly={bacaSaja}
        onChange={(e) => ubah(k, e.target.value)}
        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
      />
    </div>
  );

  const pilih = (k: keyof Isian, label: string, daftar: ReadonlyArray<string>) => (
    <div>
      <label htmlFor={`f-${k}`} className="form-label">
        {label}
      </label>
      <select
        id={`f-${k}`}
        value={isian[k]}
        disabled={bacaSaja}
        onChange={(e) => ubah(k, e.target.value)}
        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
      >
        <option value="">— pilih —</option>
        {daftar.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="page-heading">Konfirmasi {masalah.kode}</h1>
          <p className="page-subtext">
            {masalah.konteks_kode} — {masalah.konteks_tema} · Periode acuan {masalah.periode_acuan}
          </p>
        </div>
        <PetunjukKonfirmasi defaultOpen={!terkirim} />
      </div>

      <section aria-label="Identitas masalah" className="page-card text-sm">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="font-medium">Kode masalah</dt>
            <dd className="font-mono">{masalah.kode}</dd>
          </div>
          <div>
            <dt className="font-medium">Status awal</dt>
            <dd>{masalah.status_awal}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium">Sumber awal keterbatasan</dt>
            <dd className="whitespace-normal break-words">{masalah.sumber_awal_keterbatasan}</dd>
          </div>
        </dl>
        {terkirim && (
          <p className="mt-2 font-medium text-green-700">Konfirmasi ini sudah terkirim.</p>
        )}
      </section>

      <nav aria-label="Langkah" className="flex flex-wrap gap-2">
        {NAMA_LANGKAH.map((nama, i) => {
          const n = (i + 1) as Langkah;
          const aktif = n === langkah;
          const terbuka = n <= maks;
          return (
            <button
              key={nama}
              type="button"
              disabled={!terbuka}
              aria-current={aktif ? "step" : undefined}
              onClick={() => setDilihat(n)}
              className={`rounded-md border px-3 py-1 text-sm ${
                aktif ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-900"
              } disabled:opacity-40`}
            >
              {n}. {nama}
            </button>
          );
        })}
      </nav>

      {error && (
        <div role="alert" className="form-server-error">
          {error}
        </div>
      )}

      <section className="page-card space-y-4">
        {langkah === 1 && (
          <>
            <h2 className="text-lg font-semibold">1. Ceritakan dahulu</h2>
            <p className="text-sm">
              Ceritakan dengan kata-kata Anda sendiri bagaimana masalah ini terjadi di sekolah Anda.
              Dugaan Tim Kajian baru diperlihatkan setelah cerita dikunci.
            </p>
            <PeringatanPrivasi />
            <div>
              <label htmlFor="f-cerita_sebelum" className="form-label">
                Cerita Anda
              </label>
              <textarea
                id="f-cerita_sebelum"
                rows={6}
                value={isian.cerita_sebelum}
                readOnly={bacaSaja || ceritaTerkunci}
                onChange={(e) => ubah("cerita_sebelum", e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            {ceritaTerkunci ? (
              <p className="text-sm font-medium">Cerita sudah dikunci dan tidak dapat diubah.</p>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={simpanCerita}
                  disabled={loading}
                  className="rounded-md border px-3 py-1"
                >
                  Simpan draf
                </button>
                <button
                  type="button"
                  onClick={kunciCerita}
                  disabled={loading}
                  className="rounded-md bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
                >
                  Kunci cerita
                </button>
              </div>
            )}
          </>
        )}

        {langkah === 2 && (
          <>
            <h2 className="text-lg font-semibold">2. Periksa dugaan</h2>
            {!dugaanTampil ? (
              <>
                <p className="text-sm">
                  Cerita Anda sudah dikunci. Sekarang Anda boleh melihat dugaan Tim Kajian.
                </p>
                <button
                  type="button"
                  onClick={tampilkanDugaan}
                  disabled={loading}
                  className="rounded-md bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
                >
                  Tampilkan dugaan
                </button>
              </>
            ) : (
              <>
                <blockquote className="rounded-md border-l-4 border-blue-400 bg-blue-50 p-3 text-sm dark:bg-blue-900/30">
                  <p className="font-medium">Dugaan Tim Kajian</p>
                  <p className="mt-1 whitespace-normal break-words">{rumusan}</p>
                </blockquote>
                {pilih(
                  "kesesuaian",
                  "Apakah dugaan ini sesuai dengan keadaan di sekolah Anda?",
                  OPSI_KESESUAIAN,
                )}
                <PeringatanPrivasi />
                {teks("koreksi", "Koreksi atau tambahan (bila ada)")}
                {alur && (
                  <PanelAlur alur={alur} konfirmasiId={konfirmasi.id} accessToken={accessToken} />
                )}
              </>
            )}
          </>
        )}

        {langkah === 3 && (
          <>
            <h2 className="text-lg font-semibold">3. Jelaskan akibat</h2>
            <p className="text-sm">
              Jawab hanya untuk hal yang Anda ketahui. Skor tidak dijumlah.{" "}
              <strong>Belum tahu ≠ Rendah.</strong>
            </p>
            {RUBRIK_K.map((r) => (
              <div key={r.kode} className="rounded-md border p-3">
                <p className="text-sm font-medium">
                  {r.label} — {r.pertanyaan}
                </p>
                <ul className="mb-2 mt-1 list-disc pl-5 text-xs text-gray-600 dark:text-gray-400">
                  <li>Tinggi: {r.tinggi}</li>
                  <li>Sedang: {r.sedang}</li>
                  <li>Rendah: {r.rendah}</li>
                </ul>
                {pilih(r.kode, r.label, OPSI_SKALA)}
              </div>
            ))}
            <PeringatanPrivasi />
            {teks("alasan_k", "Alasan penilaian K1–K4")}
          </>
        )}

        {langkah === 4 && (
          <>
            <h2 className="text-lg font-semibold">4. Periksa sumber</h2>
            <PeringatanPrivasi />
            <div>
              <label htmlFor="f-peran" className="form-label">
                Jabatan/peran Anda
              </label>
              <input
                id="f-peran"
                type="text"
                maxLength={200}
                value={isian.peran}
                readOnly={bacaSaja}
                onChange={(e) => ubah("peran", e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            {pilih("indikasi_risiko", "Indikasi risiko", OPSI_INDIKASI)}
            {isian.indikasi_risiko === "Ada indikasi" && (
              <p role="status" className="rounded-md bg-amber-50 p-2 text-sm text-amber-900">
                {TEKS_ESKALASI}
              </p>
            )}
            {teks("bukti_dapat_diperiksa", "Bukti yang dapat diperiksa")}
            {teks("hal_belum_jelas", "Hal yang belum jelas")}
            {teks("masalah_baru", "Masalah baru yang Anda lihat")}
            {teks("catatan_independensi", "Catatan independensi")}
            {teks("catatan_akses", "Catatan akses")}
          </>
        )}

        {langkah === 5 && (
          <>
            <h2 className="text-lg font-semibold">5. Tutup sesi</h2>
            <p className="text-sm">Periksa ringkasan isian Anda sebelum mengirim.</p>
            <dl className="space-y-2 text-sm">
              {(
                [
                  ["Cerita", isian.cerita_sebelum],
                  ["Dugaan Tim Kajian", rumusan ?? ""],
                  ["Kesesuaian", isian.kesesuaian],
                  ["Koreksi", isian.koreksi],
                  ["K1", isian.k1],
                  ["K2", isian.k2],
                  ["K3", isian.k3],
                  ["K4", isian.k4],
                  ["Alasan K1–K4", isian.alasan_k],
                  ["Jabatan/peran", isian.peran],
                  ["Indikasi risiko", isian.indikasi_risiko],
                  ["Bukti dapat diperiksa", isian.bukti_dapat_diperiksa],
                  ["Hal belum jelas", isian.hal_belum_jelas],
                  ["Masalah baru", isian.masalah_baru],
                  ["Catatan independensi", isian.catatan_independensi],
                  ["Catatan akses", isian.catatan_akses],
                ] as const
              ).map(([label, nilai]) => (
                <div key={label}>
                  <dt className="font-medium">{label}</dt>
                  <dd className="whitespace-pre-wrap break-words">{nilai || "—"}</dd>
                </div>
              ))}
            </dl>
            {!terkirim && (
              <button
                type="button"
                onClick={kirim}
                disabled={loading}
                className="rounded-md bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
              >
                Kirim
              </button>
            )}
          </>
        )}

        {!terkirim && langkah >= 2 && langkah <= 4 && dugaanTampil && (
          <div>
            <button
              type="button"
              onClick={simpanDraf}
              disabled={loading}
              className="rounded-md border px-3 py-1"
            >
              Simpan draf
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
