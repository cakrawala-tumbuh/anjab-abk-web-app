import { teksLencanaVerifikasi } from "@/lib/opm-pengecualian";

/**
 * Lencana peringatan "Belum terverifikasi (N pengecualian)" untuk sesi OPM.
 *
 * @param props.status - `status_verifikasi` sesi.
 * @param props.jumlah - `jumlah_pengecualian` sesi.
 * @returns Lencana untuk `UNVERIFIED`; `null` (tanpa lencana) untuk `VERIFIED`.
 */
export function LencanaVerifikasiOpm({ status, jumlah }: { status: string; jumlah: number }) {
  const teks = teksLencanaVerifikasi(status, jumlah);
  if (!teks) return null;
  return (
    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
      {teks}
    </span>
  );
}
