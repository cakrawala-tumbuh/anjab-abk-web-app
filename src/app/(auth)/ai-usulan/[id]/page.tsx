import Link from "next/link";
import { notFound } from "next/navigation";
import { IsiUsulan } from "@/components/isi-usulan";
import { auth } from "@/lib/auth/auth";
import { hrefSasaran, labelFungsi, labelHasilSerap, labelSasaran } from "@/lib/ai-usulan";
import { fetchDetailUsulan } from "../data";
import { PutusanForm } from "./putusan-form";

export const metadata = { title: "Detail Usulan AI" };

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Detail satu usulan AI (Server Component): metadata, amplop keluaran, `isi` (render generik
 * lewat {@link IsiUsulan}, tanpa cabang per fungsi), riwayat putusan, dan form putusan.
 * 404 menjadi `notFound()`; kegagalan lain dilempar ke `error.tsx`.
 */
export default async function DetailUsulanPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const u = await fetchDetailUsulan(session?.accessToken, id);
  if (!u) notFound();
  const href = hrefSasaran(u.sasaran_jenis, u.sasaran_id);

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500 dark:text-gray-400">
        <Link href="/ai-usulan" className="hover:underline">
          Usulan AI
        </Link>{" "}
        / <span>{labelFungsi(u.fungsi)}</span>
      </nav>
      <h1 className="page-heading">Usulan {labelFungsi(u.fungsi)}</h1>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-gray-600 dark:text-gray-400">Sasaran</dt>
          <dd>
            {labelSasaran(u.sasaran_jenis)}{" "}
            {href ? (
              <Link href={href} className="text-blue-600 dark:text-blue-400">
                (buka)
              </Link>
            ) : (
              <span className="break-all text-gray-500">{u.sasaran_id}</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-gray-600 dark:text-gray-400">Hasil serap</dt>
          <dd>
            {labelHasilSerap(u.hasil_serap)}
            {u.kode_serap && u.kode_serap.length > 0 ? ` (${u.kode_serap.join(", ")})` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-gray-600 dark:text-gray-400">Diajukan</dt>
          <dd>{new Date(u.created_at).toLocaleString("id-ID")}</dd>
        </div>
        <div>
          <dt className="text-gray-600 dark:text-gray-400">Diserap</dt>
          <dd>{u.diserap_at ? new Date(u.diserap_at).toLocaleString("id-ID") : "Belum diserap"}</dd>
        </div>
        <div>
          <dt className="text-gray-600 dark:text-gray-400">Pemohon</dt>
          <dd className="break-all">{u.diminta_oleh}</dd>
        </div>
        <div>
          <dt className="text-gray-600 dark:text-gray-400">Sumber masukan</dt>
          <dd className="break-all">{u.sumber_ids.join(", ") || "—"}</dd>
        </div>
      </dl>

      <section aria-labelledby="isi-judul" className="space-y-2">
        <h2 id="isi-judul" className="text-base font-semibold">
          Isi usulan
        </h2>
        {u.isi ? (
          <IsiUsulan nilai={u.isi} />
        ) : (
          <p role="status" className="text-sm text-gray-600 dark:text-gray-400">
            Belum diserap: run AI ini belum menghasilkan isi usulan.
          </p>
        )}
      </section>

      <section aria-labelledby="amplop-judul" className="space-y-2">
        <h2 id="amplop-judul" className="text-base font-semibold">
          Amplop keluaran
        </h2>
        {u.amplop ? (
          <IsiUsulan nilai={u.amplop} />
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">Belum ada amplop.</p>
        )}
      </section>

      <section aria-labelledby="riwayat-judul" className="space-y-2">
        <h2 id="riwayat-judul" className="text-base font-semibold">
          Riwayat putusan
        </h2>
        {!u.putusan || u.putusan.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">Belum diputus.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {u.putusan.map((p) => (
              <li key={p.id} className="rounded-md border border-gray-200 p-2 dark:border-gray-700">
                <strong>{p.putusan}</strong>
                {p.tingkat_koreksi ? ` (${p.tingkat_koreksi})` : ""} oleh{" "}
                <span className="break-all">{p.actor_key}</span>,{" "}
                {new Date(p.created_at).toLocaleString("id-ID")}
                {p.catatan ? (
                  <p className="mt-1 whitespace-pre-wrap">Catatan: {p.catatan}</p>
                ) : null}
                {p.teks_koreksi ? (
                  <p className="mt-1 whitespace-pre-wrap">Koreksi: {p.teks_koreksi}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <PutusanForm usulanId={u.id} accessToken={session?.accessToken} />
    </div>
  );
}
