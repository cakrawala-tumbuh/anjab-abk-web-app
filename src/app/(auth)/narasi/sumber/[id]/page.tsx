import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { LABEL_JENIS } from "@/lib/narasi-sumber";
import { fetchSumber } from "../data";

export const metadata = { title: "Detail Sumber Narasi" };

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Halaman detail Sumber Narasi (Server Component): metadata, `teks_hash`, dan `teks` utuh.
 *
 * Tidak ada aksi ubah/hapus (baris tak berubah). Satu-satunya aksi adalah "Revisi", yang
 * membuka formulir tambah dengan `?menggantikan=<id>` — hasilnya baris baru. 404 → halaman
 * tidak ditemukan; kegagalan lain dilempar ke `error.tsx`.
 */
export default async function DetailSumberPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const s = await fetchSumber(session?.accessToken, id);
  if (!s) notFound();

  const baris: Array<[string, React.ReactNode]> = [
    [
      "Source_ID",
      <span key="id" className="font-mono text-xs">
        {s.id}
      </span>,
    ],
    ["Jenis", LABEL_JENIS[s.jenis]],
    ["Versi", s.versi],
    ["Periode", s.periode],
    [
      "Hash teks (SHA-256)",
      <span key="h" className="font-mono text-xs break-all">
        {s.teks_hash}
      </span>,
    ],
    ["Izin AI", s.izin_ai ? "Ya" : "Tidak"],
    ["Catatan izin", s.izin_catatan ?? "—"],
    [
      "Menggantikan",
      s.menggantikan_id ? (
        <Link
          key="m"
          href={`/narasi/sumber/${s.menggantikan_id}`}
          className="font-mono text-xs text-blue-600 dark:text-blue-400"
        >
          {s.menggantikan_id}
        </Link>
      ) : (
        "—"
      ),
    ],
    ["Dibuat oleh", s.dibuat_oleh],
    ["Dibuat pada", new Date(s.created_at).toLocaleString("id-ID")],
  ];

  return (
    <div className="space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500 dark:text-gray-400">
        <Link href="/narasi/sumber" className="hover:underline">
          Sumber Narasi
        </Link>{" "}
        / <span>{s.judul}</span>
      </nav>
      <div className="flex items-center justify-between gap-3">
        <h1 className="page-heading">{s.judul}</h1>
        <Link
          href={`/narasi/sumber/tambah?menggantikan=${s.id}`}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Revisi
        </Link>
      </div>
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[12rem_1fr]">
        {baris.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-gray-600 dark:text-gray-400">{k}</dt>
            <dd className="whitespace-normal break-words">{v}</dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="teks-sumber" className="space-y-2">
        <h2 id="teks-sumber" className="text-base font-semibold">
          Teks sumber
        </h2>
        <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800">
          {s.teks}
        </pre>
      </section>
    </div>
  );
}
