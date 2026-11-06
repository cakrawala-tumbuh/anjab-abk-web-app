"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { LangkahCreate, LangkahRead } from "@/lib/api/schema";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { bacaEtag, headerIdempotencyKey, headerIfMatch, petakanKonkurensi } from "@/lib/konkurensi";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";
import { PemuatRekaman } from "@/lib/use-rekaman-ber-etag";
import { STATUS_LANGKAH } from "@/lib/redesain-alur";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link FormLangkah}. */
export interface FormLangkahProps {
  /** ID proses pemilik langkah (untuk mode tambah). */
  prosesId: string;
  /** Langkah yang diubah; kosong = mode tambah. */
  awal?: LangkahRead;
  accessToken: string | undefined;
}

/** Properti isi form: ditambah ETag dari GET detail yang sama dengan `awal`. */
interface FormLangkahIsiProps extends FormLangkahProps {
  etag?: string | null;
}

/**
 * Form tambah/ubah langkah sebuah proses. Mode ubah memuat langkahnya sendiri lewat
 * `GET /langkah/{id}` dan mengirim `If-Match` dari ETag GET yang sama.
 *
 * Tambah: `POST /proses/{id}/langkah`; ubah: `PATCH /langkah/{id}`. `pelaksana` dan
 * `pemeriksa_pemutus` diisi jabatan/peran (bukan nama orang) — diingatkan oleh
 * `PeringatanPrivasi`. `kode` read-only (tidak ditampilkan sebagai input). Sukses →
 * `router.refresh()`.
 *
 * POST (mode tambah) membawa `Idempotency-Key` per upaya (`keyUntuk(body)`: isi kiriman berubah → key baru); key diganti hanya setelah respons
 * sukses sehingga kirim ulang setelah gagal memakai key yang sama. Pada rute ini kode `conflict`
 * berarti idempotensi (key masih diproses) sekaligus penolakan keadaan, dan klien tidak
 * membedakannya: pesan backend ditampilkan apa adanya lewat `pesanGagal`
 * (`petakanKonkurensi(err, false)` hanya memetakan 412 ke `PESAN_DATA_BERUBAH`).
 *
 * @param props - Lihat {@link FormLangkahProps}.
 */
export function FormLangkah(props: FormLangkahProps) {
  const { awal, accessToken } = props;
  if (!awal) return <FormLangkahIsi {...props} />;
  return (
    <PemuatRekaman
      accessToken={accessToken}
      kunci={awal.id}
      ambil={(c) =>
        c.GET("/api/v1/redesain/langkah/{langkah_id}", {
          params: { path: { langkah_id: awal.id } },
        })
      }
    >
      {(data, etag) => <FormLangkahIsi {...props} awal={data} etag={etag} />}
    </PemuatRekaman>
  );
}

function FormLangkahIsi({
  prosesId,
  awal,
  accessToken,
  etag: etagAwal = null,
}: FormLangkahIsiProps) {
  const router = useRouter();
  const [etag, setEtag] = useState<string | null>(etagAwal);
  const [urutan, setUrutan] = useState(awal ? String(awal.urutan) : "");
  const [tahap, setTahap] = useState(awal?.tahap ?? "");
  const [pemicu, setPemicu] = useState(awal?.pemicu_input ?? "");
  const [pelaksana, setPelaksana] = useState(awal?.pelaksana ?? "");
  const [sistem, setSistem] = useState(awal?.pekerjaan_sistem ?? "");
  const [keluaran, setKeluaran] = useState(awal?.keluaran_penerima ?? "");
  const [pemeriksa, setPemeriksa] = useState(awal?.pemeriksa_pemutus ?? "");
  const [hambatan, setHambatan] = useState(awal?.hambatan ?? "");
  const [status, setStatus] = useState<LangkahCreate["status_langkah"]>(
    awal?.status_langkah ?? "Hipotesis",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idem = useIdempotencyKey();

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const isi = {
      urutan: urutan.trim() === "" ? null : Number(urutan),
      tahap: tahap.trim(),
      pemicu_input: pemicu.trim(),
      pelaksana: pelaksana.trim(),
      pekerjaan_sistem: sistem.trim(),
      keluaran_penerima: keluaran.trim(),
      pemeriksa_pemutus: pemeriksa.trim() || null,
      hambatan: hambatan.trim() || null,
      status_langkah: status,
    };
    try {
      const client = withServerAuth(accessToken);
      if (awal) {
        const res = await client.PATCH("/api/v1/redesain/langkah/{langkah_id}", {
          params: { path: { langkah_id: awal.id } },
          body: isi,
          headers: headerIfMatch(etag),
        });
        if (!res.data) throw apiErrorDari(res);
        setEtag(bacaEtag(res.response));
        notifySukses(`Langkah ${res.data.kode} diperbarui.`);
      } else {
        const res = await client.POST("/api/v1/redesain/proses/{proses_id}/langkah", {
          params: { path: { proses_id: prosesId } },
          body: isi,
          headers: headerIdempotencyKey(idem.keyUntuk(isi)),
        });
        if (!res.data) throw apiErrorDari(res);
        idem.perbarui();
        notifySukses(`Langkah ${res.data.kode} ditambahkan.`);
      }
      router.refresh();
    } catch (err) {
      const galat = petakanKonkurensi(err, false);
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

  return (
    <form onSubmit={kirim} className="space-y-3">
      <PeringatanPrivasi />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Urutan</span>
          <input
            aria-label="Urutan"
            type="number"
            min={1}
            value={urutan}
            placeholder="otomatis"
            onChange={(e) => setUrutan(e.target.value)}
            className={INPUT}
          />
        </label>
        {teks("Tahap", tahap, setTahap, true)}
        {teks("Pemicu / masukan", pemicu, setPemicu, true)}
        {teks("Pelaksana (jabatan/peran)", pelaksana, setPelaksana, true)}
        {teks("Pekerjaan / sistem", sistem, setSistem, true)}
        {teks("Keluaran & penerima", keluaran, setKeluaran, true)}
        {teks("Pemeriksa / pemutus (jabatan/peran)", pemeriksa, setPemeriksa, false)}
        {teks("Hambatan", hambatan, setHambatan, false)}
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Status langkah</span>
          <select
            aria-label="Status langkah"
            value={status}
            onChange={(e) => setStatus(e.target.value as LangkahCreate["status_langkah"])}
            className={INPUT}
          >
            {STATUS_LANGKAH.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
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
        {loading ? "Menyimpan…" : awal ? "Simpan langkah" : "Tambah langkah"}
      </button>
    </form>
  );
}
