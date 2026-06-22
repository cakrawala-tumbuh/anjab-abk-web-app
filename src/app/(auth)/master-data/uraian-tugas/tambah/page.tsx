import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { DetilTugasRead, TugasPokokRead } from "@/lib/api/schema";
import { TambahUraianTugasForm } from "./uraian-tugas-form";

export const metadata = { title: "Tambah Uraian Tugas — Master Data" };

async function fetchData(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const [pokokRes, detilRes] = await Promise.all([
    client.GET("/api/v1/task-inventory/tugas-pokok", { params: { query: { limit: 200 } } }),
    client.GET("/api/v1/task-inventory/detil-tugas", { params: { query: { limit: 500 } } }),
  ]);
  if (!pokokRes.data) throw toApiError(null, pokokRes.response.headers.get("x-request-id"));
  if (!detilRes.data) throw toApiError(null, detilRes.response.headers.get("x-request-id"));
  return {
    tugasPokok: pokokRes.data.items ?? ([] as TugasPokokRead[]),
    detilTugas: detilRes.data.items ?? ([] as DetilTugasRead[]),
  };
}

export default async function TambahUraianTugasPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { tugasPokok, detilTugas } = await fetchData(session?.accessToken);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Tambah Uraian Tugas
        </h2>
        <p className="page-subtext">
          Uraian tugas adalah pernyataan tugas individual dalam catalog Task Inventory.
        </p>
      </div>
      <div className="max-w-2xl">
        <TambahUraianTugasForm
          tugasPokok={tugasPokok}
          detilTugas={detilTugas}
          accessToken={session?.accessToken}
        />
      </div>
    </div>
  );
}
