import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { DetilTugasRead, JabatanRead, TugasPokokRead } from "@/lib/api/schema";
import { TambahDetilTugasForm } from "../tambah/detil-tugas-form";
import { HapusDetilTugasButton } from "./hapus-button";

export const metadata = { title: "Edit Detil Tugas — Master Data" };

async function fetchData(accessToken: string | undefined, id: string) {
  const client = withServerAuth(accessToken);
  const [detilRes, pokokRes, jabatanRes] = await Promise.all([
    client.GET("/api/v1/task-inventory/detil-tugas/{dt_id}", {
      params: { path: { dt_id: id } },
    }),
    client.GET("/api/v1/task-inventory/tugas-pokok", { params: { query: { limit: 200 } } }),
    client.GET("/api/v1/jabatan", { params: { query: { limit: 200 } } }),
  ]);
  if (!detilRes.data) throw apiErrorDari(detilRes);
  if (!pokokRes.data) throw apiErrorDari(pokokRes);
  // Sumber daftar checkbox jabatan pada formulir edit — bila ditelan jadi `[]`,
  // menyimpan form akan MELEPAS semua jabatan yang sudah terkait.
  if (!jabatanRes.data) throw apiErrorDari(jabatanRes);
  return {
    detilTugas: detilRes.data as DetilTugasRead,
    tugasPokok: (pokokRes.data.items ?? []) as TugasPokokRead[],
    jabatanList: (jabatanRes.data.items ?? []) as JabatanRead[],
  };
}

export default async function EditDetilTugasPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { id } = await params;
  const { detilTugas, tugasPokok, jabatanList } = await fetchData(session?.accessToken, id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Detil Tugas</h2>
        <p className="page-subtext">Perbarui nama atau tugas pokok induk.</p>
      </div>
      <div className="max-w-xl space-y-4">
        <TambahDetilTugasForm
          tugasPokok={tugasPokok}
          jabatanList={jabatanList}
          accessToken={session?.accessToken}
          defaultValues={{
            nama: detilTugas.nama,
            tugas_pokok_id: detilTugas.tugas_pokok_id,
            jabatan_ids: detilTugas.jabatan_ids,
          }}
          editId={id}
        />
        <HapusDetilTugasButton id={id} nama={detilTugas.nama} accessToken={session?.accessToken} />
      </div>
    </div>
  );
}
