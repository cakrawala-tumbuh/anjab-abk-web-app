"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import type { TiRespondenRead } from "@/lib/api/schema";

/** Kandidat koordinator: nama untuk ditampilkan, `partisipanId` untuk submit. */
interface KandidatKoordinator {
  partisipanId: string;
  nama: string;
}

interface Props {
  sesiId: string;
  /** Koordinator saat ini (id partisipan), null bila belum ditentukan. */
  koordinatorId: string | null;
  /**
   * Daftar responden sesi ini — sumber kandidat koordinator (backlog `#57`,
   * menggantikan anggota SME panel). Backend sudah menyaring responden per
   * cabang saat auto-populate/penambahan (`anjab-abk-backend#41`), jadi
   * daftar ini TIDAK disaring ulang cabang di klien.
   */
  responden: TiRespondenRead[];
  accessToken: string | undefined;
}

/**
 * Kartu pengaturan koordinator SME panel pada detail sesi Task Inventory.
 *
 * Admin dapat menentukan/mengubah koordinator kapan saja (mis. ketika koordinator
 * baru ditetapkan setelah sesi dimulai). Kandidat dibatasi ke responden sesi ini
 * yang tertaut partisipan (`partisipan_id` non-null) — responden manual tanpa
 * partisipan tidak dapat dijadikan koordinator karena `koordinator_id` sesi
 * merujuk id partisipan. Kandidat ditampilkan sebagai nama; id partisipan hanya
 * disimpan untuk submit.
 */
export function AturKoordinator({ sesiId, koordinatorId, responden, accessToken }: Props) {
  const router = useRouter();
  const [pilihan, setPilihan] = useState<string>(koordinatorId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dedup by partisipanId — satu partisipan seharusnya hanya jadi satu responden,
  // tapi dedup di sini murah dan menghindari opsi <select> berduplikat bila data
  // lama (pra-#29) masih menyisakan responden ganda.
  const kandidat: KandidatKoordinator[] = [];
  const dilihat = new Set<string>();
  for (const r of responden) {
    if (!r.partisipan_id || dilihat.has(r.partisipan_id)) continue;
    dilihat.add(r.partisipan_id);
    kandidat.push({ partisipanId: r.partisipan_id, nama: r.nama ?? r.partisipan_id });
  }

  const koordinatorSekarang = kandidat.find((k) => k.partisipanId === koordinatorId) ?? null;
  const berubah = (pilihan || null) !== (koordinatorId ?? null);

  async function simpan() {
    setLoading(true);
    setError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error: apiError, response } = await client.PATCH(
        "/api/v1/task-inventory/sesi/{sesi_id}",
        {
          params: { path: { sesi_id: sesiId } },
          body: { koordinator_id: pilihan === "" ? null : pilihan },
        },
      );
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      notifySukses(pilihan === "" ? "Koordinator dikosongkan." : "Koordinator diperbarui.");
      router.refresh();
    } catch (err) {
      setError(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-lg font-medium text-gray-900">Koordinator SME Panel</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Koordinator bertugas mereview task pada Tahap 2. Hanya responden sesi ini yang dapat
        dipilih.
      </p>

      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
        Saat ini:{" "}
        {koordinatorSekarang ? (
          <span className="font-medium text-gray-900 dark:text-gray-50">
            {koordinatorSekarang.nama}
          </span>
        ) : koordinatorId ? (
          <span className="font-medium text-amber-700">
            (koordinator di luar daftar responden sesi)
          </span>
        ) : (
          <span className="italic text-gray-400">Belum ditentukan</span>
        )}
      </p>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {kandidat.length === 0 ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Belum ada responden pada sesi ini, sehingga koordinator belum dapat ditentukan. Tambahkan
          responden terlebih dahulu.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="koordinator" className="form-label">
              Pilih koordinator
            </label>
            <select
              id="koordinator"
              value={pilihan}
              onChange={(e) => setPilihan(e.target.value)}
              disabled={loading}
              className="mt-1 block w-72 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
            >
              <option value="">— Tidak ada koordinator —</option>
              {kandidat.map((k) => (
                <option key={k.partisipanId} value={k.partisipanId}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={simpan}
            disabled={loading || !berubah}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Menyimpan…" : "Simpan Koordinator"}
          </button>
        </div>
      )}
    </div>
  );
}
