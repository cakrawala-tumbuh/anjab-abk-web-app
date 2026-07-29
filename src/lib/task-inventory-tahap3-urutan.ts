/**
 * Pengurutan task Tahap 3 — Detailing berdasar hierarki katalog Task Inventory.
 *
 * `GET /task-inventory/sesi/{sesi_id}/task-terpilih` mengurutkan hasilnya
 * `(-n_relevan, kode)` di backend (`compute_task_terpilih`) — relevansi menurun
 * lalu kode hash (`TIf0b59714`). Urutan itu bermakna untuk tabel admin "Task
 * relevan terpilih" (peringkat relevansi), tapi membuat task dari tugas pokok
 * yang sama berserakan di layar Tahap 3, padahal Tahap 1 sudah menyajikan
 * hierarki tugas pokok → detil tugas → uraian tugas. Modul ini menata ulang
 * daftar itu **di web app** (bukan backend) khusus untuk konsumsi Tahap 3, agar
 * responden mengisi 5 komponen CalHR dengan konteks hierarki yang utuh.
 *
 * Dipanggil **sekali** di Server Component (`page.tsx`) sebelum diteruskan ke
 * `<DetailForm>` sebagai prop `tasks` — komponen itu sendiri tidak menyortir.
 */
import type { TiTaskTerpilihRead } from "@/lib/api/schema";

/**
 * Urutkan task Tahap 3 secara berjenjang: `tugas_pokok` → `detil_tugas` →
 * `uraian_tugas` → `kode`, memakai `localeCompare` per level.
 *
 * **Tidak memutasi** `tasks` — argumen disalin (`[...tasks]`) sebelum `sort()`.
 * `kode` adalah pemutus terakhir agar urutan tetap deterministik saat tiga
 * field pertama identik pada dua task berbeda.
 *
 * Task dengan `detil_tugas` kosong (`""` — backend mengirimnya untuk task yang
 * menggantung langsung di bawah tugas pokok, tanpa detil tugas) tampil
 * **paling atas** dalam tugas pokoknya: konsekuensi wajar `"" < teks apa pun`
 * pada `localeCompare`, bukan kasus khusus yang ditangani terpisah.
 *
 * Perbandingan memakai `?? ""` (bukan mengandalkan kontrak `string`) supaya
 * `null`/`undefined` yang tak terduga pada respons backend tidak melempar saat
 * `localeCompare` dipanggil.
 *
 * @param tasks - Daftar task terpilih, urutan apa pun (mis. hasil
 *   `(-n_relevan, kode)` dari backend).
 * @returns Salinan `tasks` yang sudah terurut hierarkis. Array kosong masukan
 *   menghasilkan array kosong.
 */
export function urutkanTaskTahap3(tasks: TiTaskTerpilihRead[]): TiTaskTerpilihRead[] {
  return [...tasks].sort((a, b) => {
    return (
      (a.tugas_pokok ?? "").localeCompare(b.tugas_pokok ?? "") ||
      (a.detil_tugas ?? "").localeCompare(b.detil_tugas ?? "") ||
      (a.uraian_tugas ?? "").localeCompare(b.uraian_tugas ?? "") ||
      (a.kode ?? "").localeCompare(b.kode ?? "")
    );
  });
}
