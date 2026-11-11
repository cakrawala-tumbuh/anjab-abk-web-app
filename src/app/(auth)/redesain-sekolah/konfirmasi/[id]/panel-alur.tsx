"use client";

import { useState } from "react";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { AlurRead, LangkahAlurRead } from "@/lib/api/schema";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

/** Pesan toast sukses setelah koreksi langkah tercatat. */
export const PESAN_KOREKSI_TERCATAT = "Koreksi tercatat; Tim akan merekonsiliasi";

/**
 * Urutkan langkah menurut `urutan` menaik tanpa memutasi argumen.
 *
 * @param langkah - Langkah satu proses.
 * @returns Salinan terurut.
 */
export function urutkanLangkah(langkah: ReadonlyArray<LangkahAlurRead>): LangkahAlurRead[] {
  return [...langkah].sort((a, b) => a.urutan - b.urutan);
}

/**
 * Tombol + formulir "Tambah koreksi" untuk satu langkah.
 *
 * Mengirim `POST /api/v1/redesain/langkah/{id}/koreksi` `{isi, konfirmasi_id}`. Koreksi
 * append-only dan TIDAK mengubah tampilan langkah; setelah 201 hanya toast sukses dan
 * formulir ditutup. POST membawa `Idempotency-Key` per upaya (diganti hanya setelah sukses,
 * sehingga kirim ulang setelah gagal memakai key yang sama). Tombol "Kirim koreksi" nonaktif selama
 * `isi` kosong/hanya spasi (cermin validator backend) atau sedang mengirim. Kegagalan ditampilkan inline dan lewat toast.
 *
 * @param props.langkahId - ID langkah yang dikoreksi.
 * @param props.konfirmasiId - ID konfirmasi pengisi (wajib bagi sekolah-pengisi).
 * @param props.accessToken - Token akses dari Server Component induk.
 */
export function KoreksiLangkah({
  langkahId,
  konfirmasiId,
  accessToken,
}: {
  langkahId: string;
  konfirmasiId: string;
  accessToken: string | undefined;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [isi, setIsi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idem = useIdempotencyKey();

  async function kirim() {
    setLoading(true);
    setError(null);
    try {
      const body = { isi, konfirmasi_id: konfirmasiId };
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/redesain/langkah/{langkah_id}/koreksi",
        {
          params: { path: { langkah_id: langkahId } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      notifySukses(PESAN_KOREKSI_TERCATAT);
      setIsi("");
      setTerbuka(false);
    } catch (galatMentah) {
      const err = petakanKonkurensi(galatMentah, true);
      setError(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  if (!terbuka) {
    return (
      <button
        type="button"
        onClick={() => setTerbuka(true)}
        className="rounded-md border px-3 py-1 text-sm"
      >
        Tambah koreksi
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <PeringatanPrivasi />
      <label htmlFor={`koreksi-${langkahId}`} className="form-label">
        Koreksi untuk langkah ini
      </label>
      <textarea
        id={`koreksi-${langkahId}`}
        rows={3}
        value={isi}
        onChange={(e) => setIsi(e.target.value)}
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={kirim}
          disabled={loading || isi.trim() === ""}
          className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          Kirim koreksi
        </button>
        <button
          type="button"
          onClick={() => {
            setTerbuka(false);
            setError(null);
          }}
          disabled={loading}
          className="rounded-md border px-3 py-1 text-sm"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

/**
 * Panel "Alur kerja menurut catatan Tim" di langkah 2 wizard.
 *
 * Daftar proses kosong adalah jawaban sah → "Belum ada peta alur untuk sekolah ini".
 * Per proses, langkah dirender terurut `urutan` dengan seluruh kolom alur dan tombol
 * koreksi. Koreksi boleh pada konfirmasi draf maupun terkirim.
 *
 * @param props.alur - Respons `GET .../konfirmasi/{id}/alur`.
 * @param props.konfirmasiId - ID konfirmasi pengisi.
 * @param props.accessToken - Token akses dari Server Component induk.
 */
export function PanelAlur({
  alur,
  konfirmasiId,
  accessToken,
}: {
  alur: AlurRead;
  konfirmasiId: string;
  accessToken: string | undefined;
}) {
  return (
    <section aria-label="Alur kerja menurut catatan Tim" className="space-y-3">
      <h3 className="text-base font-semibold">Alur kerja menurut catatan Tim</h3>
      {alur.proses.length === 0 ? (
        <p className="text-sm text-gray-500">Belum ada peta alur untuk sekolah ini</p>
      ) : (
        alur.proses.map((p) => (
          <div key={p.id} className="rounded-md border p-3">
            <h4 className="text-sm font-semibold">
              <span className="font-mono">{p.kode}</span> — {p.nama_proses}{" "}
              <span className="font-normal text-gray-500">(periode {p.periode})</span>
            </h4>
            <ol className="mt-2 space-y-3">
              {urutkanLangkah(p.langkah).map((l) => (
                <li key={l.id} data-testid="langkah-alur" className="rounded-md border p-3">
                  <p className="text-sm font-medium">
                    <span className="font-mono">{l.kode}</span> · urutan {l.urutan} · {l.tahap}
                  </p>
                  <dl className="mt-1 grid gap-1 text-sm sm:grid-cols-2">
                    <Baris label="Pemicu input" nilai={l.pemicu_input} />
                    <Baris label="Pelaksana" nilai={l.pelaksana} />
                    <Baris label="Pekerjaan sistem" nilai={l.pekerjaan_sistem} />
                    <Baris label="Keluaran penerima" nilai={l.keluaran_penerima} />
                    <Baris label="Pemeriksa/pemutus" nilai={l.pemeriksa_pemutus} />
                    <Baris label="Hambatan" nilai={l.hambatan} />
                    <Baris label="Status langkah" nilai={l.status_langkah} />
                  </dl>
                  <div className="mt-2">
                    <KoreksiLangkah
                      langkahId={l.id}
                      konfirmasiId={konfirmasiId}
                      accessToken={accessToken}
                    />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))
      )}
    </section>
  );
}

function Baris({ label, nilai }: { label: string; nilai: string | null }) {
  return (
    <div>
      <dt className="font-medium">{label}</dt>
      <dd className="whitespace-normal break-words">{nilai || "—"}</dd>
    </div>
  );
}
