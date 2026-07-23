import Link from "next/link";

/**
 * Ukuran halaman tetap untuk seluruh list web app. Nomor halaman 1-berbasis.
 * Tidak ada pemilih ukuran di UI (di luar lingkup paginasi ini).
 */
export const UKURAN_HALAMAN = 20;

type NilaiQuery = string | string[] | undefined;

/**
 * Terjemahkan nilai query `?<key>=` menjadi nomor halaman 1-berbasis yang aman.
 * Nilai kosong / non-angka / < 1 selalu jatuh ke halaman 1.
 */
export function nomorHalaman(value: NilaiQuery): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/**
 * `offset` server-side untuk sebuah key halaman, dihitung dari `searchParams`.
 * `offset = (halaman - 1) * UKURAN_HALAMAN`.
 */
export function offsetHalaman(searchParams: Record<string, NilaiQuery>, paramKey: string): number {
  return (nomorHalaman(searchParams[paramKey]) - 1) * UKURAN_HALAMAN;
}

interface PaginationProps {
  /** Total baris sebenarnya menurut backend (`Page.total`), bukan `items.length`. */
  total: number;
  /** Offset baris halaman yang sedang ditampilkan (`Page.offset`). */
  offset: number;
  /** Ukuran halaman (baris per halaman). */
  pageSize: number;
  /** Nama query URL untuk tabel ini (mis. `hlm`, `hlm_responden`) — unik per tabel. */
  paramKey: string;
  /** Path halaman tanpa query (mis. `/dcs`, `/opm/123`). */
  basePath: string;
  /** `searchParams` halaman saat ini — query lain dipertahankan di setiap href. */
  searchParams: Record<string, NilaiQuery>;
}

function buildHref(
  basePath: string,
  searchParams: Record<string, NilaiQuery>,
  paramKey: string,
  halaman: number,
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) sp.append(key, item);
    } else {
      sp.set(key, value);
    }
  }
  sp.set(paramKey, String(halaman));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

const KELAS_AKTIF =
  "rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800";
const KELAS_NONAKTIF =
  "rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-300 dark:border-gray-700 dark:text-gray-600 cursor-not-allowed";

/**
 * Kontrol paginasi Prev/Next + teks rentang, digerakkan URL (Server Component).
 *
 * Tidak merender apa pun bila `total <= pageSize` (satu halaman). Navigasi memakai
 * `<Link>` ke `?<paramKey>=n` sambil mempertahankan query lain; tombol batas
 * (Sebelumnya di halaman 1, Berikutnya di halaman terakhir) tampil nonaktif.
 */
export function Pagination({
  total,
  offset,
  pageSize,
  paramKey,
  basePath,
  searchParams,
}: PaginationProps) {
  if (total <= pageSize) return null;

  const halamanIni = Math.floor(offset / pageSize) + 1;
  const totalHalaman = Math.max(1, Math.ceil(total / pageSize));
  const mulai = total === 0 ? 0 : offset + 1;
  const selesai = Math.min(offset + pageSize, total);
  const adaSebelumnya = halamanIni > 1;
  const adaBerikutnya = halamanIni < totalHalaman;

  return (
    <nav
      aria-label="Navigasi halaman"
      className="flex flex-wrap items-center justify-between gap-3 pt-2"
    >
      <p className="text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
        {`Menampilkan ${mulai}–${selesai} dari ${total}`}
      </p>
      <div className="flex items-center gap-2">
        {adaSebelumnya ? (
          <Link
            href={buildHref(basePath, searchParams, paramKey, halamanIni - 1)}
            rel="prev"
            className={KELAS_AKTIF}
          >
            ‹ Sebelumnya
          </Link>
        ) : (
          <span aria-disabled="true" className={KELAS_NONAKTIF}>
            ‹ Sebelumnya
          </span>
        )}
        <span className="px-1 text-sm text-gray-500 dark:text-gray-400">
          Hal. {halamanIni}/{totalHalaman}
        </span>
        {adaBerikutnya ? (
          <Link
            href={buildHref(basePath, searchParams, paramKey, halamanIni + 1)}
            rel="next"
            className={KELAS_AKTIF}
          >
            Berikutnya ›
          </Link>
        ) : (
          <span aria-disabled="true" className={KELAS_NONAKTIF}>
            Berikutnya ›
          </span>
        )}
      </div>
    </nav>
  );
}
