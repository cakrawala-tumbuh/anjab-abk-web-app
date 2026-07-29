/**
 * Fungsi murni untuk filter master data Uraian Tugas (jabatan / tugas pokok / detil
 * tugas), dipisah dari komponen agar dapat diuji langsung tanpa merender apa pun.
 *
 * Filter hidup di URL (`?jabatan=`, `?tp=`, `?dt=`) — modul ini menerjemahkan
 * `searchParams` mentah menjadi bentuk terstruktur ({@link bacaFilter}), merakitnya
 * jadi domain ala Odoo untuk `POST .../uraian-tugas/search` ({@link domainFilter}),
 * dan menyempitkan opsi dropdown tugas pokok/detil tugas mengikuti hierarki katalog
 * ({@link opsiTugasPokok}, {@link opsiDetilTugas}).
 */
import type { DetilTugasRead, TugasPokokRead } from "@/lib/api/schema";

/** Nilai mentah satu key `searchParams` Next.js (App Router). */
type NilaiQuery = string | string[] | undefined;

/** Filter master data Uraian Tugas yang sedang aktif. `null` berarti tidak difilter. */
export interface FilterUraianTugas {
  jabatanId: string | null;
  tugasPokokId: string | null;
  detilTugasId: string | null;
}

/** Satu kondisi kesetaraan domain ala Odoo (`[field, "=", value]`). */
export type DomainTerm = [string, "=", string];

function bacaSatu(value: NilaiQuery): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw !== undefined && raw.length > 0 ? raw : null;
}

/**
 * Baca filter aktif dari `searchParams` mentah halaman (`?jabatan=`, `?tp=`, `?dt=`).
 *
 * Nilai kosong (string kosong atau tidak ada) dibaca sebagai `null` (tidak difilter).
 * Bila sebuah key muncul berulang di URL, elemen pertama yang dipakai.
 *
 * @param searchParams - `searchParams` Next.js apa adanya (Server Component `page.tsx`
 *   atau prop yang diteruskan ke Client Component).
 */
export function bacaFilter(searchParams: Record<string, NilaiQuery>): FilterUraianTugas {
  return {
    jabatanId: bacaSatu(searchParams.jabatan),
    tugasPokokId: bacaSatu(searchParams.tp),
    detilTugasId: bacaSatu(searchParams.dt),
  };
}

/**
 * Rakit {@link FilterUraianTugas} menjadi domain siap kirim ke
 * `POST /api/v1/task-inventory/uraian-tugas/search`.
 *
 * Hanya filter yang terisi yang menyumbang satu kondisi `[field, "=", id]`; backend
 * menggabungkannya implisit dengan AND (`normalize_domain`). Tanpa filter apa pun →
 * `[]`, identik dengan "tampilkan semua". ID filter yang tidak dikenal (mis. sudah
 * dihapus) tetap dikirim apa adanya — hasilnya 0 baris, bukan kesalahan.
 */
export function domainFilter(filter: FilterUraianTugas): DomainTerm[] {
  const domain: DomainTerm[] = [];
  if (filter.jabatanId) domain.push(["jabatan_id", "=", filter.jabatanId]);
  if (filter.tugasPokokId) domain.push(["tugas_pokok_id", "=", filter.tugasPokokId]);
  if (filter.detilTugasId) domain.push(["detil_tugas_id", "=", filter.detilTugasId]);
  return domain;
}

/**
 * Sempitkan opsi dropdown Tugas Pokok berdasarkan jabatan terpilih.
 *
 * @param tugasPokok - Seluruh tugas pokok (katalog penuh, bukan satu halaman).
 * @param jabatanId - Jabatan yang sedang difilter; `null` → kembalikan seluruh daftar
 *   apa adanya (belum ada penyempitan).
 * @returns Tugas pokok yang `jabatan_ids`-nya memuat `jabatanId`.
 */
export function opsiTugasPokok(
  tugasPokok: TugasPokokRead[],
  jabatanId: string | null,
): TugasPokokRead[] {
  if (!jabatanId) return tugasPokok;
  return tugasPokok.filter((tp) => tp.jabatan_ids.includes(jabatanId));
}

/**
 * Sempitkan opsi dropdown Detil Tugas berdasarkan jabatan dan/atau tugas pokok
 * terpilih.
 *
 * Kedua kondisi berlaku independen dan digabung AND: bila `tugasPokokId` terisi,
 * hanya detil tugas dengan `tugas_pokok_id` itu yang lolos; bila `jabatanId` terisi,
 * hanya detil tugas yang `jabatan_ids`-nya memuat jabatan itu yang lolos. Bila
 * keduanya `null`, seluruh daftar dikembalikan apa adanya.
 *
 * @param detilTugas - Seluruh detil tugas (katalog penuh, bukan satu halaman).
 * @param jabatanId - Jabatan yang sedang difilter, atau `null`.
 * @param tugasPokokId - Tugas pokok yang sedang difilter, atau `null`.
 */
export function opsiDetilTugas(
  detilTugas: DetilTugasRead[],
  jabatanId: string | null,
  tugasPokokId: string | null,
): DetilTugasRead[] {
  return detilTugas.filter((dt) => {
    if (tugasPokokId && dt.tugas_pokok_id !== tugasPokokId) return false;
    if (jabatanId && !dt.jabatan_ids.includes(jabatanId)) return false;
    return true;
  });
}
