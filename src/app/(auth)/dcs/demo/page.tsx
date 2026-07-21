import { notFound } from "next/navigation";
import Link from "next/link";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { DcsSubSkalaWithItemsRead } from "@/lib/api/schema";
import { DcsForm } from "../isi/[responden_id]/dcs-form";
import { PetunjukDcs } from "../isi/[responden_id]/petunjuk-dcs";

export const metadata = { title: "Demo Pengisian DCS" };

const DCS_SUBSKALA = ["DEMAND", "CONTROL", "SUPPORT"] as const;

async function fetchSubskala(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const subskalaRes = await Promise.all(
    DCS_SUBSKALA.map((kode) =>
      client.GET("/api/v1/dcs/sub-skala/{kode}", { params: { path: { kode } } }),
    ),
  );
  // Instrumen (pernyataan tiap sub-skala) adalah data inti halaman ini —
  // kegagalan harus melempar, bukan tampil sebagai sub-skala yang hilang.
  return subskalaRes.map((r) => {
    if (!r.data) throw apiErrorDari(r);
    return r.data as DcsSubSkalaWithItemsRead;
  });
}

export default async function DcsDemoPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const subskala = await fetchSubskala(session?.accessToken);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dcs" className="hover:text-gray-700">
          DCS
        </Link>
        <span>/</span>
        <span className="text-gray-900">Demo Pengisian</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-heading">Demo Pengisian DCS</h1>
          <p className="page-subtext">
            Peragaan tampilan kuesioner persis seperti yang dilihat partisipan — jawaban tidak
            disimpan.
          </p>
        </div>
        <PetunjukDcs defaultOpen />
      </div>

      <DcsForm
        demo
        respondenId="demo"
        subskala={subskala}
        jawabanAwal={[]}
        sudahSubmit={false}
        accessToken={session?.accessToken}
      />
    </div>
  );
}
