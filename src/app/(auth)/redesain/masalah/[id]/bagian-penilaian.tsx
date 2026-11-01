import type { MasalahRead } from "@/lib/api/schema";
import { fetchPenilaianMasalah, fetchSebaranK } from "./data-penilaian";
import { FormPenilaian } from "./form-penilaian";
import { MulaiPenilaian } from "./mulai-penilaian";
import { PanelKeputusan } from "./panel-keputusan";
import { PilihStatus } from "./pilih-status";
import { TabelSebaran } from "./tabel-sebaran";

/** Properti {@link BagianPenilaian}. */
export interface BagianPenilaianProps {
  masalah: MasalahRead;
  accessToken: string | undefined;
}

/**
 * Bagian "Penilaian" pada detail masalah (Server Component async).
 *
 * Tanpa penilaian → tombol "Mulai penilaian"; ada → form ubah dengan saran sistem
 * berdampingan, panel keputusan prioritas final, pilihan status, dan sebaran K1–K4.
 * Kegagalan pengambilan data (mis. 403) dilempar ke `error.tsx`.
 *
 * @param props - Lihat {@link BagianPenilaianProps}.
 */
export async function BagianPenilaian({ masalah, accessToken }: BagianPenilaianProps) {
  const penilaian = await fetchPenilaianMasalah(accessToken, masalah.id);
  const sebaran = await fetchSebaranK(accessToken, masalah.id);
  return (
    <section aria-label="Penilaian" className="space-y-3">
      {penilaian ? (
        <>
          <FormPenilaian key={penilaian.updated_at} awal={penilaian} accessToken={accessToken} />
          <PanelKeputusan penilaian={penilaian} accessToken={accessToken} />
          <PilihStatus
            penilaianId={penilaian.id}
            statusSaatIni={penilaian.status_penilaian}
            accessToken={accessToken}
          />
        </>
      ) : (
        <MulaiPenilaian masalahId={masalah.id} accessToken={accessToken} />
      )}
      <TabelSebaran sebaran={sebaran} />
    </section>
  );
}
