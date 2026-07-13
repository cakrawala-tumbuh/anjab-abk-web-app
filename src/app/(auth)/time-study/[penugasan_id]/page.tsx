import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/schema";
import { ToggleAktif } from "./toggle-aktif";
import { HapusPenugasan } from "./hapus-penugasan";

type TsPenugasanRead = components["schemas"]["TsPenugasanRead"];
type TsLogRead = components["schemas"]["TsLogRead"];
type PartisipanRead = components["schemas"]["PartisipanRead"];
type JabatanRead = components["schemas"]["JabatanRead"];

export const metadata = { title: "Detail Penugasan Time Study" };

interface Props {
  params: Promise<{ penugasan_id: string }>;
}

async function fetchPageData(accessToken: string | undefined, penugasanId: string) {
  const client = withServerAuth(accessToken);
  const [penugasanRes, logRes] = await Promise.all([
    client.GET("/api/v1/time-study/penugasan/{penugasan_id}", {
      params: { path: { penugasan_id: penugasanId } },
    }),
    client.GET("/api/v1/time-study/penugasan/{penugasan_id}/log", {
      params: { path: { penugasan_id: penugasanId } },
    }),
  ]);
  const reqId = penugasanRes.response.headers.get("x-request-id");
  if (!penugasanRes.data) throw toApiError(null, reqId);

  const penugasan = penugasanRes.data as TsPenugasanRead;
  const [partisipanRes, jabatanListRes] = await Promise.all([
    client.GET("/api/v1/partisipan/{partisipan_id}", {
      params: { path: { partisipan_id: penugasan.partisipan_id } },
    }),
    client.GET("/api/v1/jabatan", { params: { query: { limit: 100 } } }),
  ]);
  const partisipan = (partisipanRes.data ?? null) as PartisipanRead | null;
  const jabatan = (jabatanListRes.data?.items ?? []) as JabatanRead[];

  return {
    penugasan,
    logs: (logRes.data ?? []) as TsLogRead[],
    partisipan,
    jabatan,
  };
}

export default async function TimeStudyPenugasanDetailPage({ params }: Props) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { penugasan_id } = await params;
  const { penugasan, logs, partisipan, jabatan } = await fetchPageData(
    session?.accessToken,
    penugasan_id,
  );

  const jabatanMap = Object.fromEntries(jabatan.map((j) => [j.id, j.nama]));
  const namaPartisipan = partisipan?.nama ?? penugasan.partisipan_id;
  const jabatanNama = partisipan
    ? (jabatanMap[partisipan.jabatan_utama_id] ?? partisipan.jabatan_utama_id)
    : "?";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/time-study" className="hover:text-gray-700">
          Time Study
        </Link>
        <span>/</span>
        <span className="text-gray-900">{namaPartisipan}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-heading">{namaPartisipan}</h1>
          <p className="mt-1 text-sm text-gray-500">{jabatanNama}</p>
          {penugasan.catatan && (
            <p className="mt-2 text-sm italic text-gray-600">{penugasan.catatan}</p>
          )}
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
            penugasan.aktif ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {penugasan.aktif ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Log Harian Terisi</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-500">
            {new Date(penugasan.created_at).toLocaleDateString("id-ID")}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ditugaskan</p>
        </div>
      </div>

      {/* Aksi */}
      <ToggleAktif penugasan={penugasan} accessToken={session?.accessToken} />
      <div className="flex justify-end">
        <HapusPenugasan
          penugasanId={penugasan.id}
          nama={namaPartisipan}
          accessToken={session?.accessToken}
        />
      </div>
    </div>
  );
}
