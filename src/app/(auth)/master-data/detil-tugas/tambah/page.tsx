import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { TugasPokokRead } from "@/lib/api/schema";
import { TambahDetilTugasForm } from "./detil-tugas-form";

export const metadata = { title: "Tambah Detil Tugas — Master Data" };

async function fetchTugasPokok(accessToken: string | undefined): Promise<TugasPokokRead[]> {
  const client = withServerAuth(accessToken);
  const { data, response } = await client.GET("/api/v1/task-inventory/tugas-pokok", {
    params: { query: { limit: 200 } },
  });
  const requestId = response.headers.get("x-request-id");
  if (!data) throw toApiError(null, requestId);
  return data.items ?? [];
}

export default async function TambahDetilTugasPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const tugasPokok = await fetchTugasPokok(session?.accessToken);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Tambah Detil Tugas
        </h2>
        <p className="page-subtext">Detil tugas adalah kelompok tugas di bawah tugas pokok.</p>
      </div>
      <div className="max-w-xl">
        <TambahDetilTugasForm tugasPokok={tugasPokok} accessToken={session?.accessToken} />
      </div>
    </div>
  );
}
