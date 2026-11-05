import Link from "next/link";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { auth } from "@/lib/auth/auth";
import { PenyediaPanel } from "./penyedia-panel";

export const metadata = { title: "Penyedia AI" };

/**
 * Halaman admin `/sistem/ai/penyedia`: pengaturan penyedia model AI (Server Component).
 *
 * Membaca `GET /api/v1/system/ai/penyedia` dan `GET /api/v1/system/ai/saklar`; keduanya data
 * inti, jadi kegagalan dilempar (`apiErrorDari`) ke `error.tsx` dan tidak pernah menjadi panel
 * kosong. Guard admin ada di layout segmen `sistem`. Respons API tidak memuat kunci API;
 * hanya status dan empat karakter akhirnya yang diteruskan ke Client Component.
 */
export default async function PenyediaAiPage() {
  const session = await auth();
  const client = withServerAuth(session?.accessToken);
  const [penyediaRes, saklarRes] = await Promise.all([
    client.GET("/api/v1/system/ai/penyedia"),
    client.GET("/api/v1/system/ai/saklar"),
  ]);
  if (!penyediaRes.data) throw apiErrorDari(penyediaRes);
  if (!saklarRes.data) throw apiErrorDari(saklarRes);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm">
          <Link href="/sistem/ai" className="text-blue-600 underline">
            ← Saklar &amp; Run AI
          </Link>
        </p>
        <h1 className="page-heading">Penyedia AI</h1>
        <p className="page-subtext">
          Pilih Anthropic API atau langganan Anthropic, atur model dan effort, serta pasang kunci
          API. Kunci tidak pernah ditampilkan kembali.
        </p>
      </div>
      <PenyediaPanel
        penyedia={penyediaRes.data}
        saklar={saklarRes.data}
        accessToken={session?.accessToken}
      />
    </div>
  );
}
