import type { MasalahRead, SekolahRead } from "@/lib/api/schema";
import { asalKoreksi, formatWaktu, kodeBuktiPerLangkah } from "@/lib/redesain-alur";
import { fetchAlurMasalah } from "./data";
import { fetchBuktiMasalah } from "./data-bukti";
import { FormKoreksi } from "./form-koreksi";
import { FormLangkah } from "./form-langkah";
import { FormProses } from "./form-proses";

/** Properti {@link BagianAlur}. */
export interface BagianAlurProps {
  masalah: MasalahRead;
  /** Sekolah master (pilihan form proses saat masalah belum bersekolah). */
  sekolah: SekolahRead[];
  accessToken: string | undefined;
}

/**
 * Bagian "Alur" pada detail masalah (Server Component async).
 *
 * Menampilkan proses beserta langkah terurut `urutan` dan koreksinya (kolom `waktu`,
 * `kode_orang`, `isi`, asal Konfirmasi/Tim) — orang hanya tampil sebagai kode, tidak ada
 * nama. Kegagalan backend dilempar ke `error.tsx`. Menyediakan form tambah/ubah proses
 * dan langkah serta tambah koreksi Tim. Tiap langkah menampilkan kode bukti yang ditautkan
 * (dari `POST /bukti/search` yang sama untuk satu halaman). Proses sekolah berbeda tidak pernah digabung:
 * tiap proses tampil dalam kartunya sendiri.
 *
 * @param props - Lihat {@link BagianAlurProps}.
 */
export async function BagianAlur({ masalah, sekolah, accessToken }: BagianAlurProps) {
  const [alur, bukti] = await Promise.all([
    fetchAlurMasalah(accessToken, masalah.id),
    fetchBuktiMasalah(accessToken, masalah.id),
  ]);
  const buktiPerLangkah = kodeBuktiPerLangkah(bukti);
  const petaSekolah = new Map(sekolah.map((s) => [s.id, s.nama]));

  return (
    <section aria-label="Alur" className="space-y-6">
      {alur.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Belum ada proses untuk masalah ini.
        </p>
      )}
      {alur.map(({ proses, langkah }) => (
        <article
          key={proses.id}
          className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
        >
          <header>
            <h2 className="text-base font-semibold">
              <span className="font-mono text-xs">{proses.kode}</span> {proses.nama_proses}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {petaSekolah.get(proses.sekolah_id) ?? proses.sekolah_id} · {proses.periode}
            </p>
          </header>
          <details>
            <summary className="cursor-pointer text-xs text-blue-600 dark:text-blue-400">
              Ubah proses
            </summary>
            <div className="mt-2">
              <FormProses
                masalahId={masalah.id}
                sekolahTerkunci={masalah.sekolah_id}
                sekolah={sekolah}
                periodeBawaan={masalah.periode_acuan}
                awal={proses}
                accessToken={accessToken}
              />
            </div>
          </details>

          {langkah.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada langkah.</p>
          ) : (
            <ol className="space-y-3">
              {langkah.map(({ langkah: l, koreksi }) => (
                <li
                  key={l.id}
                  className="space-y-2 rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800"
                >
                  <p className="font-medium">
                    {l.urutan}. <span className="font-mono text-xs">{l.kode}</span> {l.tahap}{" "}
                    <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-700">
                      {l.status_langkah}
                    </span>
                  </p>
                  <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[10rem_1fr]">
                    <dt className="text-gray-500">Pemicu / masukan</dt>
                    <dd>{l.pemicu_input}</dd>
                    <dt className="text-gray-500">Pelaksana</dt>
                    <dd>{l.pelaksana}</dd>
                    <dt className="text-gray-500">Pekerjaan / sistem</dt>
                    <dd>{l.pekerjaan_sistem}</dd>
                    <dt className="text-gray-500">Keluaran & penerima</dt>
                    <dd>{l.keluaran_penerima}</dd>
                    <dt className="text-gray-500">Pemeriksa / pemutus</dt>
                    <dd>{l.pemeriksa_pemutus ?? "—"}</dd>
                    <dt className="text-gray-500">Hambatan</dt>
                    <dd>{l.hambatan ?? "—"}</dd>
                    <dt className="text-gray-500">Bukti</dt>
                    <dd className="font-mono text-xs">
                      {buktiPerLangkah.get(l.id)?.join(", ") ?? "—"}
                    </dd>
                  </dl>
                  <details>
                    <summary className="cursor-pointer text-xs text-blue-600 dark:text-blue-400">
                      Ubah langkah
                    </summary>
                    <div className="mt-2">
                      <FormLangkah prosesId={proses.id} awal={l} accessToken={accessToken} />
                    </div>
                  </details>

                  <div className="space-y-2 border-t border-gray-200 pt-2 dark:border-gray-700">
                    <h3 className="text-xs font-semibold uppercase text-gray-500">
                      Koreksi ({koreksi.length})
                    </h3>
                    {koreksi.length === 0 ? (
                      <p className="text-xs text-gray-500">Belum ada koreksi.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-gray-500">
                            <th className="pr-3 font-medium">Waktu</th>
                            <th className="pr-3 font-medium">Kode orang</th>
                            <th className="pr-3 font-medium">Asal</th>
                            <th className="font-medium">Isi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {koreksi.map((k) => (
                            <tr key={k.id} className="align-top">
                              <td className="pr-3">{formatWaktu(k.waktu)}</td>
                              <td className="pr-3 font-mono">{k.kode_orang}</td>
                              <td className="pr-3">{asalKoreksi(k)}</td>
                              <td className="whitespace-normal break-words">{k.isi}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <FormKoreksi langkahId={l.id} accessToken={accessToken} />
                  </div>
                </li>
              ))}
            </ol>
          )}

          <details>
            <summary className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400">
              + Tambah langkah
            </summary>
            <div className="mt-2">
              <FormLangkah prosesId={proses.id} accessToken={accessToken} />
            </div>
          </details>
        </article>
      ))}

      <details className="rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-600">
        <summary className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400">
          + Tambah proses
        </summary>
        <div className="mt-3">
          <FormProses
            masalahId={masalah.id}
            sekolahTerkunci={masalah.sekolah_id}
            sekolah={sekolah}
            periodeBawaan={masalah.periode_acuan}
            accessToken={accessToken}
          />
        </div>
      </details>
    </section>
  );
}
