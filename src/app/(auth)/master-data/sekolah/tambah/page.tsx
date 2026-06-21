import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { JenjangPendidikanRead } from "@/lib/api/schema";
import { TambahSekolahForm } from "./sekolah-form";

export const metadata = { title: "Tambah Sekolah — Master Data" };

async function fetchJenjang(accessToken: string | undefined): Promise<JenjangPendidikanRead[]> {
  const client = withServerAuth(accessToken);
  const { data, response } = await client.GET("/api/v1/jenjang-pendidikan", {
    params: { query: { limit: 100 } },
  });
  const requestId = response.headers.get("x-request-id");
  if (!data) throw toApiError(null, requestId);
  return data.items ?? [];
}

export default async function TambahSekolahPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const jenjang = await fetchJenjang(session?.accessToken);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Tambah Sekolah</h2>
        <p className="page-subtext">
          Sekolah adalah satuan pendidikan yang menjadi unit kerja dalam analisis jabatan.
        </p>
      </div>
      <div className="max-w-xl">
        <TambahSekolahForm jenjang={jenjang} accessToken={session?.accessToken} />
      </div>
    </div>
  );
}
