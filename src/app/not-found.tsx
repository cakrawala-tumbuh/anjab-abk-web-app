import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">404 — Halaman tidak ditemukan</h1>
      <p className="text-gray-600">Halaman yang Anda cari tidak ada.</p>
      <Link href="/dashboard" className="text-blue-600 underline hover:text-blue-800">
        Kembali ke dashboard
      </Link>
    </main>
  );
}
