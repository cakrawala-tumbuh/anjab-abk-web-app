import type { MasalahRead, SekolahRead } from "@/lib/api/schema";
import { fetchKonfirmasiMasalah, fetchKonteksPilihan } from "./data-konfirmasi";
import { FormLuring } from "./form-luring";
import { TabelKonfirmasi } from "./tabel-konfirmasi";

/** Properti {@link BagianKonfirmasi}. */
export interface BagianKonfirmasiProps {
  masalah: MasalahRead;
  sekolah: SekolahRead[];
  accessToken: string | undefined;
}

/**
 * Bagian "Konfirmasi" pada detail masalah (Server Component async).
 *
 * Tabel read-only seluruh konfirmasi masalah (versi digantikan tersembunyi secara
 * default), dialog angkat masalah, dan form isian luring. Kegagalan pengambilan data
 * (mis. 403) dilempar ke `error.tsx`.
 *
 * @param props - Lihat {@link BagianKonfirmasiProps}.
 */
export async function BagianKonfirmasi({ masalah, sekolah, accessToken }: BagianKonfirmasiProps) {
  const [konfirmasi, konteks] = await Promise.all([
    fetchKonfirmasiMasalah(accessToken, masalah.id),
    fetchKonteksPilihan(accessToken),
  ]);
  return (
    <section aria-label="Konfirmasi" className="space-y-3">
      <div className="flex justify-end">
        <FormLuring masalah={masalah} sekolah={sekolah} accessToken={accessToken} />
      </div>
      <TabelKonfirmasi konfirmasi={konfirmasi} konteks={konteks} accessToken={accessToken} />
    </section>
  );
}
