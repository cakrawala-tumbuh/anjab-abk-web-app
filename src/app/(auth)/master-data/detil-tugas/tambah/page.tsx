import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { JabatanRead, TugasPokokRead } from "@/lib/api/schema";
import { TambahDetilTugasForm } from "./detil-tugas-form";

export const metadata = { title: "Tambah Detil Tugas — Master Data" };

async function fetchData(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const [pokokRes, jabatanRes] = await Promise.all([
    client.GET("/api/v1/task-inventory/tugas-pokok", { params: { query: { limit: 200 } } }),
    client.GET("/api/v1/jabatan", { params: { query: { limit: 200 } } }),
  ]);
  if (!pokokRes.data) throw apiErrorDari(pokokRes);
  // Sumber daftar checkbox jabatan pada formulir — jangan tampil sebagai
  // "Belum ada jabatan" saat sebenarnya gagal diambil.
  if (!jabatanRes.data) throw apiErrorDari(jabatanRes);
  return {
    tugasPokok: (pokokRes.data.items ?? []) as TugasPokokRead[],
    jabatanList: (jabatanRes.data.items ?? []) as JabatanRead[],
  };
}

export default async function TambahDetilTugasPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { tugasPokok, jabatanList } = await fetchData(session?.accessToken);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Tambah Detil Tugas
        </h2>
        <p className="page-subtext">Detil tugas adalah kelompok tugas di bawah tugas pokok.</p>
      </div>
      <div className="max-w-xl">
        <TambahDetilTugasForm
          tugasPokok={tugasPokok}
          jabatanList={jabatanList}
          accessToken={session?.accessToken}
        />
      </div>
    </div>
  );
}
