"use client";

import { Fragment, useState } from "react";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { KonfirmasiDaftarRead, KonfirmasiRead, KonteksRead } from "@/lib/api/schema";
import { notifyGagal, pesanGagal } from "@/lib/notify";
import { formatWaktu } from "@/lib/redesain-alur";
import { bisaAngkatMasalah, saringKonfirmasi } from "@/lib/redesain-konfirmasi-tim";
import { DialogAngkat } from "./dialog-angkat";

/** Properti {@link TabelKonfirmasi}. */
export interface TabelKonfirmasiProps {
  /** Seluruh konfirmasi masalah, termasuk versi digantikan. */
  konfirmasi: KonfirmasiDaftarRead[];
  konteks: KonteksRead[];
  accessToken: string | undefined;
}

const KOLOM = [
  "Kode orang",
  "Peran",
  "Sumber",
  "Status",
  "Dikirim",
  "Dugaan diperlihatkan",
  "Kesesuaian",
  "K1",
  "K2",
  "K3",
  "K4",
  "Indikasi risiko",
  "",
];

/** Field detail konfirmasi yang ditampilkan saat baris dibuka (label → kunci). */
const FIELD_DETAIL: ReadonlyArray<[string, keyof KonfirmasiRead]> = [
  ["Tanggal", "tanggal"],
  ["Cerita sebelum", "cerita_sebelum"],
  ["Cerita dikunci pada", "cerita_dikunci_pada"],
  ["Dugaan ditampilkan pada", "dugaan_ditampilkan_pada"],
  ["Koreksi", "koreksi"],
  ["Masalah baru", "masalah_baru"],
  ["Alasan K", "alasan_k"],
  ["Bukti dapat diperiksa", "bukti_dapat_diperiksa"],
  ["Hal belum jelas", "hal_belum_jelas"],
  ["Catatan independensi", "catatan_independensi"],
  ["Catatan akses", "catatan_akses"],
];

const v = (x: string | null | undefined) => (x && x.trim() ? x : "—");

/**
 * Tabel READ-ONLY konfirmasi sekolah satu masalah (tanpa tombol ubah/hapus).
 *
 * Versi `digantikan` bertanda "Digantikan" dan tersembunyi sampai toggle dinyalakan.
 * Membuka baris memuat seluruh field dari `GET /api/v1/redesain/konfirmasi/{id}`;
 * kegagalan muat dilaporkan lewat `notifyGagal` dan panel galat (terbedakan dari kosong).
 * Kolom "Dikirim" tampil `YYYY-MM-DD HH:MM` via `formatWaktu` (`—` bila kosong).
 * Tombol "Angkat masalah" hanya untuk konfirmasi `terkirim` ber-`masalah_baru`.
 *
 * @param props - Lihat {@link TabelKonfirmasiProps}.
 */
export function TabelKonfirmasi({ konfirmasi, konteks, accessToken }: TabelKonfirmasiProps) {
  const [semua, setSemua] = useState(false);
  const [terbuka, setTerbuka] = useState<string | null>(null);
  const [detail, setDetail] = useState<KonfirmasiRead | null>(null);
  const [gagal, setGagal] = useState<string | null>(null);
  const tampil = saringKonfirmasi(konfirmasi, semua);
  const jumlahDigantikan = konfirmasi.filter((k) => k.digantikan).length;

  async function toggleBaris(id: string) {
    if (terbuka === id) {
      setTerbuka(null);
      return;
    }
    setTerbuka(id);
    setDetail(null);
    setGagal(null);
    try {
      const res = await withServerAuth(accessToken).GET(
        "/api/v1/redesain/konfirmasi/{konfirmasi_id}",
        { params: { path: { konfirmasi_id: id } } },
      );
      if (!res.data) throw apiErrorDari(res);
      setDetail(res.data);
    } catch (err) {
      setGagal(pesanGagal(err));
      notifyGagal(err);
    }
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={semua} onChange={(e) => setSemua(e.target.checked)} />
        Tampilkan versi digantikan ({jumlahDigantikan})
      </label>
      {tampil.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Belum ada konfirmasi sekolah untuk masalah ini.
        </p>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {KOLOM.map((h, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {tampil.map((k) => (
                <Fragment key={k.id}>
                  <tr className="align-top">
                    <td className="px-3 py-2 font-mono text-xs">
                      {k.kode_orang}
                      {k.digantikan && (
                        <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 font-sans text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                          Digantikan
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-normal break-words">{v(k.peran)}</td>
                    <td className="px-3 py-2">{k.sumber}</td>
                    <td className="px-3 py-2">{k.status}</td>
                    <td className="px-3 py-2">
                      {k.dikirim_pada ? formatWaktu(k.dikirim_pada) : "—"}
                    </td>
                    <td className="px-3 py-2">{k.dugaan_diperlihatkan}</td>
                    <td className="px-3 py-2">{v(k.kesesuaian)}</td>
                    <td className="px-3 py-2">{v(k.k1)}</td>
                    <td className="px-3 py-2">{v(k.k2)}</td>
                    <td className="px-3 py-2">{v(k.k3)}</td>
                    <td className="px-3 py-2">{v(k.k4)}</td>
                    <td className="px-3 py-2">{v(k.indikasi_risiko)}</td>
                    <td className="space-x-2 px-3 py-2 whitespace-nowrap">
                      <button
                        type="button"
                        aria-expanded={terbuka === k.id}
                        onClick={() => toggleBaris(k.id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        {terbuka === k.id ? "Tutup" : "Buka"}
                      </button>
                      {bisaAngkatMasalah(k) && (
                        <DialogAngkat konfirmasi={k} konteks={konteks} accessToken={accessToken} />
                      )}
                    </td>
                  </tr>
                  {terbuka === k.id && (
                    <tr>
                      <td
                        colSpan={KOLOM.length}
                        className="bg-gray-50 px-3 py-3 dark:bg-gray-800/50"
                      >
                        {gagal ? (
                          <p role="alert" className="form-error">
                            Gagal memuat detail konfirmasi: {gagal}
                          </p>
                        ) : !detail ? (
                          <p className="text-sm text-gray-500">Memuat…</p>
                        ) : (
                          <dl
                            aria-label="Detail konfirmasi"
                            className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[12rem_1fr]"
                          >
                            {FIELD_DETAIL.map(([label, kunci]) => (
                              <Fragment key={kunci}>
                                <dt className="text-gray-500">{label}</dt>
                                <dd className="whitespace-pre-wrap break-words">
                                  {v(detail[kunci] as string | null)}
                                </dd>
                              </Fragment>
                            ))}
                          </dl>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
