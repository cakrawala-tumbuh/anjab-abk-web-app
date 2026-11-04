"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { PenilaianRead, PenilaianUpdate } from "@/lib/api/schema";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { bacaEtag, headerIfMatch, petakanKonkurensi } from "@/lib/konkurensi";
import { PemuatRekaman } from "@/lib/use-rekaman-ber-etag";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Opsi `status_bukti`. */
export const OPSI_STATUS_BUKTI = [
  "Hipotesis",
  "Keterangan kasus",
  "Diperkuat untuk klaim",
  "Diperselisihkan",
  "Belum cukup",
] as const;
/** Opsi `gap_material`. */
export const OPSI_GAP_MATERIAL = ["Ya", "Tidak", "Belum tahu"] as const;
/** Opsi `indikasi_kritis`. */
export const OPSI_INDIKASI_KRITIS = ["Ada indikasi", "Tidak terlihat", "Belum tahu"] as const;
/** Opsi skala K1–K4 (selain "belum diisi", yang dikirim `null`). */
export const OPSI_SKALA_K = ["Tinggi", "Sedang", "Rendah", "Belum tahu"] as const;

const KUNCI_K = ["k1", "k2", "k3", "k4"] as const;
const KUNCI_TEKS = [
  ["alasan_rentang_beda", "Alasan rentang beda"],
  ["diluruskan_sekolah", "Diluruskan sekolah"],
  ["pemeriksa_sekolah_konteks", "Pemeriksa sekolah / konteks"],
  ["tindak_lanjut", "Tindak lanjut"],
  ["catatan_sumber_versi", "Catatan sumber / versi"],
] as const;

/** Properti {@link FormPenilaian}. */
export interface FormPenilaianProps {
  /** Penilaian yang diubah (nilai awal form). */
  awal: PenilaianRead;
  accessToken: string | undefined;
}

/** Properti isi form: ditambah ETag dari GET detail yang sama dengan `awal`. */
interface FormPenilaianIsiProps extends FormPenilaianProps {
  etag?: string | null;
}

/**
 * Form ubah penilaian beserta panel saran sistem (berdampingan). Memuat penilaiannya
 * sendiri lewat `GET /penilaian/{id}` dan mengirim `If-Match` dari ETag GET yang sama
 * (`awal` dari daftar hanya dipakai untuk ID).
 *
 * Simpan → `PATCH /api/v1/redesain/penilaian/{id}`. K1–K4 berpilihan "— belum diisi —"
 * yang dikirim `null` (berbeda dari "Belum tahu"); teks bebas kosong dikirim `null`.
 * `saran_otomatis` & `versi_aturan_triase` ditampilkan apa adanya dari respons backend
 * (read-only, tidak pernah dihitung di web) dan diperbarui lewat `router.refresh()`
 * setelah simpan. Teks bebas dilindungi {@link PeringatanPrivasi}.
 *
 * @param props - Lihat {@link FormPenilaianProps}.
 */
export function FormPenilaian(props: FormPenilaianProps) {
  const { awal, accessToken } = props;
  return (
    <PemuatRekaman
      accessToken={accessToken}
      kunci={awal.id}
      ambil={(c) =>
        c.GET("/api/v1/redesain/penilaian/{penilaian_id}", {
          params: { path: { penilaian_id: awal.id } },
        })
      }
    >
      {(data, etag) => <FormPenilaianIsi {...props} awal={data} etag={etag} />}
    </PemuatRekaman>
  );
}

function FormPenilaianIsi({ awal, accessToken, etag: etagAwal = null }: FormPenilaianIsiProps) {
  const router = useRouter();
  const [etag, setEtag] = useState<string | null>(etagAwal);
  const [statusBukti, setStatusBukti] = useState<string>(awal.status_bukti);
  const [gap, setGap] = useState<string>(awal.gap_material);
  const [kritis, setKritis] = useState<string>(awal.indikasi_kritis);
  const [k, setK] = useState<Record<string, string>>({
    k1: awal.k1 ?? "",
    k2: awal.k2 ?? "",
    k3: awal.k3 ?? "",
    k4: awal.k4 ?? "",
  });
  const [teks, setTeks] = useState<Record<string, string>>(
    Object.fromEntries(KUNCI_TEKS.map(([key]) => [key, awal[key] ?? ""])),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body = {
        status_bukti: statusBukti,
        gap_material: gap,
        indikasi_kritis: kritis,
        ...Object.fromEntries(KUNCI_K.map((key) => [key, k[key] === "" ? null : k[key]])),
        ...Object.fromEntries(
          KUNCI_TEKS.map(([key]) => [key, teks[key].trim() === "" ? null : teks[key].trim()]),
        ),
      } as PenilaianUpdate;
      const res = await withServerAuth(accessToken).PATCH(
        "/api/v1/redesain/penilaian/{penilaian_id}",
        { params: { path: { penilaian_id: awal.id } }, body, headers: headerIfMatch(etag) },
      );
      if (!res.data) throw apiErrorDari(res);
      setEtag(bacaEtag(res.response));
      notifySukses("Penilaian disimpan.");
      router.refresh();
    } catch (err) {
      const galat = petakanKonkurensi(err);
      setError(pesanGagal(galat));
      notifyGagal(galat);
    } finally {
      setLoading(false);
    }
  }

  const pilih = (
    label: string,
    nilai: string,
    ubah: (v: string) => void,
    opsi: readonly string[],
    boleh_kosong = false,
  ) => (
    <label className="text-sm">
      <span className="block text-gray-600 dark:text-gray-400">{label}</span>
      <select
        aria-label={label}
        value={nilai}
        onChange={(e) => ubah(e.target.value)}
        className={INPUT}
      >
        {boleh_kosong && <option value="">— belum diisi —</option>}
        {opsi.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
      <form onSubmit={simpan} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          {pilih("Status bukti", statusBukti, setStatusBukti, OPSI_STATUS_BUKTI)}
          {pilih("Gap material", gap, setGap, OPSI_GAP_MATERIAL)}
          {pilih("Indikasi kritis", kritis, setKritis, OPSI_INDIKASI_KRITIS)}
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          {KUNCI_K.map((key) =>
            pilih(key.toUpperCase(), k[key], (v) => setK({ ...k, [key]: v }), OPSI_SKALA_K, true),
          )}
        </div>
        <PeringatanPrivasi />
        {KUNCI_TEKS.map(([key, label]) => (
          <label key={key} className="block text-sm">
            <span className="block text-gray-600 dark:text-gray-400">{label}</span>
            <textarea
              aria-label={label}
              rows={2}
              value={teks[key]}
              onChange={(e) => setTeks({ ...teks, [key]: e.target.value })}
              className={INPUT}
            />
          </label>
        ))}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Menyimpan…" : "Simpan penilaian"}
        </button>
      </form>

      <aside
        aria-label="Saran sistem"
        className="h-fit space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <h3 className="text-xs font-semibold uppercase text-gray-500">
          Saran sistem — bukan keputusan
        </h3>
        <p className="text-base font-semibold">{awal.saran_otomatis ?? "—"}</p>
        <p className="text-xs text-gray-500">Versi aturan: {awal.versi_aturan_triase}</p>
      </aside>
    </div>
  );
}
