/**
 * Pengambilan data halaman daftar masalah sekolah (jalur BACA: gagal → melempar).
 */
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import type { KonfirmasiDaftarRead, MasalahSekolahRead } from "@/lib/api/schema";

/** Data inti halaman `/redesain-sekolah`. */
export interface DaftarMasalahSekolah {
  masalah: MasalahSekolahRead[];
  konfirmasi: KonfirmasiDaftarRead[];
}

/**
 * Ambil masalah sekolah yang dibuka dan konfirmasi milik pemanggil.
 *
 * Keduanya data inti: kegagalan apa pun (401/403/5xx) melempar `ApiError`, tidak pernah
 * menjadi daftar kosong. Rumusan dugaan TIDAK ada di respons `sekolah/masalah`.
 *
 * @param accessToken - Token akses sesi.
 * @returns Daftar masalah dan daftar konfirmasi milik sendiri.
 * @throws ApiError bila salah satu panggilan gagal.
 */
export async function fetchDaftarMasalahSekolah(
  accessToken: string | undefined,
): Promise<DaftarMasalahSekolah> {
  const client = withServerAuth(accessToken);
  const [masalah, konfirmasi] = await Promise.all([
    ambilSemuaHalaman<MasalahSekolahRead>(async (limit, offset) => {
      const res = await client.GET("/api/v1/redesain/sekolah/masalah", {
        params: { query: { limit, offset } },
      });
      if (!res.data) throw apiErrorDari(res);
      return { items: res.data.items, total: res.data.total };
    }),
    ambilSemuaHalaman<KonfirmasiDaftarRead>(async (limit, offset) => {
      const res = await client.GET("/api/v1/redesain/konfirmasi/saya", {
        params: { query: { limit, offset } },
      });
      if (!res.data) throw apiErrorDari(res);
      return { items: res.data.items, total: res.data.total };
    }),
  ]);
  return { masalah, konfirmasi };
}
