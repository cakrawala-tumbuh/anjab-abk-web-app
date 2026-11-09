import type { ReactNode } from "react";

const BATAS_KEDALAMAN = 12;

/** Properti {@link IsiUsulan}. */
export interface IsiUsulanProps {
  /** Nilai JSON apa pun (objek, larik, atau skalar); `null`/`undefined` tampil sebagai "—". */
  nilai: unknown;
}

function labelKunci(kunci: string): string {
  return kunci.replace(/_/g, " ");
}

function render(nilai: unknown, kedalaman: number): ReactNode {
  if (nilai === null || nilai === undefined || nilai === "") {
    return <span className="text-gray-500 dark:text-gray-400">—</span>;
  }
  if (kedalaman >= BATAS_KEDALAMAN) {
    return <code className="break-words text-xs">{JSON.stringify(nilai)}</code>;
  }
  if (Array.isArray(nilai)) {
    if (nilai.length === 0) return <span className="text-gray-500 dark:text-gray-400">—</span>;
    return (
      <ul className="list-disc space-y-1 pl-5">
        {nilai.map((n, i) => (
          <li key={i}>{render(n, kedalaman + 1)}</li>
        ))}
      </ul>
    );
  }
  if (typeof nilai === "object") {
    const pasangan = Object.entries(nilai as Record<string, unknown>);
    if (pasangan.length === 0) return <span className="text-gray-500 dark:text-gray-400">—</span>;
    return (
      <dl className="space-y-2">
        {pasangan.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {labelKunci(k)}
            </dt>
            <dd className="whitespace-pre-wrap break-words text-sm">{render(v, kedalaman + 1)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  if (typeof nilai === "boolean") return <span>{nilai ? "ya" : "tidak"}</span>;
  return <span>{String(nilai)}</span>;
}

/**
 * Render generik isi usulan AI fungsi apa pun, tanpa cabang per kode fungsi: objek menjadi
 * daftar label-nilai, larik menjadi daftar butir, skalar menjadi teks. Rekursif sampai
 * 12 tingkat (selebihnya ditampilkan sebagai JSON). Server Component, tanpa state.
 *
 * @param props - Lihat {@link IsiUsulanProps}.
 */
export function IsiUsulan({ nilai }: IsiUsulanProps) {
  return <div data-testid="isi-usulan">{render(nilai, 0)}</div>;
}
