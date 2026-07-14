import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { JabatanRead } from "@/lib/api/schema";
import { TambahTugasPokokForm } from "./tugas-pokok-form";

export const metadata = { title: "Tambah Tugas Pokok — Master Data" };

async function fetchJabatan(accessToken: string | undefined): Promise<JabatanRead[]> {
  const client = withServerAuth(accessToken);
  // Satu-satunya sumber daftar checkbox jabatan pada formulir ini — kegagalannya
  // tidak boleh tampil sebagai "Belum ada jabatan".
  const res = await client.GET("/api/v1/jabatan", { params: { query: { limit: 200 } } });
  if (!res.data) throw apiErrorDari(res);
  return (res.data.items ?? []) as JabatanRead[];
}

export default async function TambahTugasPokokPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const jabatanList = await fetchJabatan(session?.accessToken);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Tambah Tugas Pokok
        </h2>
        <p className="page-subtext">
          Tugas pokok adalah klaster tugas yang mengelompokkan detil tugas dan uraian tugas.
        </p>
      </div>
      <div className="max-w-xl">
        <TambahTugasPokokForm accessToken={session?.accessToken} jabatanList={jabatanList} />
      </div>
    </div>
  );
}
