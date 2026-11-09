"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { JENIS_SASARAN, labelSasaran, queryFilterUsulan, type FilterUsulan } from "@/lib/ai-usulan";

const KONTROL =
  "rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800";

/**
 * Kontrol filter index usulan: fungsi dan jenis sasaran. Hanya mengubah URL (`router.push`)
 * dan selalu membuang `hlm`; data dibaca ulang Server Component. Tidak ada filter putusan.
 *
 * @param props.filter - Filter aktif dari `searchParams`.
 */
export function FilterUsulanForm({ filter }: { filter: FilterUsulan }) {
  const router = useRouter();
  const [fungsi, setFungsi] = useState(filter.fungsi ?? "");

  function dorong(f: FilterUsulan) {
    const qs = queryFilterUsulan(f);
    router.push(qs ? `/ai-usulan?${qs}` : "/ai-usulan");
  }

  function terapkan(e: FormEvent) {
    e.preventDefault();
    dorong({ fungsi: fungsi.trim() || null, sasaran_jenis: filter.sasaran_jenis });
  }

  return (
    <form
      onSubmit={terapkan}
      className="flex flex-wrap items-end gap-3"
      aria-label="Filter usulan AI"
    >
      <label className="text-sm">
        <span className="block text-gray-600 dark:text-gray-400">Fungsi</span>
        <input
          value={fungsi}
          onChange={(e) => setFungsi(e.target.value)}
          maxLength={20}
          placeholder="P09"
          className={KONTROL}
        />
      </label>
      <label className="text-sm">
        <span className="block text-gray-600 dark:text-gray-400">Sasaran</span>
        <select
          value={filter.sasaran_jenis ?? ""}
          onChange={(e) =>
            dorong({ fungsi: fungsi.trim() || null, sasaran_jenis: e.target.value || null })
          }
          className={KONTROL}
        >
          <option value="">Semua sasaran</option>
          {JENIS_SASARAN.map((s) => (
            <option key={s} value={s}>
              {labelSasaran(s)}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className={`${KONTROL} hover:bg-gray-100 dark:hover:bg-gray-700`}>
        Terapkan
      </button>
    </form>
  );
}
