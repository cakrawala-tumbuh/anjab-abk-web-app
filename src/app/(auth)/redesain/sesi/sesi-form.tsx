"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { DaftarPilihTerpaginasi } from "@/components/daftar-pilih-terpaginasi";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { PilihKodeOrang } from "@/components/pilih-kode-orang";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { KonteksRead, MasalahRead, SekolahRead, SesiCreate, SesiRead } from "@/lib/api/schema";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { bacaEtag, headerIdempotencyKey, headerIfMatch, petakanKonkurensi } from "@/lib/konkurensi";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";
import { PemuatRekaman } from "@/lib/use-rekaman-ber-etag";
import { PESAN_KODE_ORANG_WAJIB } from "@/lib/redesain-kode-orang";
import {
  JENIS_KEGIATAN,
  PESAN_SESI_GANDA,
  STATUS_IZIN,
  TEKS_BUKAN_TIME_STUDY,
  TEKS_STATUS_IZIN_INFORMASI,
  labelMasalahTema,
} from "@/lib/redesain-sesi";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

type Jenis = SesiCreate["jenis_kegiatan"];
type Izin = SesiCreate["status_izin"];

/** Properti {@link SesiForm}. */
export interface SesiFormProps {
  /** Sesi yang diubah; kosong = mode tambah. */
  awal?: SesiRead;
  sekolah: SekolahRead[];
  masalah: MasalahRead[];
  konteks: KonteksRead[];
  accessToken: string | undefined;
}

/**
 * Ubah teks menit menjadi angka: kosong → `null`; negatif/bukan bilangan bulat → `undefined`
 * (tidak valid).
 */
