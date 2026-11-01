"use client";

import { useRouter } from "next/navigation";
import type { KonteksRead, SekolahRead } from "@/lib/api/schema";
import {
  GELOMBANG,
  STATUS_AWAL,
  queryFilterMasalah,
  type FilterMasalah,
} from "@/lib/redesain-register";

const SELECT =
  "rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800";

/**
 * Kontrol filter register masalah: konteks, sekolah, status awal, gelombang, dan status
 * dibuka. Tanpa tombol submit — `onChange` langsung mengganti URL lewat `router.push()`
 * dan membuang nomor halaman (`hlm`).
 *
 * @param props.konteks - Seluruh konteks (opsi dropdown).
 * @param props.sekolah - Seluruh sekolah master (opsi dropdown).
 * @param props.filter - Filter aktif dari `searchParams`.
 */
export function FilterMasalahBar({
  konteks,
  sekolah,
  filter,
}: {
  konteks: KonteksRead[];
  sekolah: SekolahRead[];
  filter: FilterMasalah;
}) {
  const router = useRouter();

  function ubah(bagian: Partial<FilterMasalah>) {
    const qs = queryFilterMasalah({ ...filter, ...bagian });
    router.push(qs ? `/redesain/masalah?${qs}` : "/redesain/masalah");
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
        Konteks
        <select
          value={filter.konteksId ?? ""}
          onChange={(e) => ubah({ konteksId: e.target.value || null })}
          className={SELECT}
        >
          <option value="">Semua</option>
          {konteks.map((k) => (
            <option key={k.id} value={k.id}>
              {k.kode} — {k.tema}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
        Sekolah
        <select
          value={filter.sekolahId ?? ""}
          onChange={(e) => ubah({ sekolahId: e.target.value || null })}
          className={SELECT}
        >
          <option value="">Semua</option>
          {sekolah.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
        Status awal
        <select
          value={filter.statusAwal ?? ""}
          onChange={(e) => ubah({ statusAwal: e.target.value || null })}
          className={SELECT}
        >
          <option value="">Semua</option>
          {STATUS_AWAL.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
        Gelombang
        <select
          value={filter.gelombang ?? ""}
          onChange={(e) => ubah({ gelombang: e.target.value || null })}
          className={SELECT}
        >
          <option value="">Semua</option>
          {GELOMBANG.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
        Dibuka untuk konfirmasi
        <select
          value={filter.dibuka === null ? "" : filter.dibuka ? "ya" : "tidak"}
          onChange={(e) => ubah({ dibuka: e.target.value === "" ? null : e.target.value === "ya" })}
          className={SELECT}
        >
          <option value="">Semua</option>
          <option value="ya">Dibuka</option>
          <option value="tidak">Tertutup</option>
        </select>
      </label>
    </div>
  );
}
