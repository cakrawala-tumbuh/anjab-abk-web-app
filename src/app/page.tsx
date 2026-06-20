import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

/** Root page — redirect ke dashboard bila sudah login, ke login bila belum. */
export default async function HomePage() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }
  redirect("/login");
}
