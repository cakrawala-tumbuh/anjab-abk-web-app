"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { KonteksRead } from "@/lib/api/schema";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { bacaEtag, headerIdempotencyKey, headerIfMatch, petakanKonkurensi } from "@/lib/konkurensi";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";
import { PemuatRekaman } from "@/lib/use-rekaman-ber-etag";
import { GELOMBANG, PESAN_KODE_KONTEKS_DUPLIKAT } from "@/lib/redesain-register";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link KonteksForm}. */
export interface KonteksFormProps {
  awal?: KonteksRead;
  accessToken: string | undefined;
}

/** Properti isi form: ditambah ETag dari GET detail yang sama dengan `awal`. */
interface KonteksFormIsiProps extends KonteksFormProps {
  etag?: string | null;
}

/**
 * Form tambah (tanpa `awal`) atau ubah (dengan `awal`) satu konteks redesain.
 *
 * Tambah → `POST /api/v1/redesain/konteks` (kode `K-NN` wajib, hanya saat tambah); respons
 * 409 berkode selain `conflict` menampilkan {@link PESAN_KODE_KONTEKS_DUPLIKAT} tanpa toast sukses. Ubah →
 * `PATCH /api/v1/redesain/konteks/{id}` (kode tidak dikirim/diubah). Galat lain tampil
 * inline dan lewat `notifyGagal`.
 *
 * POST (mode tambah) membawa `Idempotency-Key` per upaya (`keyUntuk(body)`: isi kiriman berubah → key baru); key diganti hanya setelah respons
 * sukses sehingga kirim ulang setelah gagal memakai key yang sama. Pada rute ini kode `conflict`
 * berarti idempotensi (key masih diproses) sekaligus penolakan keadaan, dan klien tidak
 * membedakannya: pesan backend ditampilkan apa adanya lewat `pesanGagal`
 * (`petakanKonkurensi(err, false)` hanya memetakan 412 ke `PESAN_DATA_BERUBAH`).
 *
 * @param props.awal - Konteks yang diubah; kosong = mode tambah.
 * @param props.accessToken - Token akses dari Server Component induk.
 */
export function KonteksForm(props: KonteksFormProps) {
  const { awal, accessToken } = props;
  if (!awal) return <KonteksFormIsi {...props} />;
  return (
    <PemuatRekaman
      accessToken={accessToken}
      kunci={awal.id}
      ambil={(c) =>
        c.GET("/api/v1/redesain/konteks/{konteks_id}", {
          params: { path: { konteks_id: awal.id } },
        })
      }
    >
      {(data, etag) => <KonteksFormIsi {...props} awal={data} etag={etag} />}
    </PemuatRekaman>
  );
}

function KonteksFormIsi({ awal, accessToken, etag: etagAwal = null }: KonteksFormIsiProps) {
  const router = useRouter();
  const [etag, setEtag] = useState<string | null>(etagAwal);
  const [kode, setKode] = useState("");
  const [tema, setTema] = useState(awal?.tema ?? "");
  const [gelombang, setGelombang] = useState<string>(awal?.gelombang ?? "Belum dijadwalkan");
  const [ruang, setRuang] = useState(awal?.ruang_dugaan ?? "");
  const [sumber, setSumber] = useState(awal?.sumber_draft ?? "");
  const [batas, setBatas] = useState(awal?.batas_pemeriksaan ?? "");
  const [aktif, setAktif] = useState(awal?.aktif ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idem = useIdempotencyKey();

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const isi = {
      tema: tema.trim(),
      gelombang: gelombang as (typeof GELOMBANG)[number],
      ruang_dugaan: ruang.trim(),
      sumber_draft: sumber.trim(),
      batas_pemeriksaan: batas.trim(),
      aktif,
    };
    try {
      const client = withServerAuth(accessToken);
      if (awal) {
        const res = await client.PATCH("/api/v1/redesain/konteks/{konteks_id}", {
          params: { path: { konteks_id: awal.id } },
          body: isi,
          headers: headerIfMatch(etag),
        });
        if (!res.data) throw apiErrorDari(res);
        setEtag(bacaEtag(res.response));
        notifySukses(`Konteks ${res.data.kode} diperbarui.`);
      } else {
        const body = { kode: kode.trim(), ...isi };
        const res = await client.POST("/api/v1/redesain/konteks", {
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        });
        if (res.response.status === 409 && apiErrorDari(res).code !== "conflict") {
          setError(PESAN_KODE_KONTEKS_DUPLIKAT);
          return;
        }
        if (!res.data) throw apiErrorDari(res);
        idem.perbarui();
        notifySukses(`Konteks ${res.data.kode} dibuat.`);
        setKode("");
        setTema("");
        setRuang("");
        setSumber("");
        setBatas("");
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

  return (
    <form onSubmit={kirim} className="space-y-3">
      <PeringatanPrivasi />
      <div className="grid gap-3 sm:grid-cols-2">
        {!awal && (
          <label className="text-sm">
            <span className="block text-gray-600 dark:text-gray-400">Kode (K-NN)</span>
            <input
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              required
              pattern="K-\d{2}"
              placeholder="K-15"
              className={INPUT}
            />
          </label>
        )}
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Tema</span>
          <input
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            required
            className={INPUT}
          />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Gelombang</span>
          <select
            value={gelombang}
            onChange={(e) => setGelombang(e.target.value)}
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
          <span className="block text-gray-600 dark:text-gray-400">Ruang dugaan</span>
          <textarea
            value={ruang}
            onChange={(e) => setRuang(e.target.value)}
            required
            rows={2}
            className={INPUT}
          />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="block text-gray-600 dark:text-gray-400">Sumber draf</span>
          <textarea
            value={sumber}
            onChange={(e) => setSumber(e.target.value)}
            required
            rows={2}
            className={INPUT}
          />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="block text-gray-600 dark:text-gray-400">Batas pemeriksaan</span>
          <textarea
            value={batas}
            onChange={(e) => setBatas(e.target.value)}
            required
            rows={2}
            className={INPUT}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} />
          Aktif
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Menyimpan…" : awal ? "Simpan perubahan" : "Tambah konteks"}
      </button>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </form>
  );
}
