import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
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
  const res = await client.GET("/api/v1/dcs/sub-skala/{kode}", {
    params: { path: { kode } },
  });
  if (!res.data) throw apiErrorDari(res);
  return res.data;
}

/**
 * Ambil ETag tiap item dari `GET /api/v1/dcs/sub-skala/items/{item_id}` untuk dipakai sebagai `If-Match` oleh editor.
 *
 * @param items - Item yang ditampilkan editor.
 * @param accessToken - Bearer token sesi.
 * @returns Peta `item_id` → ETag (`null` bila backend tidak mengirim header).
 * @throws ApiError bila salah satu GET gagal (jalur baca tidak boleh menelan kegagalan).
 */
async function fetchEtagItem(
  items: { item_id: string }[],
  accessToken: string | undefined,
): Promise<Record<string, string | null>> {
  const client = withServerAuth(accessToken);
  const hasil = await Promise.all(
    items.map(async (it) => {
      const res = await client.GET("/api/v1/dcs/sub-skala/items/{item_id}", {
        params: { path: { item_id: it.item_id } },
      });
      if (!res.data) throw apiErrorDari(res);
      return [it.item_id, res.response.headers.get("etag")] as const;
    }),
  );
  return Object.fromEntries(hasil);
}

export default async function DcsSubSkalaDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { kode } = await params;
  const subSkala = await fetchSubSkala(kode, session?.accessToken);
  const etags = await fetchEtagItem(subSkala.items, session?.accessToken);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/master-data/dcs"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Kembali ke daftar sub-skala
        </Link>
        <h2 className="mt-2 text-lg font-semibold text-gray-900">
          {subSkala.nama} <span className="font-mono text-sm text-gray-400">({subSkala.kode})</span>
        </h2>
        <p className="page-subtext">
          {subSkala.items.length} item. Klik &ldquo;Ubah&rdquo; untuk menyunting pernyataan, arah
          (F/UF), atau urutan.
        </p>
      </div>

      <DcsItemEditor items={subSkala.items} accessToken={session?.accessToken} etags={etags} />
    </div>
  );
}
