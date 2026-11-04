"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { PilihKodeOrang } from "@/components/pilih-kode-orang";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { BuktiCreate, BuktiRead } from "@/lib/api/schema";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { bacaEtag, headerIdempotencyKey, headerIfMatch, petakanKonkurensi } from "@/lib/konkurensi";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";
import { PemuatRekaman } from "@/lib/use-rekaman-ber-etag";
import { INDEPENDEN_BUKTI, JENIS_BUKTI, STATUS_PEMERIKSAAN } from "@/lib/redesain-alur";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Pilihan langkah pada form bukti (hanya langkah dari proses masalah yang dibuka). */
export interface PilihanLangkahBukti {
  id: string;
  /** Label tampilan `kode — tahap`. */
  label: string;
}

/** Properti {@link FormBukti}. */
export interface FormBuktiProps {
  /** ID masalah pemilik bukti (mode tambah). */
  masalahId: string;
  /** Langkah yang boleh ditautkan: hanya dari proses masalah ini. */
  langkah: PilihanLangkahBukti[];
  /** Bukti yang diubah; kosong = mode tambah. */
  awal?: BuktiRead;
  accessToken: string | undefined;
}

/** Properti isi form: ditambah ETag dari GET detail yang sama dengan `awal`. */
interface FormBuktiIsiProps extends FormBuktiProps {
  etag?: string | null;
}

/**
 * Form tambah/ubah bukti per klaim (rujukan teks, tanpa unggah berkas).
 *
 * Tambah: `POST /api/v1/redesain/bukti`; ubah: `PATCH /api/v1/redesain/bukti/{id}`.
 * `kode` dibangkitkan sistem (read-only). Pembuat/pemeriksa dipilih sebagai kode orang
 * lewat `PilihKodeOrang`. Kegagalan (mis. 422) → toast gagal + pesan inline dan form
 * tidak ditutup. Sukses → `router.refresh()`.
 *
 * POST (mode tambah) membawa `Idempotency-Key` per upaya (`keyUntuk(body)`: isi kiriman berubah → key baru); key diganti hanya setelah respons
 * sukses sehingga kirim ulang setelah gagal memakai key yang sama. 409 `conflict` dipetakan ke
 * pesan "masih diproses"; 409 guard lain tetap pesan aslinya.
 *
 * @param props - Lihat {@link FormBuktiProps}.
 */
export function FormBukti(props: FormBuktiProps) {
  const { awal, accessToken } = props;
  if (!awal) return <FormBuktiIsi {...props} />;
  return (
    <PemuatRekaman
      accessToken={accessToken}
      kunci={awal.id}
      ambil={(c) =>
        c.GET("/api/v1/redesain/bukti/{bukti_id}", { params: { path: { bukti_id: awal.id } } })
      }
    >
      {(data, etag) => <FormBuktiIsi {...props} awal={data} etag={etag} />}
    </PemuatRekaman>
  );
}

