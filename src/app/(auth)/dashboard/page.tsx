import Link from "next/link";
import { auth, isAdmin, isPartisipan } from "@/lib/auth/auth";

export default async function DashboardPage() {
  const session = await auth();
  const admin = isAdmin(session);
  const partisipan = isPartisipan(session);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Selamat datang, {session?.user?.name ?? "Pengguna"}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {admin && (
          <Link
            href="/partisipan"
            className="rounded-lg border border-gray-200 bg-white p-6 hover:border-blue-300 hover:shadow-sm"
          >
            <h2 className="font-medium text-gray-900">Kelola Partisipan</h2>
            <p className="mt-1 text-sm text-gray-500">Tambah dan kelola partisipan ANJAB-ABK.</p>
          </Link>
        )}
        {partisipan && !admin && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="font-medium text-gray-900">Kuesioner Saya</h2>
            <p className="mt-1 text-sm text-gray-500">Lihat dan isi kuesioner yang ditugaskan.</p>
          </div>
        )}
      </div>

      {!admin && !partisipan && (
        <p className="text-sm text-gray-500">
          Akun Anda belum tergabung ke grup manapun. Hubungi administrator.
        </p>
      )}
    </div>
  );
}
