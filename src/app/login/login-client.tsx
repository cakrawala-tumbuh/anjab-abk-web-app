"use client";
import { signIn } from "next-auth/react";
import { useEffect } from "react";

export default function LoginClient({ callbackUrl }: { callbackUrl?: string }) {
  useEffect(() => {
    signIn("authentik", { callbackUrl: callbackUrl ?? "/dashboard" }, { prompt: "login" });
  }, [callbackUrl]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-500 dark:text-gray-400">Mengalihkan ke halaman login...</p>
    </div>
  );
}
