import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { TambahMataPelajaranForm } from "./mata-pelajaran-form";

export const metadata = { title: "Tambah Mata Pelajaran — Master Data" };

export default async function TambahMataPelajaranPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Tambah Mata Pelajaran</h2>
        <p className="mt-1 text-sm text-gray-500">
          Mata pelajaran digunakan sebagai referensi jabatan guru dalam analisis jabatan.
        </p>
      </div>
      <div className="max-w-xl">
        <TambahMataPelajaranForm accessToken={session?.accessToken} />
      </div>
    </div>
  );
}
