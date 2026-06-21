import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/schema";
import { TsSesiForm } from "./ts-sesi-form";

type JabatanRead = components["schemas"]["JabatanRead"];

export const metadata = { title: "Buat Sesi Time Study — ANJAB-ABK" };

async function fetchJabatan(accessToken: string | undefined): Promise<JabatanRead[]> {
  const client = withServerAuth(accessToken);
  const { data, response } = await client.GET("/api/v1/jabatan", {
    params: { query: { limit: 100 } },
  });
  const reqId = response.headers.get("x-request-id");
  if (!data) throw toApiError(null, reqId);
  return data.items ?? [];
}

export default async function BuatTimeStudySesiPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const jabatan = await fetchJabatan(session?.accessToken);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/time-study" className="hover:text-gray-700">
          Sesi Time Study
        </Link>
        <span>/</span>
        <span className="text-gray-900">Buat Sesi</span>
      </div>

      <div>
        <h1 className="page-heading">Buat Sesi Time Study</h1>
        <p className="page-subtext">
          Pilih jabatan dan periode survei. Setelah dibuat, buka sesi untuk mulai mendaftarkan
          responden.
        </p>
      </div>

      <TsSesiForm jabatan={jabatan} accessToken={session?.accessToken} />
    </div>
  );
}
