import type { ReactNode } from "react";
import { auth } from "@/lib/auth/auth";

/**
 * Guard grup untuk sebuah segmen rute (Server Component).
 *
 * Bila sesi tidak memiliki `grup`, merender state "Tidak berhak mengakses halaman ini"
 * dan TIDAK merender `children` — sehingga halaman anak tidak sempat memanggil backend.
 * Guard ini hanya kenyamanan UI; penegak sebenarnya tetap backend (403 dari backend
 * tetap dilempar ke `error.tsx`).
 *
 * @param props.grup - Nama grup Authentik yang disyaratkan (mis. `"tim-kajian"`).
 * @param props.children - Isi yang hanya tampil untuk anggota grup.
 * @returns `children` bila sesi punya grup tersebut; panel penolakan bila tidak.
 */
export async function WajibGrup({ grup, children }: { grup: string; children: ReactNode }) {
  const session = await auth();
  const berhak = session?.user?.groups?.includes(grup) ?? false;

  if (!berhak) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
      >
        <p className="font-medium">Tidak berhak mengakses halaman ini.</p>
        <p className="mt-1">
          Halaman ini hanya untuk pengguna dengan peran tertentu. Hubungi administrator bila Anda
          merasa seharusnya memiliki akses.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
