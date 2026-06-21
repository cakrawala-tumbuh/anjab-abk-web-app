import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { JabatanRead } from "@/lib/api/schema";
import { DcsSesiForm } from "./dcs-sesi-form";

export const metadata = { title: "Buat Sesi DCS — ANJAB-ABK" };

async function fetchJabatan(accessToken: string | undefined): Promise<JabatanRead[]> {
  const client = withServerAuth(accessToken);
  const { data, response } = await client.GET("/api/v1/jabatan", {
    params: { query: { limit: 100 } },
  });
  const reqId = response.headers.get("x-request-id");
  if (!data) throw toApiError(null, reqId);
  return data.items ?? [];
}

export default async function BuatDcsSesiPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const jabatan = await fetchJabatan(session?.accessToken);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dcs" className="hover:text-gray-700">
          Sesi DCS
        </Link>
        <span>/</span>
        <span className="text-gray-900">Buat Sesi</span>
      </div>

      <div>
        <h1 className="page-heading">Buat Sesi DCS</h1>
        <p className="page-subtext">
          Pilih jabatan dan periode survei. Setelah dibuat, buka sesi untuk mulai mendaftarkan
          responden.
        </p>
      </div>

      <DcsSesiForm jabatan={jabatan} accessToken={session?.accessToken} />
    </div>
  );
}
