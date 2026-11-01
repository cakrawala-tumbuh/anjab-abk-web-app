"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { PilihKodeOrang } from "@/components/pilih-kode-orang";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { AlternatifCreate, AlternatifRead } from "@/lib/api/schema";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import {
  GAP_PENERIMA,
  OPSI_ALTERNATIF,
  STATUS_TELAAH,
  validasiAlternatif,
} from "@/lib/redesain-alternatif";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Pilihan jabatan pada form alternatif (label = nama jabatan). */
export interface PilihanJabatanAlternatif {
  id: string;
  label: string;
}

/** Properti {@link FormAlternatif}. */
export interface FormAlternatifProps {
  /** ID masalah pemilik alternatif (mode tambah). */
  masalahId: string;
  /** Master jabatan untuk pihak asal/penerima. */
  jabatan: PilihanJabatanAlternatif[];
  /** Alternatif yang diubah; kosong = mode tambah. */
  awal?: AlternatifRead;
  accessToken: string | undefined;
}

/**
 * Form tambah/ubah alternatif redesain.
 *
 * Tambah: `POST /api/v1/redesain/alternatif`; ubah: `PATCH .../{id}`. Validasi klien
 * (selaras 422 backend) menolak simpan tanpa memanggil API: status `Uji disetujui terpisah`
 * tanpa keputusan/pemutus, atau opsi `Alihkan tugas bersyarat` tanpa penerima. `status_telaah`
 * hanya berubah dari pilihan pengguna. Kegagalan → toast gagal + pesan inline.
 *
 * @param props - Lihat {@link FormAlternatifProps}.
 */
