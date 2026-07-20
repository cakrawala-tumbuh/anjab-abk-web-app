import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { JabatanRead } from "@/lib/api/schema";
import { TambahSMEPanelForm } from "./sme-panel-form";

export const metadata = { title: "Tambah SME Panel — Master Data" };

async function fetchJabatan(accessToken: string | undefined): Promise<JabatanRead[]> {
  const client = withServerAuth(accessToken);
  const res = await client.GET("/api/v1/jabatan", {
    params: { query: { limit: 100 } },
  });
  if (!res.data) throw apiErrorDari(res);
  return (res.data.items ?? []) as JabatanRead[];
}

export default async function TambahSMEPanelPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const jabatan = await fetchJabatan(session?.accessToken);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Tambah SME Panel</h2>
        <p className="page-subtext">
          Panel SME (Subject Matter Expert) mengelompokkan partisipan berdasarkan jabatan untuk
          keperluan Analisis Jabatan.
        </p>
      </div>
      <div className="max-w-xl">
        <TambahSMEPanelForm jabatan={jabatan} accessToken={session?.accessToken} />
      </div>
    </div>
  );
}
