"use client";

import { useEffect, useState } from "react";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import type { KodeOrangRead } from "@/lib/api/schema";
import { notifyGagal, pesanGagal } from "@/lib/notify";

/** Properti {@link PilihKodeOrang}. */
export interface PilihKodeOrangProps {
  /** Nama field `<select>` (dipakai form native). */
  name: string;
  /** Kode terpilih saat ini (string `kode`, mis. `O-0001`); `""` bila kosong. */
  value: string;
  /** Dipanggil dengan string `kode` terpilih (`""` bila dikosongkan). */
  onChange: (kode: string) => void;
  /**
   * Bila true, field diwajibkan: opsi kosong `— pilih —` tetap dirender sebagai
   * placeholder tetapi `disabled` (tampil terpilih saat `value === ""`, tak bisa dipilih ulang).
   * Kewajiban ditandai `aria-required`, BUKAN atribut `required` bawaan: validasi bawaan
   * browser memblokir submit dengan pesan berbahasa browser sehingga pesan aplikasi tak
   * pernah tampil. Penegakan ada di guard submit form pemakai (lihat `PESAN_KODE_ORANG_WAJIB`).
   */
  wajib?: boolean;
  /** Bila true, `<select>` ditandai `aria-invalid="true"` (galat validasi sedang berlaku). */
  invalid?: boolean;
  /** `id` elemen pesan galat; dipasang sebagai `aria-describedby` selama `invalid`. */
  describedBy?: string;
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

/**
 * Pemilih kode orang untuk field `*_kode_orang` di form redesain.
 *
 * Opsi dimuat dari `GET /api/v1/redesain/kode-orang` (seluruh halaman) dan diberi
 * label `kode — keterangan_peran`. Nama orang TIDAK PERNAH ditampilkan. Kegagalan
 * memuat dilaporkan lewat `notifyGagal` dan ditampilkan sebagai panel galat yang
 * terbedakan dari daftar kosong yang sah.
 *
 * Nilai yang tampil selalu sama dengan `value`: opsi kosong (`value=""`) selalu ada
 * sehingga browser tidak memilih opsi pertama secara diam-diam saat `value` kosong.
 *
 * @param props - Lihat {@link PilihKodeOrangProps}.
 * @returns `<select>` berisi kode orang, atau panel galat bila gagal memuat.
 */
export function PilihKodeOrang({
  name,
  value,
  onChange,
  wajib,
  invalid,
  describedBy,
  accessToken,
}: PilihKodeOrangProps) {
  const [opsi, setOpsi] = useState<KodeOrangRead[] | null>(null);
  const [gagal, setGagal] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    const client = withServerAuth(accessToken);
    ambilSemuaHalaman<KodeOrangRead>(async (limit, offset) => {
      const res = await client.GET("/api/v1/redesain/kode-orang", {
        params: { query: { limit, offset } },
      });
      if (!res.data) throw apiErrorDari(res);
      return { items: res.data.items, total: res.data.total };
    })
      .then((items) => {
        if (!batal) setOpsi(items);
      })
      .catch((err: unknown) => {
        if (batal) return;
        setGagal(pesanGagal(err));
        notifyGagal(err);
      });
    return () => {
      batal = true;
    };
  }, [accessToken]);

  if (gagal) {
    return (
      <p role="alert" className="form-error">
        Gagal memuat daftar kode orang: {gagal}
      </p>
    );
  }

  return (
    <select
      name={name}
      value={value}
      aria-required={wajib || undefined}
      aria-invalid={invalid ? true : undefined}
      aria-describedby={invalid ? describedBy : undefined}
      disabled={opsi === null}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
    >
      {opsi === null ? (
        <option value="">Memuat…</option>
      ) : (
        <option value="" disabled={wajib}>
          {wajib ? "— pilih —" : "— belum dipilih —"}
        </option>
      )}
      {(opsi ?? []).map((k) => (
        <option key={k.id} value={k.kode}>
          {k.keterangan_peran ? `${k.kode} — ${k.keterangan_peran}` : k.kode}
        </option>
      ))}
    </select>
  );
}
