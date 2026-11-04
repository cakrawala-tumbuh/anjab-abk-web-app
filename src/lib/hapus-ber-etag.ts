import { apiErrorDari } from "@/lib/api/errors";
import { bacaEtag, headerIfMatch, petakanKonkurensi } from "@/lib/konkurensi";

/** Pesan tetap bila baris sudah tidak ada saat dialog hapus hendak dibuka (GET 404). */
export const PESAN_DATA_SUDAH_HILANG =
  "Data ini sudah tidak ada (mungkin dihapus pengguna lain). Daftar dimuat ulang.";

/** Bentuk minimal hasil `openapi-fetch` yang dikonsumsi helper. */
interface HasilApi {
  data?: unknown;
  error?: unknown;
  response: Response;
}

/** Opsi {@link hapusBerEtag}. */
export interface OpsiHapusBerEtag {
  /** `GET` detail rekaman yang akan dihapus (sumber ETag). */
  ambil: () => Promise<HasilApi>;
  /** Dialog konfirmasi; dipanggil SETELAH GET sukses. `false` membatalkan. */
  konfirmasi: () => boolean;
  /** `DELETE` rekaman; menerima objek header `If-Match` yang siap dipakai. */
  hapus: (headers: Record<string, string>) => Promise<HasilApi>;
}

/**
 * Hapus satu rekaman dengan kunci optimistik: GET detail (ETag) → konfirmasi → DELETE `If-Match`.
 *
 * ETag dibaca saat dialog hendak dibuka, sehingga penghapusan hanya berlaku atas keadaan yang
 * dilihat pengguna ketika memutuskan. Error 412 dipetakan ke `PESAN_DATA_BERUBAH`
 * (lewat {@link petakanKonkurensi}) dan dilempar; pemanggil tetap berada di halaman yang sama.
 *
 * @param opsi - Lihat {@link OpsiHapusBerEtag}.
 * @returns `"dihapus"` bila DELETE sukses, `"batal"` bila pengguna membatalkan, `"hilang"`
 *   bila GET menjawab 404 (baris sudah tidak ada; pemanggil menampilkan
 *   {@link PESAN_DATA_SUDAH_HILANG} dan memuat ulang daftar).
 * @throws ApiError bila GET (selain 404) atau DELETE gagal; 412 berpesan baku.
 */
export async function hapusBerEtag(
  opsi: OpsiHapusBerEtag,
): Promise<"dihapus" | "batal" | "hilang"> {
  const got = await opsi.ambil();
  if (got.response?.status === 404) return "hilang";
  if (!got.data) throw apiErrorDari({ error: got.error, response: got.response });
  const etag = bacaEtag(got.response);
  if (!opsi.konfirmasi()) return "batal";
  try {
    const res = await opsi.hapus(headerIfMatch(etag));
    if (res.error) throw apiErrorDari({ error: res.error, response: res.response });
  } catch (err) {
    throw petakanKonkurensi(err);
  }
  return "dihapus";
}
