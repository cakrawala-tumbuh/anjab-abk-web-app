/**
 * Pengambilan data halaman Cakupan 19 Jabatan (jalur BACA: gagal → melempar).
 */
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import type { CakupanJabatanRead, JabatanRead } from "@/lib/api/schema";

/** Data inti halaman `/redesain/cakupan-jabatan`. */
export interface DataCakupan {
  cakupan: CakupanJabatanRead[];
  jabatan: JabatanRead[];
}

/**
 * Ambil seluruh record cakupan dan master jabatan (satu-satunya sumber pilihan jabatan).
 *
 * @param accessToken - Token akses sesi.
 * @returns Record cakupan dan jabatan.
 * @throws ApiError bila salah satu panggilan gagal (tidak pernah daftar kosong).
 */
export async function fetchDataCakupan(accessToken: string | undefined): Promise<DataCakupan> {
  const client = withServerAuth(accessToken);
  const [cakupan, jabatan] = await Promise.all([
    ambilSemuaHalaman<CakupanJabatanRead>(async (limit, offset) => {
      const res = await client.GET("/api/v1/redesain/cakupan-jabatan", {
        params: { query: { limit, offset } },
      });
      if (!res.data) throw apiErrorDari(res);
      return { items: res.data.items, total: res.data.total };
    }),
    ambilSemuaHalaman<JabatanRead>(async (limit, offset) => {
      const res = await client.GET("/api/v1/jabatan", { params: { query: { limit, offset } } });
      if (!res.data) throw apiErrorDari(res);
      return { items: res.data.items, total: res.data.total };
    }),
  ]);
  return { cakupan, jabatan };
}
