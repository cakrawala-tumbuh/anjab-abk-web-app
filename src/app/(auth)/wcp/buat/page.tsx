import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { WcpSesiForm } from "./wcp-sesi-form";

export const metadata = { title: "Buat Sesi WCP — ANJAB-ABK" };

export default async function BuatWcpSesiPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/wcp" className="hover:text-gray-700">
          Sesi WCP
        </Link>
        <span>/</span>
        <span className="text-gray-900">Buat Sesi</span>
      </div>

      <div>
        <h1 className="page-heading">Buat Sesi WCP</h1>
        <p className="page-subtext">
          Isi periode survei. Setelah dibuat, buka sesi untuk mulai mendaftarkan responden.
        </p>
      </div>

      <WcpSesiForm accessToken={session?.accessToken} />
    </div>
  );
}
