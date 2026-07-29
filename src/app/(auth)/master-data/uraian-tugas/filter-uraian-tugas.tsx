"use client";

/**
 * Kontrol filter master data Uraian Tugas (jabatan / tugas pokok / detil tugas).
 *
 * Tiga `<select>` ber-label, tanpa tombol submit — `onChange` langsung mengganti URL
 * lewat `router.push()` (filter hidup di `searchParams`, bukan state lokal murni).
 * Bukan `<form method="get">` karena penyempitan opsi (tugas pokok mengikuti jabatan,
 * detil tugas mengikuti jabatan & tugas pokok) butuh dihitung di klien sebelum submit.
 */
import { useRouter } from "next/navigation";
import type { DetilTugasRead, JabatanRead, TugasPokokRead } from "@/lib/api/schema";
import { opsiDetilTugas, opsiTugasPokok, type FilterUraianTugas } from "@/lib/uraian-tugas-filter";

interface Props {
  /** Seluruh jabatan (katalog penuh) — opsi dropdown Jabatan tidak pernah menyempit. */
  jabatan: JabatanRead[];
  /** Seluruh tugas pokok (katalog penuh), disempitkan di klien sesuai jabatan terpilih. */
  tugasPokok: TugasPokokRead[];
  /** Seluruh detil tugas (katalog penuh), disempitkan di klien sesuai jabatan/tugas pokok terpilih. */
  detilTugas: DetilTugasRead[];
  /** Filter yang sedang aktif, dibaca dari `searchParams` oleh pemanggil (`page.tsx`). */
  filter: FilterUraianTugas;
}

const BASE_PATH = "/master-data/uraian-tugas";

/** Bangun URL baru dari filter — hanya key yang terisi yang disertakan; `hlm` selalu dibuang. */
function buildUrl(filter: FilterUraianTugas): string {
  const sp = new URLSearchParams();
  if (filter.jabatanId) sp.set("jabatan", filter.jabatanId);
  if (filter.tugasPokokId) sp.set("tp", filter.tugasPokokId);
  if (filter.detilTugasId) sp.set("dt", filter.detilTugasId);
  const qs = sp.toString();
  return qs ? `${BASE_PATH}?${qs}` : BASE_PATH;
}

/** Kontrol filter Uraian Tugas: tiga `<select>` + tautan "Hapus filter" bila ada filter aktif. */
export function FilterUraianTugas({ jabatan, tugasPokok, detilTugas, filter }: Props) {
  const router = useRouter();
  const adaFilterAktif =
    filter.jabatanId !== null || filter.tugasPokokId !== null || filter.detilTugasId !== null;

  const opsiTp = opsiTugasPokok(tugasPokok, filter.jabatanId);
  const opsiDt = opsiDetilTugas(detilTugas, filter.jabatanId, filter.tugasPokokId);

  function onJabatanChange(value: string) {
    router.push(buildUrl({ jabatanId: value || null, tugasPokokId: null, detilTugasId: null }));
  }

  function onTugasPokokChange(value: string) {
    router.push(
      buildUrl({ jabatanId: filter.jabatanId, tugasPokokId: value || null, detilTugasId: null }),
    );
  }

  function onDetilTugasChange(value: string) {
    router.push(
      buildUrl({
        jabatanId: filter.jabatanId,
        tugasPokokId: filter.tugasPokokId,
        detilTugasId: value || null,
      }),
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="filter-jabatan"
          className="text-xs font-medium text-gray-600 dark:text-gray-400"
        >
          Jabatan
        </label>
        <select
          id="filter-jabatan"
          value={filter.jabatanId ?? ""}
          onChange={(e) => onJabatanChange(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="">Semua jabatan</option>
          {jabatan.map((j) => (
            <option key={j.id} value={j.id}>
              {j.nama}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-tp" className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Tugas Pokok
        </label>
        <select
          id="filter-tp"
          value={filter.tugasPokokId ?? ""}
          onChange={(e) => onTugasPokokChange(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="">Semua tugas pokok</option>
          {opsiTp.map((tp) => (
            <option key={tp.id} value={tp.id}>
              {tp.nama}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-dt" className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Detil Tugas
        </label>
        <select
          id="filter-dt"
          value={filter.detilTugasId ?? ""}
          onChange={(e) => onDetilTugasChange(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="">Semua detil tugas</option>
          {opsiDt.map((dt) => (
            <option key={dt.id} value={dt.id}>
              {dt.nama}
            </option>
          ))}
        </select>
      </div>

      {adaFilterAktif && (
        <button
          type="button"
          onClick={() => router.push(BASE_PATH)}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Hapus filter
        </button>
      )}
    </div>
  );
}
