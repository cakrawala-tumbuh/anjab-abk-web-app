"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { withServerAuth } from "@/lib/api/client";
import { ApiError, apiErrorDari } from "@/lib/api/errors";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import {
  BATAS_FIELD_KASUS,
  KODE_LINGKUP_GANDA,
  NARRATIVE_KIND_TETAP,
  SENSITIVITY_CLASS_TETAP,
  bodyKasus,
  galatField422Kasus,
  tautanPenelusuran,
  validasiKasus,
  type FieldKasus,
  type IsianKasus,
} from "@/lib/narasi-kasus";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

const KOSONG: IsianKasus = {
  instrument_id: "",
  field_key: "",
  peran_ref: "",
  periode: "",
  sekolah_id: "",
  assignment_ref: "",
  target_subject_ref: "",
  konteks_kode: "",
  intended_use: "",
  permission_scope: "",
};

const DAFTAR: Array<{ k: FieldKasus; label: string; wajib: boolean; placeholder?: string }> = [
  { k: "instrument_id", label: "Instrumen", wajib: true },
  { k: "field_key", label: "Kunci isian", wajib: true },
  { k: "peran_ref", label: "Peran", wajib: true },
  { k: "periode", label: "Periode", wajib: true, placeholder: "2026/27" },
  { k: "sekolah_id", label: "Sekolah (opsional)", wajib: false },
  { k: "assignment_ref", label: "Penugasan (opsional)", wajib: false },
  { k: "target_subject_ref", label: "Subjek sasaran (opsional)", wajib: false },
  { k: "konteks_kode", label: "Kode konteks (opsional)", wajib: false },
  { k: "intended_use", label: "Tujuan pemakaian", wajib: true },
  { k: "permission_scope", label: "Lingkup izin", wajib: true },
];

/** Properti {@link KasusForm}. */
export interface KasusFormProps {
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

/**
 * Formulir buat kasus narasi F1.
 *
 * `POST /api/v1/narasi/kasus` dengan `Idempotency-Key` per pengisian (`keyUntuk(body)`:
 * kirim ulang isi yang sama memakai key yang sama). `narrative_kind` dan `sensitivity_class`
 * tampil hanya-baca dan tidak bisa diubah. Field opsional kosong dikirim `null`. Sukses hanya
 * ditampilkan setelah 2xx; 409 `narasi_lingkup_ganda` tampil sebagai pesan dengan tautan
 * penelusuran; 422 dipetakan ke field.
 *
 * @param props - Lihat {@link KasusFormProps}.
 */
export function KasusForm({ accessToken }: KasusFormProps) {
  const router = useRouter();
  const idem = useIdempotencyKey();
  const [isian, setIsian] = useState<IsianKasus>(KOSONG);
  const [galat, setGalat] = useState<Partial<Record<FieldKasus, string>>>({});
  const [umum, setUmum] = useState<string | null>(null);
  const [lingkupGanda, setLingkupGanda] = useState(false);
  const [loading, setLoading] = useState(false);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setUmum(null);
    setLingkupGanda(false);
    const salah = validasiKasus(isian);
    setGalat(salah);
    if (Object.keys(salah).length > 0) return;
    setLoading(true);
    const body = bodyKasus(isian);
    try {
      const res = await withServerAuth(accessToken).POST("/api/v1/narasi/kasus", {
        body,
        headers: headerIdempotencyKey(idem.keyUntuk(body)),
      });
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      notifySukses("Kasus narasi dibuat.");
      router.push(`/narasi/kasus/${res.data.id}`);
      router.refresh();
    } catch (err) {
      const g = petakanKonkurensi(err, true);
      setGalat(galatField422Kasus(g));
      setLingkupGanda(g instanceof ApiError && g.code === KODE_LINGKUP_GANDA);
      setUmum(pesanGagal(g));
      notifyGagal(g);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={kirim} className="space-y-3" noValidate>
      <PeringatanPrivasi />
      <div className="grid gap-3 sm:grid-cols-2">
        {DAFTAR.map(({ k, label, wajib, placeholder }) => (
          <label key={k} className="text-sm">
            <span className="block text-gray-600 dark:text-gray-400">{label}</span>
            <input
              value={isian[k]}
              onChange={(e) => setIsian((s) => ({ ...s, [k]: e.target.value }))}
              maxLength={BATAS_FIELD_KASUS[k]}
              required={wajib}
              placeholder={placeholder}
              className={INPUT}
            />
            {galat[k] && (
              <span role="alert" className="mt-1 block text-xs text-red-600">
                {galat[k]}
              </span>
            )}
          </label>
        ))}
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Jenis narasi</span>
          <input
            value={NARRATIVE_KIND_TETAP}
            readOnly
            aria-readonly="true"
            className={`${INPUT} bg-gray-100 dark:bg-gray-700`}
          />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Kelas kepekaan</span>
          <input
            value={SENSITIVITY_CLASS_TETAP}
            readOnly
            aria-readonly="true"
            className={`${INPUT} bg-gray-100 dark:bg-gray-700`}
          />
        </label>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Pada tahap ini hanya jenis F1_FORMAL dan kelas NONPRIBADI yang dibuka; kasus selalu
        berstatus SOURCE_CHECKED.
      </p>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Menyimpan…" : "Buat kasus"}
      </button>
      {umum && (
        <p role="alert" className="form-error">
          {umum}
          {lingkupGanda && (
            <>
              {" "}
              <Link href={tautanPenelusuran(isian)} className="underline">
                Telusuri kasus berlingkup sama
              </Link>
            </>
          )}
        </p>
      )}
    </form>
  );
}
