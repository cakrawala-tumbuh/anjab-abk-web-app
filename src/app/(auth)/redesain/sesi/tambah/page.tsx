import { auth } from "@/lib/auth/auth";
import { fetchOpsiFormSesi } from "../data";
import { SesiForm } from "../sesi-form";

export const metadata = { title: "Tambah Sesi — Redesain Pekerjaan" };

/** Halaman tambah sesi partisipasi (Server Component; opsi form gagal → melempar). */
export default async function TambahSesiPage() {
  const session = await auth();
  const opsi = await fetchOpsiFormSesi(session?.accessToken);
  return (
    <div className="space-y-4">
      <h1 className="page-heading">Tambah Sesi Partisipasi</h1>
      <SesiForm {...opsi} accessToken={session?.accessToken} />
    </div>
  );
}