function FormBuktiIsi({
  masalahId,
  langkah,
  awal,
  accessToken,
  etag: etagAwal = null,
}: FormBuktiIsiProps) {
  const router = useRouter();
  const [etag, setEtag] = useState<string | null>(etagAwal);
  const [langkahId, setLangkahId] = useState(awal?.langkah_id ?? "");
  const [unit, setUnit] = useState(awal?.unit_periode ?? "");
  const [jenis, setJenis] = useState<BuktiCreate["jenis"]>(awal?.jenis ?? "SK/aturan");
  const [pembuat, setPembuat] = useState(awal?.pembuat_kode_orang ?? "");
  const [peran, setPeran] = useState(awal?.pembuat_peran ?? "");
  const [independen, setIndependen] = useState<BuktiCreate["independen"]>(
    awal?.independen ?? "Belum tahu",
  );
  const [didukung, setDidukung] = useState(awal?.klaim_didukung ?? "");
  const [tidakDidukung, setTidakDidukung] = useState(awal?.klaim_tidak_didukung ?? "");
  const [rujukan, setRujukan] = useState(awal?.tanggal_versi_lokasi ?? "");
  const [status, setStatus] = useState<BuktiCreate["status_pemeriksaan"]>(
    awal?.status_pemeriksaan ?? "Belum diperiksa",
  );
  const [pemeriksa, setPemeriksa] = useState(awal?.pemeriksa_kode_orang ?? "");
  const [alasan, setAlasan] = useState(awal?.alasan ?? "");
  const [catatan, setCatatan] = useState(awal?.catatan_privasi_gap ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idem = useIdempotencyKey();

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const isi = {
      langkah_id: langkahId || null,
      unit_periode: unit.trim(),
      jenis,
      pembuat_kode_orang: pembuat || null,
      pembuat_peran: peran.trim() || null,
      independen,
      klaim_didukung: didukung.trim(),
      klaim_tidak_didukung: tidakDidukung.trim() || null,
      tanggal_versi_lokasi: rujukan.trim(),
      status_pemeriksaan: status,
      pemeriksa_kode_orang: pemeriksa || null,
      alasan: alasan.trim() || null,
      catatan_privasi_gap: catatan.trim() || null,
    };
    try {
      const client = withServerAuth(accessToken);
      if (awal) {
        const res = await client.PATCH("/api/v1/redesain/bukti/{bukti_id}", {
          params: { path: { bukti_id: awal.id } },
          body: isi,
          headers: headerIfMatch(etag),
        });
        if (!res.data) throw apiErrorDari(res);
        setEtag(bacaEtag(res.response));
        notifySukses(`Bukti ${res.data.kode} diperbarui.`);
      } else {
        const body = { masalah_id: masalahId, ...isi };
        const res = await client.POST("/api/v1/redesain/bukti", {
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        });
        if (!res.data) throw apiErrorDari(res);
        idem.perbarui();
        notifySukses(`Bukti ${res.data.kode} ditambahkan.`);
      }
      router.refresh();
    } catch (err) {
      const galat = petakanKonkurensi(err, !awal);
      setError(pesanGagal(galat));
      notifyGagal(galat);
    } finally {
      setLoading(false);
    }
  }

  const teks = (label: string, value: string, set: (v: string) => void, wajib: boolean) => (
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
    opsi: readonly T[],
  ) => (
    <label className="text-sm">
      <span className="block text-gray-600 dark:text-gray-400">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => set(e.target.value as T)}
        className={INPUT}
      >
        {opsi.map((o) => (
          <option key={o} value={o}>
            {o}
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
            <span className="block text-gray-600 dark:text-gray-400">Kode bukti</span>
            <span className="font-mono">{awal.kode}</span>
          </p>
        )}
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Langkah alur (opsional)</span>
          <select
            aria-label="Langkah alur"
            value={langkahId}
            onChange={(e) => setLangkahId(e.target.value)}
            className={INPUT}
          >
            <option value="">— tidak ditautkan —</option>
            {langkah.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        {teks("Unit / periode", unit, setUnit, true)}
        {pilih("Jenis", jenis, setJenis, JENIS_BUKTI)}
        <div className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Pembuat (kode orang)</span>
          <PilihKodeOrang
            name="pembuat_kode_orang"
            value={pembuat}
            onChange={setPembuat}
            accessToken={accessToken}
          />
        </div>
        {teks("Peran pembuat", peran, setPeran, false)}
        {pilih("Independen", independen, setIndependen, INDEPENDEN_BUKTI)}
        {teks("Klaim didukung", didukung, setDidukung, true)}
        {teks("Klaim tidak didukung", tidakDidukung, setTidakDidukung, false)}
        {teks(
          "Tanggal / versi / lokasi (Jangan mencantumkan identitas murid)",
          rujukan,
          setRujukan,
          true,
        )}
        {pilih("Status pemeriksaan", status, setStatus, STATUS_PEMERIKSAAN)}
        <div className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Pemeriksa (kode orang)</span>
          <PilihKodeOrang
            name="pemeriksa_kode_orang"
            value={pemeriksa}
            onChange={setPemeriksa}
            accessToken={accessToken}
          />
        </div>
        {teks("Alasan", alasan, setAlasan, false)}
        {teks("Catatan privasi / celah", catatan, setCatatan, false)}
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
        {loading ? "Menyimpan…" : awal ? "Simpan bukti" : "Tambah bukti"}
      </button>
    </form>
  );
}
