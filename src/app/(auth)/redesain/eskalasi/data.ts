/**
 * Pengambilan data halaman Eskalasi (jalur BACA: gagal → melempar).
 */
import { UKURAN_HALAMAN } from "@/components/pagination";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { KonteksRead, MasalahRead, SekolahRead } from "@/lib/api/schema";
import { DOMAIN_ESKALASI, URUTAN_ESKALASI } from "@/lib/redesain-konfirmasi-tim";
import { semuaKonteks, semuaSekolah } from "../masalah/data";

/** Data halaman daftar eskalasi. */
export interface DataEskalasi {
  masalah: MasalahRead[];
  total: number;
  konteks: KonteksRead[];
  sekolah: SekolahRead[];
}

/**
 * Ambil satu halaman masalah tereskalasi (`POST .../masalah/search`, domain
 * `eskalasi_pada != null`, terbaru dulu) beserta konteks dan sekolah untuk label.
 *
 * @param accessToken - Token akses sesi.
 * @param offset - Offset halaman.
 * @throws ApiError bila salah satu panggilan gagal.
 */
export async function fetchEskalasi(
  accessToken: string | undefined,
  offset: number,
): Promise<DataEskalasi> {
  const client = withServerAuth(accessToken);
  const [res, konteks, sekolah] = await Promise.all([
    client.POST("/api/v1/redesain/masalah/search", {
      body: { domain: DOMAIN_ESKALASI, order: URUTAN_ESKALASI, limit: UKURAN_HALAMAN, offset },
    }),
    semuaKonteks(client),
    semuaSekolah(client),
  ]);
  if (!res.data) throw apiErrorDari(res);
  return { masalah: res.data.items, total: res.data.total, konteks, sekolah };
}
