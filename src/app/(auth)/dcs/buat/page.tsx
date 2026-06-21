import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { DcsSesiForm } from "./dcs-sesi-form";

export const metadata = { title: "Buat Sesi DCS — ANJAB-ABK" };

export default async function BuatDcsSesiPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dcs" className="hover:text-gray-700">
          Sesi DCS
        </Link>
        <span>/</span>
        <span className="text-gray-900">Buat Sesi</span>
      </div>

      <div>
        <h1 className="page-heading">Buat Sesi DCS</h1>
        <p className="page-subtext">
          Isi periode survei. Setelah dibuat, buka sesi untuk mulai mendaftarkan responden.
        </p>
      </div>

      <DcsSesiForm accessToken={session?.accessToken} />
    </div>
  );
}
