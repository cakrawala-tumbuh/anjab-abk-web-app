import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { ResetKatalogPanel } from "./reset-katalog-panel";

export const metadata = { title: "Utilitas Katalog TI — Master Data" };

async function fetchTotalKatalog(accessToken: string | undefined): Promise<number> {
  const client = withServerAuth(accessToken);
  const { data, response } = await client.GET("/api/v1/task-inventory/uraian-tugas", {
    params: { query: { limit: 1 } },
  });
  const requestId = response.headers.get("x-request-id");
  if (!data) throw toApiError(null, requestId);
  return data.total;
}

export default async function UtilitasKatalogTiPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const total = await fetchTotalKatalog(session?.accessToken);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Utilitas Katalog Task Inventory
        </h2>
        <p className="page-subtext">
          Ganti total katalog master (Tugas Pokok, Detil Tugas, Uraian Tugas) saat
          <code className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">
            task_catalog.json
          </code>
          diperbarui. Katalog saat ini: {total} uraian tugas.
        </p>
      </div>

      <ResetKatalogPanel accessToken={session?.accessToken} initialTotal={total} />
    </div>
  );
}
