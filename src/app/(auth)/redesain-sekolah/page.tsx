import Link from "next/link";
import { GagalMuat } from "@/components/gagal-muat";
import { ApiError } from "@/lib/api/errors";
import { auth } from "@/lib/auth/auth";
import { fetchDaftarMasalahSekolah } from "./data";
import { MulaiIsiTombol } from "./mulai-isi-tombol";

export const metadata = { title: "Konfirmasi Redesain — Sekolah" };

/**
 * Daftar masalah sekolah yang dibuka untuk konfirmasi + status isian pemanggil.
 *
 * Status per masalah digabung dari `konfirmasi/saya`: belum ada → "Mulai isi"; `draf` →
 * "Lanjutkan"; `terkirim` → "Lihat". Rumusan dugaan tidak pernah dimuat di sini.
 */
export default async function RedesainSekolahPage() {
  const session = await auth();
  let data;
  try {
    data = await fetchDaftarMasalahSekolah(session?.accessToken);
  } catch (err) {
    if (err instanceof ApiError) return <GagalMuat judul="Konfirmasi Redesain" err={err} />;
    throw err;
  }

  const perMasalah = new Map(data.konfirmasi.map((k) => [k.masalah_id, k]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-heading">Konfirmasi Redesain</h1>
        <p className="page-subtext">
          Isi satu konfirmasi untuk tiap masalah sekolah Anda. Anda mengisi sendiri, tanpa
          fasilitator: ceritakan dahulu dengan kata-kata Anda, baru dugaan Tim Kajian diperlihatkan.
        </p>
      </div>

      {data.masalah.length === 0 ? (
        <div className="empty-state text-sm text-gray-500">
          Belum ada masalah yang dibuka untuk sekolah Anda.
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2">Kode</th>
                <th className="px-4 py-2">Konteks</th>
                <th className="px-4 py-2">Periode acuan</th>
                <th className="px-4 py-2">Sumber awal keterbatasan</th>
                <th className="px-4 py-2">Status awal</th>
                <th className="px-4 py-2">Isian Anda</th>
                <th className="px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.masalah.map((m) => {
                const k = perMasalah.get(m.id);
                return (
                  <tr key={m.id} className="border-t align-top dark:border-gray-700">
                    <td className="px-4 py-2 font-mono">{m.kode}</td>
                    <td className="px-4 py-2">
                      {m.konteks_kode} — {m.konteks_tema}
                    </td>
                    <td className="px-4 py-2">{m.periode_acuan}</td>
                    <td className="px-4 py-2 whitespace-normal break-words">
                      {m.sumber_awal_keterbatasan}
                    </td>
                    <td className="px-4 py-2">{m.status_awal}</td>
                    <td className="px-4 py-2">
                      {!k ? "Belum diisi" : k.status === "terkirim" ? "Terkirim" : "Draf"}
                    </td>
                    <td className="px-4 py-2">
                      {!k ? (
                        <MulaiIsiTombol masalahId={m.id} accessToken={session?.accessToken} />
                      ) : (
                        <Link
                          href={`/redesain-sekolah/konfirmasi/${k.id}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          {k.status === "terkirim" ? "Lihat" : "Lanjutkan"}
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
