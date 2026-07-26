/**
 * Kandidat responden Task Inventory — pengurangan partisipan yang sudah
 * menjadi responden dari daftar kandidat penambahan.
 *
 * Layar detail sesi Task Inventory (`task-inventory/[sesi_id]/page.tsx`) menawarkan
 * anggota SME panel sebagai kandidat responden baru lewat dua kontrol (penambahan
 * satuan `TambahResponden` dan massal `AssignRespondenBanyak`). Sebelum backlog ini,
 * daftar kandidat hanya disaring berdasarkan keanggotaan panel — partisipan yang
 * sudah menjadi responden sesi itu tetap ditawarkan lagi, sehingga orang yang sama
 * bisa ditambahkan dua kali (terbukti di produksi, audit R3 2026-07-26).
 *
 * Fungsi ini diekstrak murni (tanpa fetch, tanpa I/O) agar dapat diuji Vitest
 * langsung — logika di dalam Server Component (`page.tsx`) tidak bisa diuji unit.
 */
import type { PartisipanRead, TiRespondenRead } from "@/lib/api/schema";

/**
 * Partisipan yang belum menjadi responden sesi Task Inventory.
 *
 * Dipanggil **satu kali** di Server Component (`page.tsx`); hasilnya dioper ke
 * kedua kontrol penambahan responden (`TambahResponden` dan
 * `AssignRespondenBanyak`) sebagai satu-satunya sumber kebenaran daftar kandidat
 * — kedua Client Component itu tidak menyaring sendiri.
 *
 * @param partisipan - Kandidat awal, sudah disaring berdasarkan keanggotaan SME panel.
 * @param responden - Seluruh responden sesi (`respondenAll`, seluruh halaman — bukan
 *   satu halaman paginasi), termasuk responden manual yang `partisipan_id`-nya `null`.
 * @returns Subset `partisipan` yang `id`-nya tidak muncul sebagai `partisipan_id`
 *   pada `responden` mana pun. Urutan `partisipan` masukan dipertahankan.
 */
export function kandidatResponden(
  partisipan: PartisipanRead[],
  responden: TiRespondenRead[],
): PartisipanRead[] {
  const sudahJadiResponden = new Set(
    responden.map((r) => r.partisipan_id).filter((id): id is string => !!id),
  );
  return partisipan.filter((p) => !sudahJadiResponden.has(p.id));
}
