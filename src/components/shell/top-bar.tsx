import Link from "next/link";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function TopBar({
  username,
  onToggleSidebar,
}: {
  username?: string | null;
  onToggleSidebar: () => void;
}) {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-900 sm:px-4">
      <button
        type="button"
        aria-label="Buka/tutup menu"
        onClick={onToggleSidebar}
        className="inline-flex size-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <Link
        href="/dashboard"
        className="truncate text-sm font-semibold text-gray-900 sm:text-base dark:text-gray-50"
      >
        ANJAB-ABK
      </Link>

      <div className="ml-auto flex items-center gap-3">
        {username && (
          <span className="hidden text-sm text-gray-500 sm:inline dark:text-gray-400">
            {username}
          </span>
        )}
        <ThemeToggle />
        {/* Logout via route handler — Auth.js v5 beta tidak mendukung external
            redirectTo dari server action, sehingga dipakai GET ke /api/auth/logout
            yang menangani RP-initiated logout ke Authentik. */}
        <Link
          href="/api/auth/logout"
          className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          Keluar
        </Link>
      </div>
    </header>
  );
}
