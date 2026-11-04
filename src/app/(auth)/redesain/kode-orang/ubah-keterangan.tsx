"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { bacaEtag, headerIfMatch, petakanKonkurensi } from "@/lib/konkurensi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { PemuatRekaman } from "@/lib/use-rekaman-ber-etag";

/**
 * Sel "Keterangan peran" yang dapat diubah (`PATCH /api/v1/redesain/kode-orang/{id}`).
 *
 * Tampil sebagai teks + tombol "Ubah". Editor baru dimontase saat "Ubah" diklik dan memuat
 * rekamannya sendiri lewat `GET .../kode-orang/{id}` (nilai isian dan ETag `If-Match` berasal
 * dari GET yang sama; satu GET per baris hanya bila diubah, bukan N GET saat halaman dibuka).
 * Hanya `keterangan_peran` yang bisa diubah; tidak ada tombol hapus.
 *
 * @param props.id - ID record kode orang.
 * @param props.awal - Keterangan peran pada daftar (hanya ditampilkan).
 * @param props.accessToken - Token akses dari Server Component induk.
 */
export function UbahKeterangan({
  id,
  awal,
  accessToken,
}: {
  id: string;
  awal: string;
  accessToken: string | undefined;
}) {
  const [diedit, setDiedit] = useState(false);
  if (!diedit) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span>{awal || "—"}</span>
        <button
          type="button"
          onClick={() => setDiedit(true)}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Ubah
        </button>
      </div>
    );
  }
  return (
    <PemuatRekaman
      accessToken={accessToken}
      kunci={id}
      ambil={(c) =>
        c.GET("/api/v1/redesain/kode-orang/{kode_orang_id}", {
          params: { path: { kode_orang_id: id } },
        })
      }
    >
      {(data, etag) => (
        <EditorKeterangan
          id={id}
          awal={data.keterangan_peran ?? ""}
          etag={etag}
          accessToken={accessToken}
        />
      )}
    </PemuatRekaman>
  );
}

/** Editor keterangan peran; nilai awal dan `etag` berasal dari satu GET detail. */
function EditorKeterangan({
  id,
  awal,
  etag: etagAwal,
  accessToken,
}: {
  id: string;
  awal: string;
  etag: string | null;
  accessToken: string | undefined;
}) {
  const router = useRouter();
  const [nilai, setNilai] = useState(awal);
  const [dasar, setDasar] = useState(awal);
  const [etag, setEtag] = useState<string | null>(etagAwal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function simpan() {
    setLoading(true);
    setError(null);
    try {
      const res = await withServerAuth(accessToken).PATCH(
        "/api/v1/redesain/kode-orang/{kode_orang_id}",
        {
          params: { path: { kode_orang_id: id } },
          body: { keterangan_peran: nilai.trim() },
          headers: headerIfMatch(etag),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      setEtag(bacaEtag(res.response));
      setDasar(nilai.trim());
      notifySukses("Keterangan peran disimpan.");
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
    <div className="flex flex-wrap items-center gap-2">
      <input
        aria-label="Keterangan peran"
        value={nilai}
        onChange={(e) => setNilai(e.target.value)}
        maxLength={200}
        className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
      />
      <button
        type="button"
        onClick={simpan}
        disabled={loading || nilai.trim() === dasar}
        className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
      >
        {loading ? "Menyimpan…" : "Simpan"}
      </button>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}
