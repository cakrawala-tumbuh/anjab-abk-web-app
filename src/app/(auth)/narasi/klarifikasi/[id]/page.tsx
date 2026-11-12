import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import {
  KETERANGAN_AKSI,
  METADATA_KLARIFIKASI,
  labelDari,
  teksMetadata,
} from "@/lib/narasi-klarifikasi";
import { fetchKlarifikasi } from "../data";
import { AksiKlarifikasi } from "./aksi-klarifikasi";

export const metadata = { title: "Detail Klarifikasi" };

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Detail satu klarifikasi (Server Component): ke-13 metadata dalam `<dl>` berlabel Indonesia
 * (nama metadata HO dalam kurung), teks pertanyaan, riwayat kronologis, dan panel aksi sesuai
 * state. 404 menjadi `notFound()`; kegagalan lain dilempar ke `error.tsx`.
 */
export default async function DetailKlarifikasiPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const k = await fetchKlarifikasi(session?.accessToken, id);
  if (!k) notFound();
  const riwayat = [...k.riwayat].sort(
    (a, b) => Date.parse(a.terjadi_pada) - Date.parse(b.terjadi_pada),
  );

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500 dark:text-gray-400">
        <Link href="/narasi/klarifikasi" className="hover:underline">
          Klarifikasi
        </Link>{" "}
        / <span>{k.claim_id}</span>
      </nav>
      <h1 className="page-heading">Klarifikasi {k.claim_id}</h1>

      <section aria-labelledby="pertanyaan-klarifikasi" className="space-y-1">
        <h2 id="pertanyaan-klarifikasi" className="text-base font-semibold">
          Pertanyaan (Question_Text)
        </h2>
        <p className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800">
          {k.question_text}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Kasus narasi:{" "}
          <Link href={`/narasi/kasus/${k.narasi_id}`} className="text-blue-600 dark:text-blue-400">
            buka kasus
          </Link>
          {k.ai_usulan_id ? (
            <>
              {" · "}Berasal dari usulan AI{" "}
              <Link
                href={`/ai-usulan/${k.ai_usulan_id}`}
                className="text-blue-600 dark:text-blue-400"
              >
                (buka)
              </Link>
            </>
          ) : null}
        </p>
      </section>

      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[18rem_1fr]">
        {METADATA_KLARIFIKASI.map(({ kunci, label }) => (
          <div key={kunci} className="contents">
            <dt className="text-gray-600 dark:text-gray-400">{label}</dt>
            <dd className="whitespace-pre-wrap break-words">{teksMetadata(k, kunci)}</dd>
          </div>
        ))}
        {k.jawaban_mentah ? (
          <div className="contents">
            <dt className="text-gray-600 dark:text-gray-400">Jawaban mentah</dt>
            <dd className="whitespace-pre-wrap break-words">{k.jawaban_mentah}</dd>
          </div>
        ) : null}
      </dl>

      <section aria-labelledby="riwayat-klarifikasi" className="space-y-2">
        <h2 id="riwayat-klarifikasi" className="text-base font-semibold">
          Riwayat
        </h2>
        {riwayat.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada riwayat.</p>
        ) : (
          <ol className="space-y-2" aria-label="Riwayat klarifikasi">
            {riwayat.map((e) => (
              <li
                key={e.id}
                className="rounded-md border border-gray-200 p-2 text-sm dark:border-gray-700"
              >
                <strong>{labelDari(KETERANGAN_AKSI, e.aksi)}</strong> oleh{" "}
                <span className="break-all">{e.actor_key}</span>,{" "}
                {new Date(e.terjadi_pada).toLocaleString("id-ID")}
                {e.catatan ? (
                  <p className="mt-1 whitespace-pre-wrap">Catatan: {e.catatan}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="aksi-klarifikasi" className="space-y-2">
        <h2 id="aksi-klarifikasi" className="text-base font-semibold">
          Aksi
        </h2>
        <AksiKlarifikasi
          id={k.id}
          reviewerApproval={k.reviewer_approval}
          disposition={k.disposition}
          questionText={k.question_text}
          accessToken={session?.accessToken}
        />
      </section>
    </div>
  );
}
