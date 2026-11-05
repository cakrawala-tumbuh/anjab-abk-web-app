import Link from "next/link";
import { offsetHalaman, UKURAN_HALAMAN } from "@/components/pagination";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { StatusQaAi } from "@/lib/api/schema";
import { auth } from "@/lib/auth/auth";
import { RunTabel, STATUS_QA } from "./run-tabel";
import { SaklarPanel } from "./saklar-panel";

export const metadata = { title: "Saklar & Run AI" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function nilaiTunggal(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

/**
 * Halaman admin `/sistem/ai`: status + saklar AI dan register run (Server Component).
 *
 * Membaca `GET /api/v1/system/ai/saklar` dan `GET /api/v1/system/ai/runs` (filter `fungsi`,
 * `status_qa` dari URL, paginasi `hlm`). Kegagalan backend dilempar (`apiErrorDari`) ke
 * `error.tsx`, tidak pernah menjadi panel/tabel kosong. Guard admin ada di layout segmen.
 */
export default async function SistemAiPage({ searchParams }: Props) {
  const session = await auth();
  const sp = await searchParams;
  const fungsi = nilaiTunggal(sp.fungsi);
  const statusMentah = nilaiTunggal(sp.status_qa);
  const statusQa = (STATUS_QA as ReadonlyArray<string>).includes(statusMentah)
    ? (statusMentah as StatusQaAi)
    : undefined;
  const offset = offsetHalaman(sp, "hlm");

  const client = withServerAuth(session?.accessToken);
  const [saklarRes, runsRes] = await Promise.all([
    client.GET("/api/v1/system/ai/saklar"),
    client.GET("/api/v1/system/ai/runs", {
      params: {
        query: {
          fungsi: fungsi || undefined,
          status_qa: statusQa,
          limit: UKURAN_HALAMAN,
          offset,
        },
      },
    }),
  ]);
  if (!saklarRes.data) throw apiErrorDari(saklarRes);
  if (!runsRes.data) throw apiErrorDari(runsRes);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-heading">Saklar &amp; Run AI</h1>
        <p className="page-subtext">
          Hentikan atau hidupkan kembali layanan AI dengan alasan, dan telusuri register run. Isi
          masukan dan keluaran tidak pernah ditampilkan.
        </p>
        <p className="mt-1 text-sm">
          <Link href="/sistem/ai/penyedia" className="text-blue-600 underline">
            Pengaturan penyedia AI
          </Link>
        </p>
      </div>
      <SaklarPanel saklar={saklarRes.data} accessToken={session?.accessToken} />
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Register Run</h2>
        <RunTabel
          items={runsRes.data.items}
          total={runsRes.data.total}
          offset={offset}
          fungsi={fungsi}
          statusQa={statusQa ?? ""}
          searchParams={sp}
        />
      </section>
    </div>
  );
}
