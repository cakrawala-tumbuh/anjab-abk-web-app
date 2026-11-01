import type { RingkasanYayasanRow } from "@/lib/api/schema";

/**
 * Badge peringatan hitungan atas prioritas final (`peringatan[]` read-model). Tidak
 * merender apa pun bila kosong; teks lengkap tersedia di `title`.
 *
 * @param props.peringatan - Daftar peringatan dari backend.
 */
export function BadgePeringatan({
  peringatan,
}: {
  peringatan: RingkasanYayasanRow["peringatan"] | undefined;
}) {
  if (!peringatan || peringatan.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {peringatan.map((p) => (
        <span
          key={p.kode}
          title={p.pesan}
          className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
        >
          {p.kode}
        </span>
      ))}
    </span>
  );
}
