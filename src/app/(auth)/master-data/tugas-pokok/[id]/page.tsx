import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { JabatanRead, TugasPokokRead } from "@/lib/api/schema";
import { TambahTugasPokokForm } from "../tambah/tugas-pokok-form";
import { HapusTugasPokokButton } from "./hapus-button";

export const metadata = { title: "Edit Tugas Pokok — Master Data" };

async function fetchData(accessToken: string | undefined, id: string) {
  const client = withServerAuth(accessToken);
  const [tpRes, jabatanRes] = await Promise.all([
    client.GET("/api/v1/task-inventory/tugas-pokok/{tp_id}", {
      params: { path: { tp_id: id } },
    }),
    client.GET("/api/v1/jabatan", { params: { query: { limit: 200 } } }),
  ]);
  const requestId = tpRes.response.headers.get("x-request-id");
  if (!tpRes.data) throw toApiError(null, requestId);
  return {
    tugasPokok: tpRes.data as TugasPokokRead,
    jabatanList: (jabatanRes.data?.items ?? []) as JabatanRead[],
  };
}

export default async function EditTugasPokokPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { id } = await params;
  const { tugasPokok, jabatanList } = await fetchData(session?.accessToken, id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Tugas Pokok</h2>
        <p className="page-subtext">Perbarui nama dan jabatan yang terkait.</p>
      </div>
      <div className="max-w-xl space-y-4">
        <TambahTugasPokokForm
          accessToken={session?.accessToken}
          defaultValues={{ nama: tugasPokok.nama, jabatan_ids: tugasPokok.jabatan_ids }}
          editId={id}
          jabatanList={jabatanList}
        />
        <HapusTugasPokokButton id={id} nama={tugasPokok.nama} accessToken={session?.accessToken} />
      </div>
    </div>
  );
}
