import Link from "next/link";
import { auth, isAdmin, isPartisipan } from "@/lib/auth/auth";

export default async function DashboardPage() {
  const session = await auth();
  const admin = isAdmin(session);
  const partisipan = isPartisipan(session);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">Dashboard</h1>
        <p className="page-subtext">Selamat datang, {session?.user?.name ?? "Pengguna"}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {admin && (
          <Link
            href="/partisipan"
            className="page-card hover:border-blue-300 hover:shadow-sm dark:hover:border-blue-600"
          >
            <h2 className="font-medium text-gray-900 dark:text-gray-50">Kelola Partisipan</h2>
            <p className="page-subtext">Tambah dan kelola partisipan ANJAB-ABK.</p>
          </Link>
        )}
        {admin && (
          <Link
            href="/task-inventory"
            className="page-card hover:border-blue-300 hover:shadow-sm dark:hover:border-blue-600"
          >
            <h2 className="font-medium text-gray-900 dark:text-gray-50">Task Inventory</h2>
            <p className="page-subtext">
              Inventori tugas 2 tahap: seleksi relevansi lalu detailing beban kerja.
            </p>
          </Link>
        )}
        {admin && (
          <Link
            href="/time-study"
            className="page-card hover:border-blue-300 hover:shadow-sm dark:hover:border-blue-600"
          >
            <h2 className="font-medium text-gray-900 dark:text-gray-50">Time Study</h2>
            <p className="page-subtext">
              Studi Waktu — kelola sesi pencatatan log harian per jabatan.
            </p>
          </Link>
        )}
        {admin && (
          <Link
            href="/opm"
            className="page-card hover:border-blue-300 hover:shadow-sm dark:hover:border-blue-600"
          >
            <h2 className="font-medium text-gray-900 dark:text-gray-50">OPM — Rating Tugas</h2>
            <p className="page-subtext">
              Rating Importance/Frequency/Criticality atas task hasil Task Inventory.
            </p>
          </Link>
        )}
        {partisipan && !admin && (
          <Link
            href="/kuesioner"
            className="page-card hover:border-blue-300 hover:shadow-sm dark:hover:border-blue-600"
          >
            <h2 className="font-medium text-gray-900 dark:text-gray-50">Kuesioner Saya</h2>
            <p className="page-subtext">Lihat dan isi kuesioner yang ditugaskan.</p>
          </Link>
        )}
      </div>

      {!admin && !partisipan && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Akun Anda belum tergabung ke grup manapun. Hubungi administrator.
        </p>
      )}
    </div>
  );
}
