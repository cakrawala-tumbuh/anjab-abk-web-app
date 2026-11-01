import { auth } from "@/lib/auth/auth";
import { fetchOpsiFormMasalah } from "../data";
import { MasalahForm } from "../masalah-form";

export const metadata = { title: "Tambah Masalah — Redesain Pekerjaan" };

/** Halaman tambah masalah redesain (Server Component; opsi form gagal → melempar). */
export default async function TambahMasalahPage() {
  const session = await auth();
  const opsi = await fetchOpsiFormMasalah(session?.accessToken);
  return (
    <div className="space-y-4">
      <h1 className="page-heading">Tambah Masalah</h1>
      <MasalahForm {...opsi} accessToken={session?.accessToken} />
    </div>
  );
}
