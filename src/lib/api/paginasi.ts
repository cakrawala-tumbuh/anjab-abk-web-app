/**
 * Pengambilan daftar BERPAGINASI dari backend tanpa terpotong diam-diam.
 *
 * Backend memaginasi setiap endpoint koleksi ke bentuk `Page[T]`
 * (`{ items, total, limit, offset }`) dan mematok `limit.maximum = 500`
 * (`openapi.json`). Kode yang meminta `limit: 500` sekali jalan karena itu
 * **bukan** "ambil semua" — begitu koleksi melewati 500 baris, sisanya hilang
 * tanpa pesan apa pun. Efeknya berbahaya justru pada agregat: himpunan dedup
 * "partisipan yang sudah ditugaskan" ikut terpotong sehingga orang yang sudah
 * jadi responden muncul lagi sebagai kandidat.
 *
 * Modul ini menyediakan satu-satunya cara yang benar untuk "ambil seluruh
 * koleksi": panggil halaman demi halaman sampai `total` tercapai.
 */

/** Ukuran halaman maksimum yang diterima backend (`limit.maximum` di `openapi.json`). */
export const LIMIT_MAKS = 500;

/** Pagar aman: jumlah iterasi maksimum sebelum dianggap tidak wajar/berputar. */
export const MAKS_HALAMAN = 50;

/** Satu halaman hasil sebagaimana dikembalikan backend (`Page[T]`, bagian yang dipakai). */
export interface HalamanHasil<T> {
  /** Item pada halaman ini. */
  items: T[];
  /** Total item tersedia menurut backend — bukan `items.length`. */
  total: number;
}

/**
 * Callback pengambil SATU halaman.
 *
 * Implementasinya wajib melempar bila responsnya gagal (mis.
 * `if (!res.data) throw apiErrorDari(res)`) — helper ini sengaja tidak
 * menangkap error apa pun.
 */
export type AmbilHalaman<T> = (limit: number, offset: number) => Promise<HalamanHasil<T>>;

/**
 * Ambil SELURUH item sebuah koleksi berpaginasi dengan memanggil `ambil`
 * berulang kali (`limit = 500`) sampai `total` backend tercapai.
 *
 * Error dari `ambil` **diteruskan apa adanya** — tidak ditelan menjadi `[]`.
 * Ini invariant jalur baca repo ini (lihat `src/lib/api/errors.ts` dan
 * `src/test/jaring-pengaman-jalur-baca.test.ts`): daftar kosong hasil kegagalan
 * tidak boleh tak terbedakan dari daftar yang memang kosong.
 *
 * @param ambil - Pengambil satu halaman; menerima `(limit, offset)` dan
 *   mengembalikan `{ items, total }`.
 * @param limit - Ukuran halaman per panggilan. Default `LIMIT_MAKS` (500).
 * @returns Seluruh item dari semua halaman, berurutan sesuai urutan backend.
 * @throws Error bila iterasi melewati {@link MAKS_HALAMAN} halaman, atau bila
 *   sebuah halaman mengembalikan 0 item padahal `total` belum tercapai
 *   (backend tidak konsisten — lebih baik gagal keras daripada mengembalikan
 *   daftar yang diam-diam terpotong).
 * @throws Apa pun yang dilempar `ambil` (mis. `ApiError` dari `apiErrorDari`).
 *
 * @example
 * ```ts
 * const partisipan = await ambilSemuaHalaman<PartisipanRead>(async (limit, offset) => {
 *   const res = await client.GET("/api/v1/partisipan", { params: { query: { limit, offset } } });
 *   if (!res.data) throw apiErrorDari(res);
 *   return { items: res.data.items ?? [], total: res.data.total };
 * });
 * ```
 */
export async function ambilSemuaHalaman<T>(
  ambil: AmbilHalaman<T>,
  limit: number = LIMIT_MAKS,
): Promise<T[]> {
  const terkumpul: T[] = [];
  let iterasi = 0;

  for (;;) {
    if (iterasi >= MAKS_HALAMAN) {
      throw new Error(
        `ambilSemuaHalaman: melewati ${MAKS_HALAMAN} halaman (limit ${limit}); ` +
          "dihentikan agar tidak berputar tanpa henti.",
      );
    }
    const { items, total } = await ambil(limit, terkumpul.length);
    iterasi += 1;
    terkumpul.push(...items);
    if (terkumpul.length >= total) return terkumpul;
    if (items.length === 0) {
      throw new Error(
        `ambilSemuaHalaman: halaman offset ${terkumpul.length} kosong padahal baru ` +
          `${terkumpul.length} dari ${total} item terkumpul.`,
      );
    }
  }
}
