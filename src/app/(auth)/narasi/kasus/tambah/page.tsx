import { auth } from "@/lib/auth/auth";
import { KasusForm } from "../kasus-form";

export const metadata = { title: "Buat Kasus Narasi" };

/** Halaman buat Kasus Narasi (Server Component): meneruskan token akses ke {@link KasusForm}. */
export default async function TambahKasusPage() {
  const session = await auth();
  return (
    <div className="space-y-4">
      <h1 className="page-heading">Buat Kasus Narasi</h1>
      <KasusForm accessToken={session?.accessToken} />
    </div>
  );
}
