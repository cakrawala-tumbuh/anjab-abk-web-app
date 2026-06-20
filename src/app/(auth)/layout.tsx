import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { auth, isAdmin } from "@/lib/auth/auth";

/** Layout semua route yang butuh autentikasi. Middleware sudah menangani redirect
 *  untuk pengguna yang belum login, tapi kita verifikasi di sini juga untuk keamanan. */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin/authentik");
  }

  const admin = isAdmin(session);

  return (
    <div className="min-h-screen">
      <nav className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/dashboard" className="text-lg font-semibold text-gray-900">
            ANJAB-ABK
          </Link>
          <div className="flex items-center gap-6">
            {admin && (
              <>
                <Link href="/master-data" className="text-sm text-gray-600 hover:text-gray-900">
                  Master Data
                </Link>
                <Link href="/partisipan" className="text-sm text-gray-600 hover:text-gray-900">
                  Partisipan
                </Link>
                <Link href="/dcs" className="text-sm text-gray-600 hover:text-gray-900">
                  DCS
                </Link>
                <Link href="/wcp" className="text-sm text-gray-600 hover:text-gray-900">
                  WCP
                </Link>
              </>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{session.user?.name}</span>
              <form action="/api/auth/signout" method="POST">
                <button type="submit" className="text-sm text-gray-400 hover:text-gray-600">
                  Keluar
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
