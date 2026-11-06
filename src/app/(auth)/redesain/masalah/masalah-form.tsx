"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DaftarPilihTerpaginasi } from "@/components/daftar-pilih-terpaginasi";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { PilihKodeOrang } from "@/components/pilih-kode-orang";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type {
  KonteksRead,
  MasalahCreate,
  MasalahRead,
  MasalahUpdate,
  SekolahRead,
  UraianTugasRead,
} from "@/lib/api/schema";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { bacaEtag, headerIdempotencyKey, headerIfMatch, petakanKonkurensi } from "@/lib/konkurensi";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";
import { PemuatRekaman } from "@/lib/use-rekaman-ber-etag";
import { GELOMBANG, STATUS_AWAL } from "@/lib/redesain-register";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

type Gelombang = MasalahCreate["gelombang"];
type StatusAwal = MasalahCreate["status_awal"];

/** Properti {@link MasalahForm}. */
export interface MasalahFormProps {
  /** Masalah yang diubah; kosong = mode tambah. */
  awal?: MasalahRead;
  konteks: KonteksRead[];
  sekolah: SekolahRead[];
  uraianTugas: UraianTugasRead[];
  accessToken: string | undefined;
}

/** Properti isi form: ditambah ETag dari GET detail yang sama dengan `awal`. */
interface MasalahFormIsiProps extends MasalahFormProps {
  etag?: string | null;
}

/**
 * Form tambah/ubah masalah redesain. Mode ubah memuat rekamannya sendiri lewat GET detail (/masalah/{id}) dan mengirim `If-Match`
 * dari ETag GET yang sama.
 *
 * Opsi sekolah "Belum ditetapkan" mengirim `sekolah_id: null` disertai
 * `keterangan_sekolah`. `uraian_tugas_ids` dikirim ganti-penuh. Bila
 * `awal.status_awal_dibekukan_pada` terisi, kontrol `status_awal` nonaktif (dengan
 * keterangan pembekuan) dan field itu tidak dikirim pada PATCH; 409 backend tetap
 * ditampilkan sebagai toast gagal. Setelah sukses kembali ke `/redesain/masalah`.
 *
 * POST (mode tambah) membawa `Idempotency-Key` per upaya (`keyUntuk(body)`: isi kiriman berubah → key baru); key diganti hanya setelah respons
 * sukses sehingga kirim ulang setelah gagal memakai key yang sama. Pada rute ini kode `conflict`
 * berarti idempotensi (key masih diproses) sekaligus penolakan keadaan, dan klien tidak
 * membedakannya: pesan backend ditampilkan apa adanya lewat `pesanGagal`
 * (`petakanKonkurensi(err, false)` hanya memetakan 412 ke `PESAN_DATA_BERUBAH`).
 *
 * @param props - Lihat {@link MasalahFormProps}.
 */
export function MasalahForm(props: MasalahFormProps) {
  const { awal, accessToken } = props;
  if (!awal) return <MasalahFormIsi {...props} />;
  return (
    <PemuatRekaman
      accessToken={accessToken}
      kunci={awal.id}
      ambil={(c) =>
        c.GET("/api/v1/redesain/masalah/{masalah_id}", {
          params: { path: { masalah_id: awal.id } },
        })
      }
    >
      {(data, etag) => <MasalahFormIsi {...props} awal={data} etag={etag} />}
    </PemuatRekaman>
  );
}

