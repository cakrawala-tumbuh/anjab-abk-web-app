"use client";

import { useRouter } from "next/navigation";
import type { KonteksRead } from "@/lib/api/schema";
import {
  OPSI_PRIORITAS,
  OPSI_STATUS_BUKTI,
  OPSI_STATUS_PENILAIAN,
  queryFilterYayasan,
  type FilterYayasan,
} from "@/lib/redesain-yayasan";

const SELECT =
  "rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800";
const LABEL = "flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-400";

function Pilih({
  label,
  nilai,
  opsi,
  onUbah,
}: {
  label: string;
  nilai: string | null;
  opsi: ReadonlyArray<{ value: string; teks: string }>;
  onUbah: (v: string | null) => void;
}) {
  return (
    <label className={LABEL}>
      {label}
      <select
        value={nilai ?? ""}
        onChange={(e) => onUbah(e.target.value || null)}
        className={SELECT}
      >
        <option value="">Semua</option>
        {opsi.map((o) => (
          <option key={o.value} value={o.value}>
            {o.teks}
          </option>
        ))}
      </select>
    </label>
  );
}

const dariDaftar = (d: ReadonlyArray<string>) => d.map((v) => ({ value: v, teks: v }));

/**
 * Kontrol filter ringkasan yayasan: konteks, status bukti, saran otomatis, prioritas
 * final, status penilaian. Tanpa tombol submit — `onChange` langsung mengganti URL lewat
 * `router.push()` dan membuang nomor halaman (`hlm`).
 *
 * @param props.konteks - Seluruh konteks (opsi dropdown konteks, bernilai kode).
 * @param props.filter - Filter aktif dari `searchParams`.
 */
export function FilterYayasanBar({
  konteks,
  filter,
}: {
  konteks: KonteksRead[];
  filter: FilterYayasan;
}) {
  const router = useRouter();

  function ubah(bagian: Partial<FilterYayasan>) {
    const qs = queryFilterYayasan({ ...filter, ...bagian });
    router.push(qs ? `/redesain/yayasan?${qs}` : "/redesain/yayasan");
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Pilih
        label="Konteks"
        nilai={filter.konteksKode}
        opsi={konteks.map((k) => ({ value: k.kode, teks: `${k.kode} — ${k.tema}` }))}
        onUbah={(v) => ubah({ konteksKode: v })}
      />
      <Pilih
        label="Status bukti"
        nilai={filter.statusBukti}
        opsi={dariDaftar(OPSI_STATUS_BUKTI)}
        onUbah={(v) => ubah({ statusBukti: v })}
      />
      <Pilih
        label="Saran otomatis"
        nilai={filter.saranOtomatis}
        opsi={dariDaftar(OPSI_PRIORITAS)}
        onUbah={(v) => ubah({ saranOtomatis: v })}
      />
      <Pilih
        label="Prioritas final"
        nilai={filter.prioritasFinal}
        opsi={dariDaftar(OPSI_PRIORITAS)}
        onUbah={(v) => ubah({ prioritasFinal: v })}
      />
      <Pilih
        label="Status penilaian"
        nilai={filter.statusPenilaian}
        opsi={dariDaftar(OPSI_STATUS_PENILAIAN)}
        onUbah={(v) => ubah({ statusPenilaian: v })}
      />
    </div>
  );
}
