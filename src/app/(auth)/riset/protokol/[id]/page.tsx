import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { LABEL_STATUS_PROTOKOL, LABEL_STATUS_STATISTIK } from "@/lib/riset";
import { fetchKasusNegatif, fetchProtokol, fetchSignoff, fetchStatistik } from "../data";
import { BagianSignoff } from "./bagian-signoff";
import { KasusNegatifForm } from "./kasus-negatif-form";
import { KunciProtokol } from "./kunci-protokol";
import { SintesisRisetAi } from "./sintesis-riset-ai";
import { StatistikForm } from "./statistik-form";
import { VerifikasiTombol } from "./verifikasi-tombol";

export const metadata = { title: "Detail Protokol Riset" };

interface Props {
  params: Promise<{ id: string }>;
}

const waktu = (v: string | null) => (v ? new Date(v).toLocaleString("id-ID") : "—");

/**
 * Halaman detail protokol riset (Server Component): identitas, `isi_hash`, `isi`, tombol
 * kunci (hanya `DRAF`), bagian Sign-off PI/etik, dan, hanya bila `TERKUNCI`, bagian Statistik
 * serta Kasus negatif.
 *
 * Daftar statistik, kasus negatif, dan (bila `signoff_ada`) metadata sign-off adalah data inti:
 * kegagalan dilempar ke `error.tsx`, tidak pernah menjadi daftar kosong. 404 protokol →
 * halaman tidak ditemukan.
 */
export default async function DetailProtokolPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const token = session?.accessToken;
  const p = await fetchProtokol(token, id);
  if (!p) notFound();

  const terkunci = p.status === "TERKUNCI";
  const [statistik, kasus, signoff] = terkunci
    ? await Promise.all([
        fetchStatistik(token, id),
        fetchKasusNegatif(token, id),
        p.signoff_ada ? fetchSignoff(token, id) : Promise.resolve(null),
      ])
    : [[], [], null];

  const baris: Array<[string, React.ReactNode]> = [
    [
      "Kode",
      <span key="k" className="font-mono text-xs">
        {p.kode}
      </span>,
    ],
    ["Versi", p.versi],
    ["Status", LABEL_STATUS_PROTOKOL[p.status]],
    [
      "Hash isi (SHA-256)",
      p.isi_hash ? (
        <span key="h" className="font-mono text-xs break-all">
          {p.isi_hash}
        </span>
      ) : (
        "—"
      ),
    ],
    ["Dibuat oleh", p.dibuat_oleh],
    ["Dikunci oleh", p.dikunci_oleh ?? "—"],
    ["Dikunci pada", waktu(p.dikunci_pada)],
    ["Dibuat pada", waktu(p.created_at)],
  ];

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500 dark:text-gray-400">
        <Link href="/riset/protokol" className="hover:underline">
          Protokol Riset
        </Link>{" "}
        / <span>{p.judul}</span>
      </nav>
      <div className="flex items-center justify-between gap-3">
        <h1 className="page-heading">{p.judul}</h1>
        {!terkunci && <KunciProtokol protokolId={p.id} accessToken={token} />}
      </div>
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[12rem_1fr]">
        {baris.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-gray-600 dark:text-gray-400">{k}</dt>
            <dd className="whitespace-normal break-words">{v}</dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="isi-protokol" className="space-y-2">
        <h2 id="isi-protokol" className="text-base font-semibold">
          Isi protokol
        </h2>
        <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800">
          {p.isi}
        </pre>
      </section>

      <BagianSignoff protokolId={p.id} status={p.status} signoff={signoff} />

      <section aria-labelledby="h-statistik" className="space-y-3">
        <h2 id="h-statistik" className="text-base font-semibold">
          Statistik
        </h2>
        {!terkunci ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Kunci protokol dulu untuk mencatat statistik.
          </p>
        ) : (
          <>
            {statistik.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada statistik.</p>
            ) : (
              <div className="table-container">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {["Analisis", "Rujukan kode sumber", "Status", "Pemverifikasi", ""].map(
                        (h, i) => (
                          <th
                            key={i}
                            className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {statistik.map((s) => (
                      <tr key={s.id} className="align-top">
                        <td className="px-4 py-3 whitespace-normal break-words">
                          {s.nama_analisis}
                        </td>
                        <td className="px-4 py-3 whitespace-normal break-words font-mono text-xs">
                          {s.kode_sumber_ref}
                        </td>
                        <td className="px-4 py-3">{LABEL_STATUS_STATISTIK[s.status]}</td>
                        <td className="px-4 py-3 whitespace-normal break-words">
                          {s.diverifikasi_oleh ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          {s.status === "DRAF" && (
                            <VerifikasiTombol statistikId={s.id} accessToken={token} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <StatistikForm protokolId={p.id} accessToken={token} />
          </>
        )}
      </section>

      {terkunci && (
        <SintesisRisetAi
          accessToken={token}
          protokolId={p.id}
          signoffAda={p.signoff_ada}
          jumlahTerverifikasi={statistik.filter((s) => s.status === "TERVERIFIKASI").length}
        />
      )}

      <section aria-labelledby="h-kasus" className="space-y-3">
        <h2 id="h-kasus" className="text-base font-semibold">
          Kasus negatif
        </h2>
        {!terkunci ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Kunci protokol dulu untuk mencatat kasus negatif.
          </p>
        ) : (
          <>
            {kasus.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada kasus negatif.</p>
            ) : (
              <ul className="space-y-3">
                {kasus.map((k) => (
                  <li
                    key={k.id}
                    className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700"
                  >
                    <p className="whitespace-pre-wrap break-words">{k.ringkasan}</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-gray-600 dark:text-gray-400">
                      Alasan: {k.alasan_negatif}
                    </p>
                    {k.sumber_ref && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Sumber: {k.sumber_ref}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <KasusNegatifForm protokolId={p.id} accessToken={token} />
          </>
        )}
      </section>
    </div>
  );
}
