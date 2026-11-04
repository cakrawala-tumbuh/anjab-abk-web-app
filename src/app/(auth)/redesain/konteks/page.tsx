import { DetailsMuatMalas } from "@/components/details-muat-malas";
import { auth } from "@/lib/auth/auth";
import { LABEL_BELUM_TEMUAN } from "@/lib/redesain-register";
import { fetchKonteks } from "./data";
import { KonteksForm } from "./konteks-form";
import { PetunjukKonteks } from "./petunjuk-konteks";

export const metadata = { title: "Konteks — Redesain Pekerjaan" };

/**
 * Halaman katalog Konteks redesain (Server Component).
 *
 * Judul memuat label tetap "BELUM MENJADI TEMUAN". Kegagalan backend dilempar ke
 * `error.tsx`, tidak pernah tabel kosong. Tidak ada tombol hapus (backend tanpa DELETE);
 * konteks dinonaktifkan lewat kotak "Aktif".
 */
export default async function KonteksPage() {
  const session = await auth();
  const konteks = await fetchKonteks(session?.accessToken);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-heading">
          Konteks Redesain{" "}
          <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 align-middle text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
            {LABEL_BELUM_TEMUAN}
          </span>
        </h1>
        <PetunjukKonteks />
      </div>
      <details className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <summary className="cursor-pointer font-medium">Tambah konteks</summary>
        <div className="mt-3">
          <KonteksForm accessToken={session?.accessToken} />
        </div>
      </details>

      {konteks.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada konteks.</p>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {["Kode", "Tema", "Gelombang", "Aktif", "Aksi"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {konteks.map((k) => (
                <tr key={k.id} className="align-top">
                  <td className="px-4 py-3 font-mono text-xs">{k.kode}</td>
                  <td className="px-4 py-3 whitespace-normal break-words">{k.tema}</td>
                  <td className="px-4 py-3">{k.gelombang}</td>
                  <td className="px-4 py-3">{k.aktif ? "Ya" : "Tidak"}</td>
                  <td className="px-4 py-3">
                    <DetailsMuatMalas
                      ringkasan="Ubah"
                      summaryClassName="cursor-pointer text-blue-600 dark:text-blue-400"
                    >
                      <div className="mt-2">
                        <KonteksForm awal={k} accessToken={session?.accessToken} />
                      </div>
                    </DetailsMuatMalas>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
