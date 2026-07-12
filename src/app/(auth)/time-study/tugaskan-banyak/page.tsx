import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { TsPenugasanBulkForm } from "./ts-penugasan-bulk-form";

type TsPenugasanRead = components["schemas"]["TsPenugasanRead"];
type PartisipanRead = components["schemas"]["PartisipanRead"];
type JabatanRead = components["schemas"]["JabatanRead"];

export const metadata = { title: "Tugaskan Banyak Sekaligus — Time Study — ANJAB-ABK" };

async function fetchPageData(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const [penugasanRes, partisipanRes, jabatanRes] = await Promise.all([
    client.GET("/api/v1/time-study/penugasan", { params: { query: { limit: 200 } } }),
    client.GET("/api/v1/partisipan", { params: { query: { limit: 200 } } }),
    client.GET("/api/v1/jabatan", { params: { query: { limit: 100 } } }),
  ]);
  const penugasan = (penugasanRes.data?.items ?? []) as TsPenugasanRead[];
  const allPartisipan = (partisipanRes.data?.items ?? []) as PartisipanRead[];
  const assignedIds = new Set(penugasan.map((p) => p.partisipan_id));
  const tersedia = allPartisipan.filter((p) => !assignedIds.has(p.id));
  return {
    partisipan: tersedia,
    jabatan: (jabatanRes.data?.items ?? []) as JabatanRead[],
  };
}

export default async function TugaskanBanyakPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { partisipan, jabatan } = await fetchPageData(session?.accessToken);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/time-study" className="hover:text-gray-700">
          Time Study
        </Link>
        <span>/</span>
        <span className="text-gray-900">Tugaskan Banyak Sekaligus</span>
      </div>

      <div>
        <h1 className="page-heading">Tugaskan Banyak Sekaligus — Time Study</h1>
        <p className="page-subtext">
          Pilih banyak partisipan sekaligus untuk ditugaskan mencatat log harian Time Study dalam
          satu submit.
        </p>
      </div>

      <TsPenugasanBulkForm
        partisipan={partisipan}
        jabatan={jabatan}
        accessToken={session?.accessToken}
      />
    </div>
  );
}
