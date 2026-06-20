import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { DcsSubSkalaWithItemsRead } from "@/lib/api/schema";
import { DcsItemEditor } from "./dcs-item-editor";

interface PageProps {
  params: Promise<{ kode: string }>;
}

export const metadata = { title: "Item Sub-Skala DCS — Master Data" };

async function fetchSubSkala(
  kode: string,
  accessToken: string | undefined,
): Promise<DcsSubSkalaWithItemsRead> {
  const client = withServerAuth(accessToken);
  const { data, response } = await client.GET("/api/v1/dcs/sub-skala/{kode}", {
    params: { path: { kode } },
  });
  const requestId = response.headers.get("x-request-id");
  if (!data) throw toApiError(null, requestId);
  return data;
}

export default async function DcsSubSkalaDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { kode } = await params;
  const subSkala = await fetchSubSkala(kode, session?.accessToken);

  return (
    <div className="space-y-4">
      <div>
        <Link href="/master-data/dcs" className="text-sm text-gray-500 hover:text-gray-700">
          ← Kembali ke daftar sub-skala
        </Link>
        <h2 className="mt-2 text-lg font-semibold text-gray-900">
          {subSkala.nama} <span className="font-mono text-sm text-gray-400">({subSkala.kode})</span>
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {subSkala.items.length} item. Klik &ldquo;Ubah&rdquo; untuk menyunting pernyataan, arah
          (F/UF), atau urutan.
        </p>
      </div>

      <DcsItemEditor items={subSkala.items} accessToken={session?.accessToken} />
    </div>
  );
}
