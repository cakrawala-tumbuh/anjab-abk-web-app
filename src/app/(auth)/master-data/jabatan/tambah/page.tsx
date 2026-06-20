import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { SekolahRead } from "@/lib/api/schema";
import { TambahJabatanForm } from "./jabatan-form";

export const metadata = { title: "Tambah Jabatan — Master Data" };

async function fetchSekolah(accessToken: string | undefined): Promise<SekolahRead[]> {
  const client = withServerAuth(accessToken);
  const { data, response } = await client.GET("/api/v1/sekolah", {
    params: { query: { limit: 100 } },
  });
  const requestId = response.headers.get("x-request-id");
  if (!data) throw toApiError(null, requestId);
  return data.items ?? [];
}

export default async function TambahJabatanPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const sekolah = await fetchSekolah(session?.accessToken);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Tambah Jabatan</h2>
        <p className="mt-1 text-sm text-gray-500">
          Jabatan digunakan sebagai referensi dalam analisis jabatan dan beban kerja.
        </p>
      </div>
      <div className="max-w-xl">
        <TambahJabatanForm sekolah={sekolah} accessToken={session?.accessToken} />
      </div>
    </div>
  );
}
