import { notFound } from "next/navigation";
import Link from "next/link";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { WcpDimensiWithItemsRead } from "@/lib/api/schema";
import { WcpForm } from "../isi/[responden_id]/wcp-form";
import { PetunjukWcp } from "../isi/[responden_id]/petunjuk-wcp";

export const metadata = { title: "Demo Pengisian WCP" };

const WCP_DIMENSI = [
  "SC",
  "TM",
  "AS",
  "RC",
  "DA",
  "WP",
  "PC",
  "SS",
  "CH",
  "SD",
  "PI",
  "RA",
] as const;

async function fetchDimensi(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const dimensiRes = await Promise.all(
    WCP_DIMENSI.map((kode) =>
      client.GET("/api/v1/wcp/dimensi/{kode}", { params: { path: { kode } } }),
    ),
  );
  // Instrumen (pernyataan tiap dimensi) adalah data inti halaman ini —
  // kegagalan harus melempar, bukan tampil sebagai dimensi yang hilang.
  return dimensiRes.map((r) => {
    if (!r.data) throw apiErrorDari(r);
    return r.data as WcpDimensiWithItemsRead;
  });
}

export default async function WcpDemoPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const dimensi = await fetchDimensi(session?.accessToken);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/wcp" className="hover:text-gray-700">
          WCP
        </Link>
        <span>/</span>
        <span className="text-gray-900">Demo Pengisian</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-heading">Demo Pengisian WCP</h1>
          <p className="page-subtext">
            Peragaan tampilan kuesioner persis seperti yang dilihat partisipan — jawaban tidak
            disimpan.
          </p>
        </div>
        <PetunjukWcp defaultOpen />
      </div>

      <WcpForm
        demo
        respondenId="demo"
        dimensi={dimensi}
        jawabanAwal={[]}
        sudahSubmit={false}
        accessToken={session?.accessToken}
      />
    </div>
  );
}
