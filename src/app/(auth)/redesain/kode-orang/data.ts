/**
 * Pengambilan data halaman Kode Orang (jalur BACA: gagal → melempar).
 */
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import type { KodeOrangRead, PartisipanRead } from "@/lib/api/schema";

/** Data inti halaman `/redesain/kode-orang`. */
export interface DataKodeOrang {
  kodeOrang: KodeOrangRead[];
  partisipan: PartisipanRead[];
}

/**
 * Ambil seluruh kode orang dan master partisipan (untuk nama dan pilihan pada form tambah).
 *
 * Keduanya data inti: kegagalan apa pun melempar `ApiError`, tidak pernah daftar kosong.
 *
 * @param accessToken - Token akses sesi.
 * @returns Kode orang dan partisipan.
 * @throws ApiError bila salah satu panggilan gagal.
 */
export async function fetchDataKodeOrang(accessToken: string | undefined): Promise<DataKodeOrang> {
  const client = withServerAuth(accessToken);
  const [kodeOrang, partisipan] = await Promise.all([
    ambilSemuaHalaman<KodeOrangRead>(async (limit, offset) => {
      const res = await client.GET("/api/v1/redesain/kode-orang", {
        params: { query: { limit, offset } },
      });
      if (!res.data) throw apiErrorDari(res);
      return { items: res.data.items, total: res.data.total };
    }),
    ambilSemuaHalaman<PartisipanRead>(async (limit, offset) => {
      const res = await client.GET("/api/v1/partisipan", { params: { query: { limit, offset } } });
      if (!res.data) throw apiErrorDari(res);
      return { items: res.data.items, total: res.data.total };
    }),
  ]);
  return { kodeOrang, partisipan };
}
