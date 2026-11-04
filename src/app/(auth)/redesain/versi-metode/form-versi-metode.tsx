"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { VersiMetodeCreate, VersiMetodeRead } from "@/lib/api/schema";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { bacaEtag, headerIfMatch, petakanKonkurensi } from "@/lib/konkurensi";
import { PemuatRekaman } from "@/lib/use-rekaman-ber-etag";

/** Pesan konflik saat pasangan `versi` + `bagian` sudah tercatat (HTTP 409). */
export const PESAN_KONFLIK_VERSI = "Versi dan bagian ini sudah tercatat";

const KOSONG: VersiMetodeCreate = {
  versi: "",
  tanggal: "",
  bagian: "",
  apa_diperbarui: "",
  alasan_risiko: "",
  status_hasil_uji: "",
  pemeriksa_pemutus: "",
};

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link FormVersiMetode}. */
export interface FormVersiMetodeProps {
  accessToken: string | undefined;
  awal?: VersiMetodeRead;
  onSelesai?: () => void;
}

/** Properti isi form: ditambah ETag dari GET detail yang sama dengan `awal`. */
interface FormVersiMetodeIsiProps extends FormVersiMetodeProps {
  etag?: string | null;
}

/**
 * Form catatan versi metode (mode ubah memuat catatannya sendiri lewat GET detail dan
 * mengirim `If-Match` dari ETag GET yang sama): mode tambah (`POST /api/v1/redesain/versi-metode`) bila
 * `awal` tidak diberikan, mode ubah (`PATCH .../{versi_id}`) bila `awal` ada.
 *
 * Respons 409 menampilkan {@link PESAN_KONFLIK_VERSI} tanpa toast sukses; galat lain
 * (mis. 422) ditampilkan inline dan lewat `notifyGagal`. Teks bebas dilindungi
 * `PeringatanPrivasi` (pemeriksa diisi jabatan/peran, bukan nama).
 *
 * @param props.accessToken - Token akses dari Server Component induk.
 * @param props.awal - Catatan yang diubah; kosong untuk mode tambah.
 * @param props.onSelesai - Dipanggil setelah simpan sukses (mis. menutup form ubah).
 */
export function FormVersiMetode(props: FormVersiMetodeProps) {
  const { awal, accessToken } = props;
  if (!awal) return <FormVersiMetodeIsi {...props} />;
  return (
    <PemuatRekaman
      accessToken={accessToken}
      kunci={awal.id}
      ambil={(c) =>
        c.GET("/api/v1/redesain/versi-metode/{versi_id}", {
          params: { path: { versi_id: awal.id } },
        })
      }
    >
      {(data, etag) => <FormVersiMetodeIsi {...props} awal={data} etag={etag} />}
    </PemuatRekaman>
  );
}

function FormVersiMetodeIsi({
  accessToken,
  awal,
  onSelesai,
  etag: etagAwal = null,
}: FormVersiMetodeIsiProps) {
  const router = useRouter();
  const [etag, setEtag] = useState<string | null>(etagAwal);
  const [nilai, setNilai] = useState<VersiMetodeCreate>(
    awal
      ? {
          versi: awal.versi,
          tanggal: awal.tanggal,
          bagian: awal.bagian,
          apa_diperbarui: awal.apa_diperbarui,
          alasan_risiko: awal.alasan_risiko,
          status_hasil_uji: awal.status_hasil_uji,
          pemeriksa_pemutus: awal.pemeriksa_pemutus,
        }
      : KOSONG,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function ubah<K extends keyof VersiMetodeCreate>(k: K, v: string) {
    setNilai((s) => ({ ...s, [k]: v }));
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const client = withServerAuth(accessToken);
      const res = awal
        ? await client.PATCH("/api/v1/redesain/versi-metode/{versi_id}", {
            params: { path: { versi_id: awal.id } },
            body: nilai,
            headers: headerIfMatch(etag),
          })
        : await client.POST("/api/v1/redesain/versi-metode", { body: nilai });
      if (res.response.status === 409) {
        setError(PESAN_KONFLIK_VERSI);
        return;
      }
      if (!res.data) throw apiErrorDari(res);
      if (awal) setEtag(bacaEtag(res.response));
      notifySukses(awal ? "Catatan versi diperbarui." : "Catatan versi ditambahkan.");
      if (!awal) setNilai(KOSONG);
      router.refresh();
      onSelesai?.();
    } catch (err) {
      const galat = petakanKonkurensi(err);
      setError(pesanGagal(galat));
      notifyGagal(galat);
    } finally {
      setLoading(false);
    }
  }

  const teks = (
    k: keyof VersiMetodeCreate,
    label: string,
    opsi: { area?: boolean; type?: string } = {},
  ) => (
    <label className="block text-sm">
      <span className="block text-gray-600 dark:text-gray-400">{label}</span>
      {opsi.area ? (
        <textarea
          value={nilai[k]}
          onChange={(e) => ubah(k, e.target.value)}
          required
          rows={2}
          className={INPUT}
        />
      ) : (
        <input
          type={opsi.type ?? "text"}
          value={nilai[k]}
          onChange={(e) => ubah(k, e.target.value)}
          required
          className={INPUT}
        />
      )}
    </label>
  );

  return (
    <form
      onSubmit={kirim}
      className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
    >
      <h2 className="font-medium">{awal ? "Ubah catatan versi" : "Tambah catatan versi"}</h2>
      <PeringatanPrivasi />
      <div className="grid gap-3 sm:grid-cols-3">
        {teks("versi", "Versi")}
        {teks("tanggal", "Tanggal", { type: "date" })}
        {teks("bagian", "Bagian")}
      </div>
      {teks("apa_diperbarui", "Apa yang diperbarui", { area: true })}
      {teks("alasan_risiko", "Alasan / risiko yang dikendalikan", { area: true })}
      {teks("status_hasil_uji", "Status dan hasil uji", { area: true })}
      {teks("pemeriksa_pemutus", "Pemeriksa / pemutus (jabatan atau peran, bukan nama)")}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Menyimpan…" : awal ? "Simpan perubahan" : "Tambah"}
        </button>
        {onSelesai && (
          <button
            type="button"
            onClick={onSelesai}
            className="rounded-md border border-gray-300 px-4 py-1.5 text-sm dark:border-gray-600"
          >
            Batal
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </form>
  );
}
