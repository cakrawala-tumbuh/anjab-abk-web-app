import Link from "next/link";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { auth } from "@/lib/auth/auth";
import { DetailRun } from "./detail-run";

export const metadata = { title: "Detail Run AI" };

/**
 * Halaman admin `/sistem/ai/run/[run_id]`: satu baris register run (Server Component).
 *
 * Kegagalan (termasuk 404) dilempar ke `error.tsx`. Guard admin ada di layout `/sistem`.
 */
export default async function RunAiPage({ params }: { params: Promise<{ run_id: string }> }) {
  const { run_id } = await params;
  const session = await auth();
  const res = await withServerAuth(session?.accessToken).GET("/api/v1/system/ai/runs/{run_id}", {
    params: { path: { run_id } },
  });
  if (!res.data) throw apiErrorDari(res);

  return (
    <div className="space-y-4">
      <Link href="/sistem/ai" className="text-sm text-blue-600 underline dark:text-blue-400">
        &larr; Saklar &amp; Run AI
      </Link>
      <h1 className="page-heading">Detail Run AI</h1>
      <DetailRun run={res.data} />
    </div>
  );
}
