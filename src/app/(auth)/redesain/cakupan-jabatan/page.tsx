import { auth } from "@/lib/auth/auth";
import { CABANG_CAKUPAN, susunBarisCakupan } from "@/lib/redesain-cakupan";
import { fetchDataCakupan } from "./data";
import { SelCabang } from "./sel-cabang";

export const metadata = { title: "Cakupan 19 Jabatan — Redesain Pekerjaan" };

/**
 * Halaman Cakupan 19 Jabatan (Server Component).
 *
 * Menyusun record CAKUPAN_19 (role × cabang) menjadi satu baris per role dengan sel
 * Bandung dan Semarang. Baris tidak ditambah/dihapus dari UI (berasal dari seed backend).
 * Kegagalan backend dilempar ke `error.tsx`.
 */
export default async function CakupanJabatanPage() {
  const session = await auth();
  const { cakupan, jabatan } = await fetchDataCakupan(session?.accessToken);
  const baris = susunBarisCakupan(cakupan);

  return (
    <div className="space-y-4">
      <h1 className="page-heading">Cakupan 19 Jabatan</h1>
      {baris.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada data cakupan.</p>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {["Role", "Jabatan", ...CABANG_CAKUPAN].map((h) => (
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
              {baris.map((b) => (
                <tr key={b.role_kode} className="align-top">
                  <td className="px-4 py-3 font-mono text-xs">{b.role_kode}</td>
                  <td className="px-4 py-3">{b.nama_jabatan}</td>
                  {CABANG_CAKUPAN.map((c) => {
                    const rec = b.sel[c];
                    return (
                      <td key={c} className="px-4 py-3">
                        {rec ? (
                          <SelCabang
                            rec={rec}
                            jabatan={jabatan}
                            accessToken={session?.accessToken}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
