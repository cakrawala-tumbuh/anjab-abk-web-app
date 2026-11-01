import type { MasalahRead } from "@/lib/api/schema";
import { fetchPenilaianMasalah } from "./data-penilaian";
import { FormPenilaian } from "./form-penilaian";
import { MulaiPenilaian } from "./mulai-penilaian";

/** Properti {@link BagianPenilaian}. */
export interface BagianPenilaianProps {
  masalah: MasalahRead;
  accessToken: string | undefined;
}

/**
 * Bagian "Penilaian" pada detail masalah (Server Component async).
 *
 * Tanpa penilaian → tombol "Mulai penilaian"; ada → form ubah dengan saran sistem
 * berdampingan. Kegagalan pencarian (mis. 403) dilempar ke `error.tsx`.
 *
 * @param props - Lihat {@link BagianPenilaianProps}.
 */
export async function BagianPenilaian({ masalah, accessToken }: BagianPenilaianProps) {
  const penilaian = await fetchPenilaianMasalah(accessToken, masalah.id);
  return (
    <section aria-label="Penilaian" className="space-y-3">
      {penilaian ? (
        <FormPenilaian key={penilaian.updated_at} awal={penilaian} accessToken={accessToken} />
      ) : (
        <MulaiPenilaian masalahId={masalah.id} accessToken={accessToken} />
      )}
    </section>
  );
}
