import type { SignoffRead, StatusProtokol } from "@/lib/api/schema";
import { formatUkuran, pathUnduhSignoff } from "@/lib/riset-signoff";
import { SignoffForm } from "./signoff-form";

const waktu = (v: string) => new Date(v).toLocaleString("id-ID");
const tanggal = (v: string) =>
  new Date(`${v}T00:00:00`).toLocaleDateString("id-ID", { dateStyle: "long" });

/** Properti {@link BagianSignoff}. */
export interface BagianSignoffProps {
  /** ID protokol. */
  protokolId: string;
  /** Status protokol (`DRAF` → belum bisa dicatat). */
  status: StatusProtokol;
  /** Metadata sign-off bila sudah ada (`signoff_ada=true`), selain itu `null`. */
  signoff: SignoffRead | null;
}

/**
 * Bagian "Sign-off PI/etik" pada detail protokol (Server Component, tanpa hook).
 *
 * `DRAF` → teks "Kunci protokol dulu"; `TERKUNCI` tanpa sign-off → {@link SignoffForm};
 * `TERKUNCI` dengan sign-off → `<dl>` metadata + tautan unduh PDF (Route Handler berBearer
 * sesi server). Tidak ada aksi ubah/hapus/ganti.
 *
 * @param props - Lihat {@link BagianSignoffProps}.
 */
export function BagianSignoff({ protokolId, status, signoff }: BagianSignoffProps) {
  const baris: Array<[string, React.ReactNode]> = signoff
    ? [
        ["Nama PI", signoff.pi_nama],
        ["Tanggal persetujuan etik", tanggal(signoff.tanggal_persetujuan_etik)],
        ["Nomor persetujuan", signoff.nomor_persetujuan_etik ?? "—"],
        ["Berkas", `${signoff.lampiran_nama} (${formatUkuran(signoff.lampiran_ukuran)})`],
        [
          "SHA-256 berkas",
          <span key="h" className="font-mono text-xs break-all">
            {signoff.lampiran_sha256}
          </span>,
        ],
        ["Dicatat oleh", signoff.dicatat_oleh],
        ["Dicatat pada", waktu(signoff.created_at)],
      ]
    : [];

  return (
    <section aria-labelledby="h-signoff" className="space-y-3">
      <h2 id="h-signoff" className="text-base font-semibold">
        Sign-off PI/etik
      </h2>
      {status !== "TERKUNCI" ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Kunci protokol dulu untuk mencatat sign-off PI/etik.
        </p>
      ) : signoff ? (
        <>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[12rem_1fr]">
            {baris.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-gray-600 dark:text-gray-400">{k}</dt>
                <dd className="whitespace-normal break-words">{v}</dd>
              </div>
            ))}
          </dl>
          <a
            href={pathUnduhSignoff(protokolId)}
            download
            className="inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Unduh PDF persetujuan etik
          </a>
        </>
      ) : (
        <SignoffForm protokolId={protokolId} />
      )}
    </section>
  );
}
