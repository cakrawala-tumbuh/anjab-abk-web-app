import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { auth } from "@/lib/auth/auth";

/** Layout semua route yang butuh autentikasi. Middleware sudah menangani redirect
 *  untuk pengguna yang belum login, tapi kita verifikasi di sini juga untuk keamanan. */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin/authentik");
  }

  return (
    <AppShell groups={session.user.groups} username={session.user?.name}>
      {children}
    </AppShell>
  );
}