export function FormAlternatif({ masalahId, jabatan, awal, accessToken }: FormAlternatifProps) {
  const router = useRouter();
  const [opsi, setOpsi] = useState<AlternatifCreate["opsi"]>(awal?.opsi ?? "Pertahankan");
  const [alur, setAlur] = useState(awal?.alur_kini_vs_usulan ?? "");
  const [asal, setAsal] = useState(awal?.pihak_asal_jabatan_id ?? "");
  const [penerima, setPenerima] = useState(awal?.pihak_penerima_jabatan_id ?? "");
  const [komitmen, setKomitmen] = useState(awal?.komitmen_penerima ?? "");
  const [jadwal, setJadwal] = useState(awal?.jadwal_puncak ?? "");
  const [keterampilan, setKeterampilan] = useState(awal?.keterampilan_akses ?? "");
  const [tambahan, setTambahan] = useState(awal?.tambahan_bersih ?? "");
  const [risiko, setRisiko] = useState(awal?.risiko_layanan ?? "");
  const [gap, setGap] = useState<AlternatifCreate["gap_penerima"]>(
    awal?.gap_penerima ?? "Belum tahu",
  );
  const [status, setStatus] = useState<AlternatifCreate["status_telaah"]>(
    awal?.status_telaah ?? "Belum ditelaah",
  );
  const [pemutus, setPemutus] = useState(awal?.pemutus_kode_orang ?? "");
  const [keputusan, setKeputusan] = useState(awal?.keputusan ?? "");
  const [prasyarat, setPrasyarat] = useState(awal?.prasyarat_monitoring ?? "");
  const [catatan, setCatatan] = useState(awal?.catatan_versi_bukti ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    const galat = validasiAlternatif({
      opsi,
      status_telaah: status,
      keputusan,
      pemutus_kode_orang: pemutus,
      pihak_penerima_jabatan_id: penerima,
    });
    if (galat.length > 0) {
      setError(galat.join(" "));
      return;
    }
    setLoading(true);
    setError(null);
    const isi = {
      opsi,
      alur_kini_vs_usulan: alur.trim(),
      pihak_asal_jabatan_id: asal || null,
      pihak_penerima_jabatan_id: penerima || null,
      komitmen_penerima: komitmen.trim() || null,
      jadwal_puncak: jadwal.trim() || null,
      keterampilan_akses: keterampilan.trim() || null,
      tambahan_bersih: tambahan.trim() || null,
      risiko_layanan: risiko.trim() || null,
      gap_penerima: gap,
      status_telaah: status,
      pemutus_kode_orang: pemutus || null,
      keputusan: keputusan.trim() || null,
      prasyarat_monitoring: prasyarat.trim() || null,
      catatan_versi_bukti: catatan.trim() || null,
    };
    try {
      const client = withServerAuth(accessToken);
      if (awal) {
        const res = await client.PATCH("/api/v1/redesain/alternatif/{alternatif_id}", {
          params: { path: { alternatif_id: awal.id } },
          body: isi,
        });
        if (!res.data) throw apiErrorDari(res);
        notifySukses(`Alternatif ${res.data.kode} diperbarui.`);
      } else {
        const res = await client.POST("/api/v1/redesain/alternatif", {
          body: { masalah_id: masalahId, ...isi },
        });
        if (!res.data) throw apiErrorDari(res);
        notifySukses(`Alternatif ${res.data.kode} ditambahkan.`);
      }
      router.refresh();
    } catch (err) {
      setError(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  const teks = (label: string, value: string, set: (v: string) => void, wajib = false) => (
    <label className="text-sm">
      <span className="block text-gray-600 dark:text-gray-400">{label}</span>
      <input
        aria-label={label}
        value={value}
        required={wajib}
        onChange={(e) => set(e.target.value)}
        className={INPUT}
      />
    </label>
  );

  const pilih = <T extends string>(
    label: string,
    value: T,
    set: (v: T) => void,
    opsiList: readonly T[],
  ) => (
    <label className="text-sm">
      <span className="block text-gray-600 dark:text-gray-400">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => set(e.target.value as T)}
        className={INPUT}
      >
        {opsiList.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );

  const pilihJabatan = (label: string, value: string, set: (v: string) => void) => (
    <label className="text-sm">
      <span className="block text-gray-600 dark:text-gray-400">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => set(e.target.value)}
        className={INPUT}
      >
        <option value="">— belum ditentukan —</option>
        {jabatan.map((j) => (
          <option key={j.id} value={j.id}>
            {j.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <form onSubmit={kirim} className="space-y-3">
      <PeringatanPrivasi />
      <div className="grid gap-3 sm:grid-cols-2">
        {awal && (
          <p className="text-sm">
            <span className="block text-gray-600 dark:text-gray-400">Kode alternatif</span>
            <span className="font-mono">{awal.kode}</span>
          </p>
        )}
        {pilih("Opsi", opsi, setOpsi, OPSI_ALTERNATIF)}
        {teks("Alur kini vs usulan", alur, setAlur, true)}
        {pilihJabatan("Pihak asal (jabatan)", asal, setAsal)}
        {pilihJabatan("Pihak penerima (jabatan)", penerima, setPenerima)}
        {teks("Komitmen penerima", komitmen, setKomitmen)}
        {teks("Jadwal puncak", jadwal, setJadwal)}
        {teks("Keterampilan / akses", keterampilan, setKeterampilan)}
        {teks("Tambahan bersih", tambahan, setTambahan)}
        {teks("Risiko layanan", risiko, setRisiko)}
        {pilih("Gap penerima", gap, setGap, GAP_PENERIMA)}
        {pilih("Status telaah", status, setStatus, STATUS_TELAAH)}
        <div className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Pemutus (kode orang)</span>
          <PilihKodeOrang
            name="pemutus_kode_orang"
            value={pemutus}
            onChange={setPemutus}
            accessToken={accessToken}
          />
        </div>
        {teks("Keputusan", keputusan, setKeputusan)}
        {teks("Prasyarat monitoring", prasyarat, setPrasyarat)}
        {teks("Catatan versi bukti", catatan, setCatatan)}
      </div>
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
        {loading ? "Menyimpan…" : awal ? "Simpan alternatif" : "Tambah alternatif"}
      </button>
    </form>
  );
}
