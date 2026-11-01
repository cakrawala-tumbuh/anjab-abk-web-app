import Link from "next/link";
import { GagalMuat } from "@/components/gagal-muat";
import { ApiError } from "@/lib/api/errors";
import { auth } from "@/lib/auth/auth";
import { idDigantikan } from "@/lib/redesain-konfirmasi";
import { fetchDaftarMasalahSekolah } from "../data";
import { RalatTombol } from "./ralat-tombol";

export const metadata = { title: "Isian Saya — Redesain Sekolah" };

/** Format cap waktu ISO menjadi tanggal-waktu lokal singkat; `—` bila kosong. */
function waktu(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Seluruh isian konfirmasi milik pemanggil (draf, terkirim, dan ralatnya).
 *
 * Record dianggap digantikan bila ada record lain di daftar yang `menggantikan_id`-nya
 * menunjuknya (dihitung di web). Tombol "Ralat isian" hanya pada record `terkirim` yang
 * tidak digantikan. Kegagalan API (mis. 403) melempar ke panel galat, bukan daftar kosong.
 */
export default async function IsianSayaPage() {
  const session = await auth();
  let data;
  try {
    data = await fetchDaftarMasalahSekolah(session?.accessToken);
  } catch (err) {
    if (err instanceof ApiError) return <GagalMuat judul="Isian Saya" err={err} />;
    throw err;
  }

  const kodeMasalah = new Map(data.masalah.map((m) => [m.id, m.kode]));
  const digantikan = idDigantikan(data.konfirmasi);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-heading">Isian Saya</h1>
        <p className="page-subtext">
          Seluruh konfirmasi yang pernah Anda isi. Isian terkirim tidak pernah ditimpa: meralat
          membuat versi baru.
        </p>
      </div>

      {data.konfirmasi.length === 0 ? (
        <div className="empty-state text-sm text-gray-500">Belum ada isian.</div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2">Masalah</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Dikirim pada</th>
                <th className="px-4 py-2">Keterangan</th>
                <th className="px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.konfirmasi.map((k) => {
                const sudahDigantikan = digantikan.has(k.id);
                return (
                  <tr key={k.id} className="border-t align-top dark:border-gray-700">
                    <td className="px-4 py-2 font-mono">
                      {kodeMasalah.get(k.masalah_id) ?? k.masalah_id}
                    </td>
                    <td className="px-4 py-2">{k.status === "terkirim" ? "Terkirim" : "Draf"}</td>
                    <td className="px-4 py-2">{waktu(k.dikirim_pada)}</td>
                    <td className="px-4 py-2">
                      {k.menggantikan_id && <p>Ralat dari versi sebelumnya</p>}
                      {sudahDigantikan && <p>Sudah digantikan oleh ralat</p>}
                    </td>
                    <td className="px-4 py-2 space-y-1">
                      <Link
                        href={`/redesain-sekolah/konfirmasi/${k.id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        {k.status === "terkirim" ? "Lihat" : "Lanjutkan"}
                      </Link>
                      {k.status === "terkirim" && !sudahDigantikan && (
                        <RalatTombol konfirmasiId={k.id} accessToken={session?.accessToken} />
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
