import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { WcpDimensiWithItemsRead } from "@/lib/api/schema";
import { WcpItemEditor } from "./wcp-item-editor";

interface PageProps {
  params: Promise<{ kode: string }>;
}

export const metadata = { title: "Item Dimensi WCP — Master Data" };

async function fetchDimensi(
  kode: string,
  accessToken: string | undefined,
): Promise<WcpDimensiWithItemsRead> {
  const client = withServerAuth(accessToken);
  const { data, response } = await client.GET("/api/v1/wcp/dimensi/{kode}", {
    params: { path: { kode } },
  });
  const requestId = response.headers.get("x-request-id");
  if (!data) throw toApiError(null, requestId);
  return data;
}

export default async function WcpDimensiDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { kode } = await params;
  const dimensi = await fetchDimensi(kode, session?.accessToken);

  return (
    <div className="space-y-4">
      <div>
        <Link href="/master-data/wcp" className="text-sm text-gray-500 hover:text-gray-700">
          ← Kembali ke daftar dimensi
        </Link>
        <h2 className="mt-2 flex items-center gap-2 text-lg font-semibold text-gray-900">
          {dimensi.nama} <span className="font-mono text-sm text-gray-400">({dimensi.kode})</span>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              dimensi.is_risk ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}
          >
            {dimensi.is_risk ? "Risiko" : "Protektif"}
          </span>
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {dimensi.items.length} item. Klik &ldquo;Ubah&rdquo; untuk menyunting pernyataan, tipe
          scoring, atau urutan.
        </p>
      </div>

      <WcpItemEditor items={dimensi.items} accessToken={session?.accessToken} />
    </div>
  );
}
