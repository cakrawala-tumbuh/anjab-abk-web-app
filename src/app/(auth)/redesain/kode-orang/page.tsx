import { auth } from "@/lib/auth/auth";
import { fetchDataKodeOrang } from "./data";
import { TambahKodeOrang } from "./tambah-kode-orang";
import { UbahKeterangan } from "./ubah-keterangan";

export const metadata = { title: "Kode Orang — Redesain Pekerjaan" };

/**
 * Halaman Kode Orang (Server Component).
 *
 * Satu-satunya layar redesain yang boleh menampilkan NAMA partisipan (peta kode ↔ partisipan
 * hanya untuk `tim-kajian`). Kegagalan backend dilempar ke `error.tsx`, tidak pernah tabel
 * kosong. Tidak ada tombol hapus (backend tak menyediakan DELETE).
 */
export default async function KodeOrangPage() {
  const session = await auth();
  const { kodeOrang, partisipan } = await fetchDataKodeOrang(session?.accessToken);
  const namaPartisipan = new Map(partisipan.map((p) => [p.id, p.nama]));

  return (
    <div className="space-y-4">
      <h1 className="page-heading">Kode Orang</h1>
      <TambahKodeOrang partisipan={partisipan} accessToken={session?.accessToken} />

      {kodeOrang.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada kode orang.</p>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {["Kode", "Keterangan peran", "Partisipan", "Dibuat"].map((h) => (
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
              {kodeOrang.map((k) => (
                <tr key={k.id} className="align-top">
                  <td className="px-4 py-3 font-mono text-xs">{k.kode}</td>
                  <td className="px-4 py-3">
                    <UbahKeterangan
                      id={k.id}
                      awal={k.keterangan_peran ?? ""}
                      accessToken={session?.accessToken}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {k.partisipan_id
                      ? (namaPartisipan.get(k.partisipan_id) ?? k.partisipan_id)
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                    {k.created_at}
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
