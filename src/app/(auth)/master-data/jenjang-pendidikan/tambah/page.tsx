import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { TambahJenjangForm } from "./jenjang-form";

export const metadata = { title: "Tambah Jenjang Pendidikan — Master Data" };

export default async function TambahJenjangPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Tambah Jenjang Pendidikan</h2>
        <p className="page-subtext">
          Jenjang pendidikan digunakan sebagai referensi saat mendaftarkan sekolah.
        </p>
      </div>
      <div className="max-w-xl">
        <TambahJenjangForm accessToken={session?.accessToken} />
      </div>
    </div>
  );
}
