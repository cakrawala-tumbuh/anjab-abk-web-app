"use client";

import type { PenilaianRead } from "@/lib/api/schema";
import {
  KODE_BERBEDA_DARI_SARAN,
  KODE_PRIORITAS_TANPA_BUKTI,
  labelPemutus,
} from "@/lib/redesain-keputusan";
import { DialogPutuskan } from "./dialog-putuskan";

/** Properti {@link PanelKeputusan}. */
export interface PanelKeputusanProps {
  penilaian: PenilaianRead;
  accessToken: string | undefined;
}

/**
 * Panel keputusan prioritas final: saran otomatis berdampingan dengan keputusan Tim Kajian.
 *
 * Menampilkan `peringatan[]` dari respons backend sebagai sumber kebenaran:
 * `PRIORITAS_TANPA_BUKTI` → kotak peringatan, `BERBEDA_DARI_SARAN` → badge "Berbeda dari
 * saran". Pemutus tampil sebagai kode + jabatan, tanpa nama.
 *
 * @param props - Lihat {@link PanelKeputusanProps}.
 */
export function PanelKeputusan({ penilaian, accessToken }: PanelKeputusanProps) {
  const peringatan = penilaian.peringatan ?? [];
  const berbeda = peringatan.some((p) => p.kode === KODE_BERBEDA_DARI_SARAN);
  const lain = peringatan.filter((p) => p.kode !== KODE_BERBEDA_DARI_SARAN);
  const sudah = Boolean(penilaian.prioritas_final);

  return (
    <section aria-label="Keputusan prioritas" className="space-y-2 rounded-lg border p-3">
      <h3 className="text-sm font-semibold">Keputusan prioritas</h3>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-gray-500">Saran otomatis</p>
          <p className="font-semibold">{penilaian.saran_otomatis ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500">Prioritas final</p>
          <p className="font-semibold">
            {penilaian.prioritas_final ?? "Belum diputuskan"}
            {berbeda && (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                Berbeda dari saran
              </span>
            )}
          </p>
        </div>
      </div>
      {sudah && (
        <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-xs text-gray-500">Alasan</dt>
            <dd className="whitespace-pre-wrap break-words">{penilaian.alasan_final}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Pemutus</dt>
            <dd>{labelPemutus(penilaian)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Tanggal keputusan</dt>
            <dd>{penilaian.tanggal_keputusan ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Saran saat keputusan</dt>
            <dd>{penilaian.saran_saat_keputusan ?? "—"}</dd>
          </div>
        </dl>
      )}
      {lain.map((p) => (
        <p
          key={p.kode}
          role="alert"
          data-kode={p.kode}
          className="rounded-md bg-amber-50 p-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
        >
          {p.kode === KODE_PRIORITAS_TANPA_BUKTI ? `Peringatan: ${p.pesan}` : p.pesan}
        </p>
      ))}
      <DialogPutuskan penilaian={penilaian} accessToken={accessToken} />
    </section>
  );
}