function MasalahFormIsi({
  awal,
  konteks,
  sekolah,
  uraianTugas,
  accessToken,
  etag: etagAwal = null,
}: MasalahFormIsiProps) {
  const router = useRouter();
  const [etag, setEtag] = useState<string | null>(etagAwal);
  const [konteksId, setKonteksId] = useState(awal?.konteks_id ?? "");
  const [sekolahId, setSekolahId] = useState(awal?.sekolah_id ?? "");
  const [ketSekolah, setKetSekolah] = useState(awal?.keterangan_sekolah ?? "");
  const [periode, setPeriode] = useState(awal?.periode_acuan ?? "");
  const [periodePasti, setPeriodePasti] = useState(awal?.periode_pasti ?? false);
  const [rumusan, setRumusan] = useState(awal?.rumusan_hipotesis ?? "");
  const [sumber, setSumber] = useState(awal?.sumber_awal_keterbatasan ?? "");
  const [statusAwal, setStatusAwal] = useState<StatusAwal>(awal?.status_awal ?? "Hipotesis");
  const [gelombang, setGelombang] = useState<Gelombang>(awal?.gelombang ?? "Belum dijadwalkan");
  const [alternatif, setAlternatif] = useState(awal?.penjelasan_alternatif ?? "");
  const [pic, setPic] = useState(awal?.pic_kode_orang ?? "");
  const [uraianIds, setUraianIds] = useState<Set<string>>(new Set(awal?.uraian_tugas_ids ?? []));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idem = useIdempotencyKey();

  const beku = awal?.status_awal_dibekukan_pada ?? null;

  function toggleUraian(id: string) {
    setUraianIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const sekolahTerpilih = sekolahId || null;
    const isi = {
      konteks_id: konteksId,
      sekolah_id: sekolahTerpilih,
      keterangan_sekolah: sekolahTerpilih ? null : ketSekolah.trim() || null,
      periode_acuan: periode.trim(),
      periode_pasti: periodePasti,
      rumusan_hipotesis: rumusan.trim(),
      sumber_awal_keterbatasan: sumber.trim(),
      gelombang,
      penjelasan_alternatif: alternatif.trim() || null,
      pic_kode_orang: pic || null,
      uraian_tugas_ids: [...uraianIds],
    };
    try {
      const client = withServerAuth(accessToken);
      if (awal) {
        const body: MasalahUpdate = beku ? isi : { ...isi, status_awal: statusAwal };
        const res = await client.PATCH("/api/v1/redesain/masalah/{masalah_id}", {
          params: { path: { masalah_id: awal.id } },
          body,
          headers: headerIfMatch(etag),
        });
        if (!res.data) throw apiErrorDari(res);
        setEtag(bacaEtag(res.response));
        notifySukses(`Masalah ${res.data.kode} diperbarui.`);
      } else {
        const body = { ...isi, status_awal: statusAwal };
        const res = await client.POST("/api/v1/redesain/masalah", {
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        });
        if (!res.data) throw apiErrorDari(res);
        idem.perbarui();
        notifySukses(`Masalah ${res.data.kode} dibuat.`);
      }
      router.push("/redesain/masalah");
      router.refresh();
    } catch (err) {
      const galat = petakanKonkurensi(err, false);
      setError(pesanGagal(galat));
      notifyGagal(galat);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={kirim} className="space-y-4">
      <PeringatanPrivasi />
      {awal && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Kode masalah: <span className="font-mono">{awal.kode}</span>
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Konteks</span>
          <select
            value={konteksId}
            onChange={(e) => setKonteksId(e.target.value)}
            required
            className={INPUT}
          >
            <option value="">— pilih konteks —</option>
            {konteks.map((k) => (
              <option key={k.id} value={k.id}>
                {k.kode} — {k.tema}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Sekolah</span>
          <select
            value={sekolahId}
            onChange={(e) => setSekolahId(e.target.value)}
            className={INPUT}
          >
            <option value="">Belum ditetapkan</option>
            {sekolah.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
        </label>
        {!sekolahId && (
          <label className="text-sm sm:col-span-2">
            <span className="block text-gray-600 dark:text-gray-400">
              Keterangan sekolah (sekolah/jenjang/cabang)
            </span>
            <input
              value={ketSekolah}
              onChange={(e) => setKetSekolah(e.target.value)}
              className={INPUT}
            />
          </label>
        )}
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Periode acuan</span>
          <input
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            required
            className={INPUT}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={periodePasti}
            onChange={(e) => setPeriodePasti(e.target.checked)}
          />
          Periode sudah pasti
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="block text-gray-600 dark:text-gray-400">Rumusan hipotesis</span>
          <textarea
            value={rumusan}
            onChange={(e) => setRumusan(e.target.value)}
            required
            rows={3}
            className={INPUT}
          />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="block text-gray-600 dark:text-gray-400">
            Sumber awal dan keterbatasan
          </span>
          <textarea
            value={sumber}
            onChange={(e) => setSumber(e.target.value)}
            required
            rows={3}
            className={INPUT}
          />
        </label>
        <div className="text-sm">
          <label>
            <span className="block text-gray-600 dark:text-gray-400">Status awal</span>
            <select
              value={statusAwal}
              onChange={(e) => setStatusAwal(e.target.value as StatusAwal)}
              disabled={beku !== null}
              className={INPUT}
            >
              {STATUS_AWAL.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          {beku && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              Dibekukan sejak {beku} (konfirmasi pertama terkirim)
            </p>
          )}
        </div>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Gelombang</span>
          <select
            value={gelombang}
            onChange={(e) => setGelombang(e.target.value as Gelombang)}
            className={INPUT}
          >
            {GELOMBANG.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="block text-gray-600 dark:text-gray-400">Penjelasan alternatif</span>
          <textarea
            value={alternatif}
            onChange={(e) => setAlternatif(e.target.value)}
            rows={2}
            className={INPUT}
          />
        </label>
        <div className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">
            Penanggung jawab (kode orang)
          </span>
          <PilihKodeOrang
            name="pic_kode_orang"
            value={pic}
            onChange={setPic}
            accessToken={accessToken}
          />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          Uraian tugas tertaut ({uraianIds.size} dipilih)
        </legend>
        <DaftarPilihTerpaginasi
          items={uraianTugas.map((u) => ({ id: u.id, label: u.uraian }))}
          terpilih={uraianIds}
          onToggle={toggleUraian}
          onPilihSemua={(ids) => setUraianIds((prev) => new Set([...prev, ...ids]))}
          onBatalkan={() => setUraianIds(new Set())}
        />
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Menyimpan…" : awal ? "Simpan perubahan" : "Tambah masalah"}
      </button>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </form>
  );
}
