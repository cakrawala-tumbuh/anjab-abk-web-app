import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isPartisipan } from "@/lib/auth/auth";
import { TsLogForm } from "./ts-log-form";

export const metadata = { title: "Tambah Log Harian — Time Study — ANJAB-ABK" };

interface Props {
  params: Promise<{ responden_id: string }>;
}

export default async function TambahLogPage({ params }: Props) {
  const session = await auth();
  if (!isPartisipan(session)) notFound();

  const { responden_id } = await params;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/kuesioner" className="hover:text-gray-700">
          Kuesioner Saya
        </Link>
        <span>/</span>
        <Link href={`/time-study/isi/${responden_id}`} className="hover:text-gray-700">
          Time Study
        </Link>
        <span>/</span>
        <span className="text-gray-900">Tambah Log</span>
      </div>

      <div>
        <h1 className="page-heading">Tambah Log Harian</h1>
        <p className="page-subtext">Catat distribusi waktu aktivitas kerja untuk hari ini.</p>
      </div>

      <TsLogForm respondenId={responden_id} accessToken={session?.accessToken} />
    </div>
  );
}