function parseMenit(teks: string): number | null | undefined {
  const t = teks.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

/** Properti isi form: ditambah ETag dari GET detail yang sama dengan `awal`. */
interface SesiFormIsiProps extends SesiFormProps {
  etag?: string | null;
}

/**
 * Form tambah/ubah sesi partisipasi. Mode ubah memuat sesinya sendiri lewat GET `/sesi/{id}`
 * dan mengirim `If-Match` dari ETag GET yang sama.
 *
 * Menit kosong dikirim `null`; menit negatif ditolak di klien. `status_izin` informatif:
 * nilai apa pun (termasuk "Tidak diotorisasi") tetap disimpan tanpa peringatan pemblokir.
 * `masalah_ids` dikirim ganti-penuh. 409 (pasangan `kode_sesi`+`kode_orang` ganda)
 * menampilkan {@link PESAN_SESI_GANDA}. Setelah sukses kembali ke `/redesain/sesi`.
 *
 * POST (mode tambah) membawa `Idempotency-Key` per upaya; key diganti hanya setelah respons
 * sukses sehingga kirim ulang setelah gagal memakai key yang sama. 409 `conflict` dipetakan ke
 * pesan "masih diproses"; 409 guard lain tetap pesan aslinya.
 *
 * @param props - Lihat {@link SesiFormProps}.
 */
export function SesiForm(props: SesiFormProps) {
  const { awal, accessToken } = props;
  if (!awal) return <SesiFormIsi {...props} />;
  return (
    <PemuatRekaman
      accessToken={accessToken}
      kunci={awal.id}
      ambil={(c) =>
        c.GET("/api/v1/redesain/sesi/{sesi_id}", { params: { path: { sesi_id: awal.id } } })
      }
    >
      {(data, etag) => <SesiFormIsi {...props} awal={data} etag={etag} />}
    </PemuatRekaman>
  );
}

function SesiFormIsi({
  awal,
  sekolah,
  masalah,
  konteks,
  accessToken,
  etag: etagAwal = null,
}: SesiFormIsiProps) {
  const router = useRouter();
  const [etag, setEtag] = useState<string | null>(etagAwal);
  const [kodeSesi, setKodeSesi] = useState(awal?.kode_sesi ?? "");
  const [kodeOrang, setKodeOrang] = useState(awal?.kode_orang ?? "");
  const [sekolahId, setSekolahId] = useState(awal?.sekolah_id ?? "");
  const [peran, setPeran] = useState(awal?.peran ?? "");
  const [jenis, setJenis] = useState<Jenis>(awal?.jenis_kegiatan ?? "Klarifikasi");
  const [rencana, setRencana] = useState(awal?.menit_rencana?.toString() ?? "");
  const [disepakati, setDisepakati] = useState(awal?.menit_disepakati?.toString() ?? "");
  const [waktu, setWaktu] = useState(awal?.waktu_kalender ?? "");
  const [catatan, setCatatan] = useState(awal?.catatan ?? "");
  const [izin, setIzin] = useState<Izin>(awal?.status_izin ?? "Belum ditetapkan");
  const [versiIzin, setVersiIzin] = useState(awal?.versi_izin ?? "");
  const [pic, setPic] = useState(awal?.pic_kode_orang ?? "");
  const [tindak, setTindak] = useState(awal?.tindak_lanjut ?? "");
  const [masalahIds, setMasalahIds] = useState<Set<string>>(new Set(awal?.masalah_ids ?? []));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idem = useIdempotencyKey();
  const [galatKode, setGalatKode] = useState(false);
  const idGalatKode = useId();

  const petaKonteks = new Map(konteks.map((k) => [k.id, k]));

  function toggleMasalah(id: string) {
    setMasalahIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (kodeOrang === "") {
      setGalatKode(true);
      return;
    }
    const mr = parseMenit(rencana);
    const md = parseMenit(disepakati);
    if (mr === undefined || md === undefined) {
      setError("Menit harus bilangan bulat 0 atau lebih (boleh dikosongkan).");
      return;
    }
    setLoading(true);
    const isi = {
      kode_sesi: kodeSesi.trim(),
      kode_orang: kodeOrang,
      sekolah_id: sekolahId || null,
      peran: peran.trim(),
      jenis_kegiatan: jenis,
      menit_rencana: mr,
      menit_disepakati: md,
      waktu_kalender: waktu.trim() || null,
      catatan: catatan.trim() || null,
      status_izin: izin,
      versi_izin: versiIzin.trim() || null,
      pic_kode_orang: pic || null,
      tindak_lanjut: tindak.trim() || null,
      masalah_ids: [...masalahIds],
    };
    try {
      const client = withServerAuth(accessToken);
      const res = awal
        ? await client.PATCH("/api/v1/redesain/sesi/{sesi_id}", {
            params: { path: { sesi_id: awal.id } },
            body: isi,
            headers: headerIfMatch(etag),
          })
        : await client.POST("/api/v1/redesain/sesi", {
            body: isi,
            headers: headerIdempotencyKey(idem.key),
          });
      if (res.response.status === 409 && (awal || apiErrorDari(res).code !== "conflict")) {
        setError(PESAN_SESI_GANDA);
        return;
      }
      if (!res.data) throw apiErrorDari(res);
      if (awal) setEtag(bacaEtag(res.response));
      else idem.perbarui();
      notifySukses(awal ? "Sesi diperbarui." : "Sesi dicatat.");
      router.push("/redesain/sesi");
      router.refresh();
    } catch (err) {
      const galat = petakanKonkurensi(err, !awal);
      setError(pesanGagal(galat));
      notifyGagal(galat);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={kirim} className="space-y-4">
      <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
        {TEKS_BUKAN_TIME_STUDY}
      </p>
      <PeringatanPrivasi />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">
            Kode sesi (dibagi peserta satu kegiatan)
          </span>
          <input
            value={kodeSesi}
            onChange={(e) => setKodeSesi(e.target.value)}
            required
            className={INPUT}
          />
        </label>
        <div className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Kode orang</span>
          <PilihKodeOrang
            name="kode_orang"
            value={kodeOrang}
            onChange={(k) => {
              if (k !== "") setGalatKode(false);
              setKodeOrang(k);
            }}
            wajib
            invalid={galatKode}
            describedBy={idGalatKode}
            accessToken={accessToken}
          />
          {galatKode && (
            <p id={idGalatKode} role="alert" className="form-error">
              {PESAN_KODE_ORANG_WAJIB}
            </p>
          )}
        </div>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Sekolah</span>
          <select
            value={sekolahId}
            onChange={(e) => setSekolahId(e.target.value)}
            className={INPUT}
          >
            <option value="">— tidak dipilih —</option>
            {sekolah.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Peran</span>
          <input
            value={peran}
            onChange={(e) => setPeran(e.target.value)}
            required
            className={INPUT}
          />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Jenis kegiatan</span>
          <select
            value={jenis}
            onChange={(e) => setJenis(e.target.value as Jenis)}
            className={INPUT}
          >
            {JENIS_KEGIATAN.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Menit rencana</span>
          <input
            type="number"
            min={0}
            step={1}
            value={rencana}
            onChange={(e) => setRencana(e.target.value)}
            className={INPUT}
          />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Menit disepakati</span>
          <input
            type="number"
            min={0}
            step={1}
            value={disepakati}
            onChange={(e) => setDisepakati(e.target.value)}
            className={INPUT}
          />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Waktu kalender</span>
          <input value={waktu} onChange={(e) => setWaktu(e.target.value)} className={INPUT} />
        </label>
        <div className="text-sm">
          <label>
            <span className="block text-gray-600 dark:text-gray-400">Status izin</span>
            <select
              value={izin}
              onChange={(e) => setIzin(e.target.value as Izin)}
              className={INPUT}
            >
              {STATUS_IZIN.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {TEKS_STATUS_IZIN_INFORMASI}
          </p>
        </div>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Versi izin</span>
          <input
            value={versiIzin}
            onChange={(e) => setVersiIzin(e.target.value)}
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
        <label className="text-sm sm:col-span-2">
          <span className="block text-gray-600 dark:text-gray-400">Catatan</span>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={2}
            className={INPUT}
          />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="block text-gray-600 dark:text-gray-400">Tindak lanjut</span>
          <textarea
            value={tindak}
            onChange={(e) => setTindak(e.target.value)}
            rows={2}
            className={INPUT}
          />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Masalah tertaut ({masalahIds.size} dipilih)</legend>
        <DaftarPilihTerpaginasi
          items={masalah.map((m) => ({ id: m.id, label: labelMasalahTema(m, petaKonteks) }))}
          terpilih={masalahIds}
          onToggle={toggleMasalah}
          onPilihSemua={(ids) => setMasalahIds((prev) => new Set([...prev, ...ids]))}
          onBatalkan={() => setMasalahIds(new Set())}
        />
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Menyimpan…" : awal ? "Simpan perubahan" : "Catat sesi"}
      </button>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </form>
  );
}
