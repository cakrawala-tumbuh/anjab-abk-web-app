import { Suspense } from "react";
import LoginClient from "./login-client";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return (
    <Suspense>
      <LoginClient callbackUrl={callbackUrl} />
    </Suspense>
  );
}
