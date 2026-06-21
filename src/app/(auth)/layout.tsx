import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { auth, isAdmin } from "@/lib/auth/auth";
import { ThemeToggle } from "@/components/theme-toggle";

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
      <nav className="border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/dashboard" className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            ANJAB-ABK
          </Link>
          <div className="flex items-center gap-6">
            {admin && (
              <>
                <Link
                  href="/master-data"
                  className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50"
                >
                  Master Data
                </Link>
                <Link
                  href="/partisipan"
                  className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50"
                >
                  Partisipan
                </Link>
                <Link
                  href="/dcs"
                  className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50"
                >
                  DCS
                </Link>
                <Link
                  href="/wcp"
                  className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50"
                >
                  WCP
                </Link>
                <Link
                  href="/task-inventory"
                  className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50"
                >
                  Task Inventory
                </Link>
              </>
            )}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">{session.user?.name}</span>
              <ThemeToggle />
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
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
