import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type {
  DetilTugasRead,
  JabatanRead,
  TugasPokokRead,
  UraianTugasRead,
} from "@/lib/api/schema";
import { TambahUraianTugasForm } from "../tambah/uraian-tugas-form";
import { HapusUraianTugasButton } from "./hapus-button";

export const metadata = { title: "Edit Uraian Tugas — Master Data" };

async function fetchData(accessToken: string | undefined, id: string) {
  const client = withServerAuth(accessToken);
  const [uraianRes, pokokRes, detilRes, jabatanRes] = await Promise.all([
    client.GET("/api/v1/task-inventory/uraian-tugas/{ut_id}", {
      params: { path: { ut_id: id } },
    }),
    client.GET("/api/v1/task-inventory/tugas-pokok", { params: { query: { limit: 200 } } }),
    client.GET("/api/v1/task-inventory/detil-tugas", { params: { query: { limit: 500 } } }),
    client.GET("/api/v1/jabatan", { params: { query: { limit: 200 } } }),
  ]);
  if (!uraianRes.data) throw toApiError(null, uraianRes.response.headers.get("x-request-id"));
  if (!pokokRes.data) throw toApiError(null, pokokRes.response.headers.get("x-request-id"));
  if (!detilRes.data) throw toApiError(null, detilRes.response.headers.get("x-request-id"));
  return {
    uraianTugas: uraianRes.data as UraianTugasRead,
    tugasPokok: (pokokRes.data.items ?? []) as TugasPokokRead[],
    detilTugas: (detilRes.data.items ?? []) as DetilTugasRead[],
    jabatanList: (jabatanRes.data?.items ?? []) as JabatanRead[],
  };
}

export default async function EditUraianTugasPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { id } = await params;
  const { uraianTugas, tugasPokok, detilTugas, jabatanList } = await fetchData(
    session?.accessToken,
    id,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Edit Uraian Tugas
        </h2>
        <p className="page-subtext">
          Perbarui detail uraian tugas <span className="font-mono text-xs">{uraianTugas.kode}</span>
          .
        </p>
      </div>
      <div className="max-w-2xl space-y-4">
        <TambahUraianTugasForm
          tugasPokok={tugasPokok}
          detilTugas={detilTugas}
          jabatanList={jabatanList}
          accessToken={session?.accessToken}
          defaultValues={{
            kode: uraianTugas.kode,
            uraian: uraianTugas.uraian,
            unit: uraianTugas.unit,
            urutan: uraianTugas.urutan,
            tugas_pokok_id: uraianTugas.tugas_pokok_id,
            detil_tugas_id: uraianTugas.detil_tugas_id ?? "",
            jabatan_id: uraianTugas.jabatan_id ?? "",
          }}
          editId={id}
        />
        <HapusUraianTugasButton
          id={id}
          kode={uraianTugas.kode}
          accessToken={session?.accessToken}
        />
      </div>
    </div>
  );
}
