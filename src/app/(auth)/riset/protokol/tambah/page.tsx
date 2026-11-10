import { auth } from "@/lib/auth/auth";
import { ProtokolForm } from "../protokol-form";

export const metadata = { title: "Tambah Protokol Riset" };

/** Halaman tambah protokol riset (Server Component): meneruskan token ke formulir. */
export default async function TambahProtokolPage() {
  const session = await auth();
  return (
    <div className="space-y-4">
      <h1 className="page-heading">Tambah Protokol Riset</h1>
      <ProtokolForm accessToken={session?.accessToken} />
    </div>
  );
}
