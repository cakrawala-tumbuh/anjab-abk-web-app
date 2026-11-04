"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { ProsesRead, SekolahRead } from "@/lib/api/schema";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { bacaEtag, headerIfMatch, petakanKonkurensi } from "@/lib/konkurensi";
import { PemuatRekaman } from "@/lib/use-rekaman-ber-etag";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link FormProses}. */
export interface FormProsesProps {
  /** ID masalah pemilik proses. */
  masalahId: string;
  /** Sekolah terkunci bila masalah punya `sekolah_id`; `null` = pilihan bebas. */
  sekolahTerkunci: string | null;
  /** Daftar sekolah master untuk pilihan (dipakai saat tidak terkunci). */
  sekolah: SekolahRead[];
  /** Periode bawaan (mis. `periode_acuan` masalah). */
  periodeBawaan: string;
  /** Proses yang diubah; kosong = mode tambah. */
  awal?: ProsesRead;
  accessToken: string | undefined;
}

/** Properti isi form: ditambah ETag dari GET detail yang sama dengan `awal`. */
interface FormProsesIsiProps extends FormProsesProps {
  etag?: string | null;
}

/**
 * Form tambah/ubah proses pada bagian Alur. Mode ubah memuat prosesnya sendiri lewat
 * `GET /proses/{id}` dan mengirim `If-Match` dari ETag GET yang sama.
 *
 * Tambah: `POST /api/v1/redesain/proses` (`masalah_id`, `sekolah_id`, `periode`,
 * `nama_proses`). Bila masalah bersekolah, `sekolah_id` terkunci ke sekolah itu dan tidak
 * dapat diganti; 422 selisih dari backend tetap tampil sebagai toast gagal. Ubah:
 * `PATCH /proses/{id}` hanya `periode` dan `nama_proses`. Sukses → `router.refresh()`.
 *
 * @param props - Lihat {@link FormProsesProps}.
 */
export function FormProses(props: FormProsesProps) {
  const { awal, accessToken } = props;
  if (!awal) return <FormProsesIsi {...props} />;
  return (
    <PemuatRekaman
      accessToken={accessToken}
      kunci={awal.id}
      ambil={(c) =>
        c.GET("/api/v1/redesain/proses/{proses_id}", { params: { path: { proses_id: awal.id } } })
      }
    >
      {(data, etag) => <FormProsesIsi {...props} awal={data} etag={etag} />}
    </PemuatRekaman>
  );
}

function FormProsesIsi({
  masalahId,
  sekolahTerkunci,
  sekolah,
  periodeBawaan,
  awal,
  accessToken,
  etag: etagAwal = null,
}: FormProsesIsiProps) {
  const router = useRouter();
  const [etag, setEtag] = useState<string | null>(etagAwal);
  const [sekolahId, setSekolahId] = useState(awal?.sekolah_id ?? sekolahTerkunci ?? "");
  const [periode, setPeriode] = useState(awal?.periode ?? periodeBawaan);
  const [nama, setNama] = useState(awal?.nama_proses ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const client = withServerAuth(accessToken);
      if (awal) {
        const res = await client.PATCH("/api/v1/redesain/proses/{proses_id}", {
          params: { path: { proses_id: awal.id } },
          body: { periode: periode.trim(), nama_proses: nama.trim() },
          headers: headerIfMatch(etag),
        });
        if (!res.data) throw apiErrorDari(res);
        setEtag(bacaEtag(res.response));
        notifySukses(`Proses ${res.data.kode} diperbarui.`);
      } else {
        const res = await client.POST("/api/v1/redesain/proses", {
          body: {
            masalah_id: masalahId,
            sekolah_id: sekolahTerkunci ?? sekolahId,
            periode: periode.trim(),
            nama_proses: nama.trim(),
          },
        });
        if (!res.data) throw apiErrorDari(res);
        notifySukses(`Proses ${res.data.kode} ditambahkan.`);
        setNama("");
      }
      router.refresh();
    } catch (err) {
      const galat = petakanKonkurensi(err);
      setError(pesanGagal(galat));
      notifyGagal(galat);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={kirim} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {!awal && (
          <label className="text-sm">
            <span className="block text-gray-600 dark:text-gray-400">Sekolah</span>
            <select
              aria-label="Sekolah proses"
              value={sekolahTerkunci ?? sekolahId}
              disabled={sekolahTerkunci !== null}
              required
              onChange={(e) => setSekolahId(e.target.value)}
              className={INPUT}
            >
              {sekolahTerkunci === null && <option value="">— pilih sekolah —</option>}
              {(sekolahTerkunci ? sekolah.filter((s) => s.id === sekolahTerkunci) : sekolah).map(
                (s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama}
                  </option>
                ),
              )}
              {sekolahTerkunci !== null && !sekolah.some((s) => s.id === sekolahTerkunci) && (
                <option value={sekolahTerkunci}>{sekolahTerkunci}</option>
              )}
            </select>
            {sekolahTerkunci !== null && (
              <span className="text-xs text-gray-500">Terkunci ke sekolah masalah ini.</span>
            )}
          </label>
        )}
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Periode</span>
          <input
            aria-label="Periode proses"
            value={periode}
            required
            onChange={(e) => setPeriode(e.target.value)}
            className={INPUT}
          />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Nama proses</span>
          <input
            aria-label="Nama proses"
            value={nama}
            required
            onChange={(e) => setNama(e.target.value)}
            className={INPUT}
          />
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
        {loading ? "Menyimpan…" : awal ? "Simpan proses" : "Tambah proses"}
      </button>
    </form>
  );
}
