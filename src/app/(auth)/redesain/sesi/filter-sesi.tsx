"use client";

import { useRouter } from "next/navigation";
import { JENIS_KEGIATAN, STATUS_IZIN, querySesi, type FilterSesi } from "@/lib/redesain-sesi";

const KOTAK =
  "rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800";
const LABEL = "flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-400";

/**
 * Kontrol filter register sesi: kode sesi, kode orang, jenis kegiatan, status izin.
 * Tanpa tombol submit: perubahan langsung mengganti URL lewat `router.push()` dan membuang
 * nomor halaman (`hlm`). Kolom teks diterapkan saat `Enter`/blur.
 *
 * @param props.filter - Filter aktif dari `searchParams`.
 */
export function FilterSesiBar({ filter }: { filter: FilterSesi }) {
  const router = useRouter();

  function ubah(bagian: Partial<FilterSesi>) {
    const qs = querySesi({ ...filter, ...bagian });
    router.push(qs ? `/redesain/sesi?${qs}` : "/redesain/sesi");
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className={LABEL}>
        Kode sesi
        <input
          key={`sesi-${filter.kodeSesi ?? ""}`}
          defaultValue={filter.kodeSesi ?? ""}
          onBlur={(e) =>
            e.target.value.trim() !== (filter.kodeSesi ?? "") &&
            ubah({ kodeSesi: e.target.value.trim() || null })
          }
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className={KOTAK}
        />
      </label>
      <label className={LABEL}>
        Kode orang
        <input
          key={`orang-${filter.kodeOrang ?? ""}`}
          defaultValue={filter.kodeOrang ?? ""}
          onBlur={(e) =>
            e.target.value.trim() !== (filter.kodeOrang ?? "") &&
            ubah({ kodeOrang: e.target.value.trim() || null })
          }
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className={KOTAK}
        />
      </label>
      <label className={LABEL}>
        Jenis kegiatan
        <select
          value={filter.jenisKegiatan ?? ""}
          onChange={(e) => ubah({ jenisKegiatan: e.target.value || null })}
          className={KOTAK}
        >
          <option value="">Semua</option>
          {JENIS_KEGIATAN.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>
      </label>
      <label className={LABEL}>
        Status izin
        <select
          value={filter.statusIzin ?? ""}
          onChange={(e) => ubah({ statusIzin: e.target.value || null })}
          className={KOTAK}
        >
          <option value="">Semua</option>
          {STATUS_IZIN.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
