import type { AlternatifRead } from "@/lib/api/schema";
import { JUDUL_KEPUTUSAN_PERUBAHAN } from "@/lib/redesain-alternatif";
import { fetchKeputusanPerubahan, fetchMatriksKesiapan, fetchPenerima } from "./data-alternatif";
import { FormKeputusanPerubahan } from "./form-keputusan-perubahan";
import { FormKesiapan } from "./form-kesiapan";
import { FormPenerima } from "./form-penerima";
import { TabelMatriksKesiapan } from "./tabel-matriks-kesiapan";

/** Properti {@link PanelKesiapan}. */
export interface PanelKesiapanProps {
  alternatif: AlternatifRead;
  periode: string;
  /** Pilihan jabatan (id + nama) untuk form penerima dan label baris. */
  jabatan: { id: string; label: string }[];
  /** Saklar `CHANGE_AUTHORIZATION`; mati → form keputusan disembunyikan, riwayat tetap tampil. */
  keputusanPerubahanAktif: boolean;
  accessToken: string | undefined;
}

/**
 * Panel kesiapan satu alternatif pada satu periode (Server Component async).
 *
 * Berisi daftar penerima + form tambah, matriks kesiapan, form penilaian, lalu panel
 * "Keputusan perubahan (ChangeDecision)" yang terpisah dari keputusan prioritas. Semua
 * pengambilan data adalah data inti: kegagalan melempar ke `error.tsx`, bukan tabel kosong.
 *
 * @param props - Lihat {@link PanelKesiapanProps}.
 */
export async function PanelKesiapan({
  alternatif,
  periode,
  jabatan,
  keputusanPerubahanAktif,
  accessToken,
}: PanelKesiapanProps) {
  const [penerima, matriks, riwayat] = await Promise.all([
    fetchPenerima(accessToken, alternatif.id),
    fetchMatriksKesiapan(accessToken, alternatif.id, periode),
    fetchKeputusanPerubahan(accessToken, alternatif.id, periode),
  ]);
  const peta = new Map(jabatan.map((j) => [j.id, j.label]));
  const nama = (id: string) => peta.get(id) ?? "—";
  const pilihanPenerima = penerima.map((p) => ({
    id: p.id,
    label: nama(p.penerima_jabatan_id),
  }));

  return (
    <section aria-label={`Kesiapan ${alternatif.kode}`} className="space-y-3 rounded-lg border p-3">
      <h3 className="text-sm font-semibold">
        Kesiapan penerima — <span className="font-mono">{alternatif.kode}</span> ({periode})
      </h3>

      <details className="text-sm">
        <summary className="cursor-pointer text-blue-600 dark:text-blue-400">
          Penerima ({penerima.length}) — kelola
        </summary>
        <ul className="my-2 list-disc pl-5 text-xs">
          {penerima.length === 0 && <li>Belum ada penerima.</li>}
          {penerima.map((p) => (
            <li key={p.id}>
              {nama(p.penerima_jabatan_id)}
              {p.material ? " (material)" : " (non-material)"}
              {p.catatan ? ` — ${p.catatan}` : ""}
            </li>
          ))}
        </ul>
        <FormPenerima alternatifId={alternatif.id} jabatan={jabatan} accessToken={accessToken} />
      </details>

      <TabelMatriksKesiapan
        statusOpsi={matriks.status_opsi}
        baris={matriks.baris}
        namaJabatan={nama}
      />

      {pilihanPenerima.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-blue-600 dark:text-blue-400">
            + Catat kesiapan penerima
          </summary>
          <div className="mt-2">
            <FormKesiapan
              alternatifId={alternatif.id}
              periode={periode}
              penerima={pilihanPenerima}
              accessToken={accessToken}
            />
          </div>
        </details>
      )}

      <section
        aria-label={JUDUL_KEPUTUSAN_PERUBAHAN}
        className="space-y-2 rounded-md border border-dashed p-3"
      >
        <h4 className="text-sm font-semibold">{JUDUL_KEPUTUSAN_PERUBAHAN}</h4>
        {riwayat.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Belum ada keputusan perubahan pada periode ini.
          </p>
        ) : (
          <ul className="space-y-1 text-xs" aria-label="Riwayat keputusan perubahan">
            {riwayat.map((k) => (
              <li key={k.id} className="rounded bg-gray-50 p-2 dark:bg-gray-800">
                <strong>{k.keputusan}</strong> · opsi saat itu {k.status_opsi_saat_putus} ·{" "}
                {k.pemutus_kode_orang} · {k.created_at.slice(0, 10)}
                <p className="whitespace-pre-wrap break-words">{k.alasan}</p>
                {k.stop_rule && (
                  <p className="whitespace-pre-wrap break-words">Stop rule: {k.stop_rule}</p>
                )}
              </li>
            ))}
          </ul>
        )}
        {keputusanPerubahanAktif ? (
          <FormKeputusanPerubahan
            alternatifId={alternatif.id}
            periode={periode}
            statusOpsi={matriks.status_opsi}
            accessToken={accessToken}
          />
        ) : null}
      </section>
    </section>
  );
}
