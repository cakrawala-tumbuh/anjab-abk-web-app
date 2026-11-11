/**
 * Notifikasi toast untuk hasil operasi penyimpanan data.
 *
 * Setiap mutasi (POST/PATCH/PUT/DELETE) wajib memanggil `notifySukses` pada jalur
 * sukses dan `notifyGagal` pada jalur gagal.
 *
 * Pada form panjang, toast dipakai BERDAMPINGAN dengan error inline — bukan
 * sebagai pengganti. Pesan error di form panjang tidak boleh hilang sendiri.
 *
 * Komponen tidak boleh memanggil `toast.*` dari `sonner` secara langsung; semua
 * lewat helper di berkas ini.
 */
import { toast } from "sonner";
import { ApiError, fieldKurang } from "@/lib/api/errors";

export function notifySukses(pesan: string): void {
  toast.success(pesan);
}

/**
 * Pesan siap-tampil dari error apa pun. Dipakai juga untuk mengisi error inline.
 *
 * Galat 422 `validation_error` yang `details`-nya menyebut kolom menjadi
 * `Isian tidak sah pada kolom: <f1>, <f2>.` (nama field mentah); selain itu memakai
 * `message` galat apa adanya.
 *
 * @param err - Error apa pun yang ditangkap `catch`.
 * @returns Pesan Bahasa Indonesia siap tampil.
 */
export function pesanGagal(err: unknown): string {
  if (err instanceof ApiError && err.status === 422 && err.code === "validation_error") {
    const f = fieldKurang(err);
    if (f.length > 0) return `Isian tidak sah pada kolom: ${f.join(", ")}.`;
  }
  if (err instanceof Error) return err.message;
  return "Terjadi kesalahan.";
}

export function notifyGagal(err: unknown): void {
  const requestId = err instanceof ApiError ? err.requestId : null;
  toast.error(pesanGagal(err), {
    description: requestId ? `ID permintaan: ${requestId}` : undefined,
    // Error tidak boleh hilang sendiri — user yang menutupnya.
    duration: Infinity,
  });
}
