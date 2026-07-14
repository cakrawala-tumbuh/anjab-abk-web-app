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
import { ApiError } from "@/lib/api/errors";

export function notifySukses(pesan: string): void {
  toast.success(pesan);
}

/** Pesan siap-tampil dari error apa pun. Dipakai juga untuk mengisi error inline. */
export function pesanGagal(err: unknown): string {
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
