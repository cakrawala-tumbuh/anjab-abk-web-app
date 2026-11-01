"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { PilihKodeOrang } from "@/components/pilih-kode-orang";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { CakupanJabatanRead, JabatanRead } from "@/lib/api/schema";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { STATUS_UNIT, TINGKAT_PEMERIKSAAN } from "@/lib/redesain-cakupan";

/** Teks penanda record yang `jabatan_id`-nya masih kosong (risiko R-6). */
export const PENANDA_BELUM_DIPETAKAN = "Belum dipetakan ke master jabatan";

const kelasInput =
  "rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

function Pilihan({
  label,
  nilai,
  opsi,
  onChange,
}: {
  label: string;
  nilai: string;
  opsi: ReadonlyArray<string>;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs">
      <span className="block text-gray-600 dark:text-gray-400">{label}</span>
      <select value={nilai} onChange={(e) => onChange(e.target.value)} className={kelasInput}>
        {opsi.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Satu sel cabang pada tabel cakupan: ringkasan record + form ubah (`PATCH
 * /api/v1/redesain/cakupan-jabatan/{id}`).
 *
 * Record ber-`jabatan_id` null diberi penanda {@link PENANDA_BELUM_DIPETAKAN}. Respons
 * 422 (jabatan tak ada) ditampilkan sebagai toast gagal dan galat inline.
 *
 * @param props.rec - Record cakupan untuk role × cabang ini.
 * @param props.jabatan - Master jabatan (pilihan dan label).
 * @param props.accessToken - Token akses dari Server Component induk.
 */
export function SelCabang({
  rec,
  jabatan,
  accessToken,
}: {
  rec: CakupanJabatanRead;
  jabatan: JabatanRead[];
  accessToken: string | undefined;
}) {
  const router = useRouter();
  const [jabatanId, setJabatanId] = useState(rec.jabatan_id ?? "");
  const [statusUnit, setStatusUnit] = useState<string>(rec.status_unit);
  const [pemegang, setPemegang] = useState<string>(rec.pemegang_diperiksa);
  const [inventori, setInventori] = useState<string>(rec.inventori_ditinjau);
  const [peta, setPeta] = useState<string>(rec.peta_diperkuat);
  const [gap, setGap] = useState(rec.gap_variasi ?? "");
  const [pic, setPic] = useState(rec.pic_kode_orang ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const namaJabatan = rec.jabatan_id
    ? (jabatan.find((j) => j.id === rec.jabatan_id)?.nama ?? rec.jabatan_id)
    : null;

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await withServerAuth(accessToken).PATCH(
        "/api/v1/redesain/cakupan-jabatan/{cakupan_id}",
        {
          params: { path: { cakupan_id: rec.id } },
          body: {
            jabatan_id: jabatanId || null,
            status_unit: statusUnit as CakupanJabatanRead["status_unit"],
            pemegang_diperiksa: pemegang as CakupanJabatanRead["pemegang_diperiksa"],
            inventori_ditinjau: inventori as CakupanJabatanRead["inventori_ditinjau"],
            peta_diperkuat: peta as CakupanJabatanRead["peta_diperkuat"],
            gap_variasi: gap.trim() || null,
            pic_kode_orang: pic || null,
          },
        },
      );
      if (!res.data) throw apiErrorDari(res);
      notifySukses("Cakupan disimpan.");
      router.refresh();
    } catch (err) {
      setError(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1 text-xs">
      <p>
        <span className="font-medium">{rec.status_unit}</span>
        {namaJabatan && <span className="text-gray-600 dark:text-gray-400"> · {namaJabatan}</span>}
      </p>
      {!rec.jabatan_id && (
        <p className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          {PENANDA_BELUM_DIPETAKAN}
        </p>
      )}
      <details>
        <summary className="cursor-pointer text-blue-600 dark:text-blue-400">
          Ubah {rec.cabang}
        </summary>
        <form
          onSubmit={simpan}
          className="mt-2 space-y-2"
          aria-label={`Ubah ${rec.role_kode} ${rec.cabang}`}
        >
          <label className="block text-xs">
            <span className="block text-gray-600 dark:text-gray-400">Jabatan master</span>
            <select
              value={jabatanId}
              onChange={(e) => setJabatanId(e.target.value)}
              className={kelasInput}
            >
              <option value="">— belum dipetakan —</option>
              {jabatan.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.nama}
                </option>
              ))}
            </select>
          </label>
          <Pilihan
            label="Status unit"
            nilai={statusUnit}
            opsi={STATUS_UNIT}
            onChange={setStatusUnit}
          />
          <Pilihan
            label="Pemegang diperiksa"
            nilai={pemegang}
            opsi={TINGKAT_PEMERIKSAAN}
            onChange={setPemegang}
          />
          <Pilihan
            label="Inventori ditinjau"
            nilai={inventori}
            opsi={TINGKAT_PEMERIKSAAN}
            onChange={setInventori}
          />
          <Pilihan
            label="Peta diperkuat"
            nilai={peta}
            opsi={TINGKAT_PEMERIKSAAN}
            onChange={setPeta}
          />
          <div>
            <PeringatanPrivasi />
            <label className="mt-1 block text-xs">
              <span className="block text-gray-600 dark:text-gray-400">Gap / variasi</span>
              <textarea
                value={gap}
                onChange={(e) => setGap(e.target.value)}
                rows={2}
                className={`${kelasInput} w-full`}
              />
            </label>
          </div>
          <div className="text-xs">
            <span className="block text-gray-600 dark:text-gray-400">PIC (kode orang)</span>
            <PilihKodeOrang
              name="pic_kode_orang"
              value={pic}
              onChange={setPic}
              accessToken={accessToken}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Menyimpan…" : "Simpan"}
          </button>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
        </form>
      </details>
    </div>
  );
}
