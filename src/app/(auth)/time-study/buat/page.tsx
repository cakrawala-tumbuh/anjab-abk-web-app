import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { TsPenugasanForm } from "./ts-penugasan-form";

type PartisipanRead = components["schemas"]["PartisipanRead"];
type JabatanRead = components["schemas"]["JabatanRead"];

export const metadata = { title: "Tugaskan Partisipan — Time Study — ANJAB-ABK" };

async function fetchPageData(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const [partisipanRes, jabatanRes] = await Promise.all([
    client.GET("/api/v1/partisipan", { params: { query: { limit: 100 } } }),
    client.GET("/api/v1/jabatan", { params: { query: { limit: 100 } } }),
  ]);
  return {
    partisipan: (partisipanRes.data?.items ?? []) as PartisipanRead[],
    jabatan: (jabatanRes.data?.items ?? []) as JabatanRead[],
  };
}

export default async function BuatTimeStudyPenugasanPage() {
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
        <span className="text-gray-900">Tugaskan Partisipan</span>
      </div>

      <div>
        <h1 className="page-heading">Tugaskan Partisipan — Time Study</h1>
        <p className="page-subtext">
          Pilih partisipan yang akan mencatat log harian Time Study. Partisipan dapat mulai mencatat
          kapan saja selama penugasannya aktif.
        </p>
      </div>

      <TsPenugasanForm
        partisipan={partisipan}
        jabatan={jabatan}
        accessToken={session?.accessToken}
      />
    </div>
  );
}
