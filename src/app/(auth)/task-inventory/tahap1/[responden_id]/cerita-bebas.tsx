"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { BATAS_CERITA, validasiCerita } from "@/lib/ti-prabank";
import type { CeritaPrabankRead } from "@/lib/api/schema";

/** Teks konfirmasi sebelum melewati cerita bebas. */
export const KONFIRMASI_LEWATI =
  "Lewati cerita bebas? Cerita Anda tidak akan tercatat sebagai pra-paparan, dan daftar tugas langsung ditampilkan. Langkah ini tidak dapat diulang.";

interface Props {
  respondenId: string;
  /** Cerita yang sudah tersimpan (draf atau beku) dari `GET .../prabank`; `null` bila belum ada. */
  cerita: CeritaPrabankRead | null;
  accessToken: string | undefined;
}

/**
 * Langkah "Cerita bebas" Tahap 1 — tampil SEBELUM bank tugas dimuat (saklar `PREBANK_FREEZE`).
 *
 * Alur: tulis dan simpan cerita (`PUT .../cerita-prabank`), lalu "Bekukan & lanjut"
 * (`POST .../bekukan` kemudian `POST .../paparan` jenis `BANK_TUGAS`), atau "Lewati cerita"
 * (hanya `POST .../paparan`, setelah konfirmasi). Sukses hanya dilaporkan setelah 2xx, lalu
 * `router.refresh()` agar Server Component memuat bank tugas. Bila bekukan sudah berhasil
 * tetapi paparan gagal, percobaan ulang hanya mengirim paparan.
 *
 * @param props - ID responden, cerita tersimpan, dan token akses.
 * @returns Panel cerita bebas.
 */
export function CeritaBebas({ respondenId, cerita, accessToken }: Props) {
  const router = useRouter();
  const [teks, setTeks] = useState(cerita?.teks ?? "");
  const [tersimpan, setTersimpan] = useState<string | null>(cerita?.teks ?? null);
  const [beku, setBeku] = useState(Boolean(cerita?.frozen_at));
  const [sibuk, setSibuk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bersih = tersimpan !== null && teks === tersimpan;

  /** Kirim paparan bank tugas; sukses -> refresh. Melempar bila gagal. */
  async function catatPaparan(client: ReturnType<typeof withServerAuth>) {
    const { error: apiError, response } = await client.POST(
      "/api/v1/task-inventory/sesi/responden/{responden_id}/paparan",
      {
        params: { path: { responden_id: respondenId } },
        body: { jenis: "BANK_TUGAS" },
      },
    );
    if (apiError) throw toApiError(apiError, response.headers.get("x-request-id"), response.status);
  }

  async function jalankan(aksi: () => Promise<void>) {
    setSibuk(true);
    setError(null);
    try {
      await aksi();
    } catch (err) {
      setError(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setSibuk(false);
    }
  }

  async function simpan() {
    const salah = validasiCerita(teks);
    if (salah) {
      setError(salah);
      return;
    }
    await jalankan(async () => {
      const client = withServerAuth(accessToken);
      const {
        data,
        error: apiError,
        response,
      } = await client.PUT("/api/v1/task-inventory/sesi/responden/{responden_id}/cerita-prabank", {
        params: { path: { responden_id: respondenId } },
        body: { teks },
      });
      if (apiError || !data) {
        throw toApiError(apiError, response.headers.get("x-request-id"), response.status);
      }
      setTersimpan(data.teks);
      notifySukses("Cerita tersimpan.");
    });
  }

  async function bekukanLanjut() {
    await jalankan(async () => {
      const client = withServerAuth(accessToken);
      if (!beku) {
        const { error: apiError, response } = await client.POST(
          "/api/v1/task-inventory/sesi/responden/{responden_id}/cerita-prabank/bekukan",
          { params: { path: { responden_id: respondenId } } },
        );
        if (apiError) {
          throw toApiError(apiError, response.headers.get("x-request-id"), response.status);
        }
        setBeku(true);
      }
      await catatPaparan(client);
      notifySukses("Cerita dibekukan. Daftar tugas ditampilkan.");
      router.refresh();
    });
  }

  async function lewati() {
    if (!confirm(KONFIRMASI_LEWATI)) return;
    await jalankan(async () => {
      await catatPaparan(withServerAuth(accessToken));
      notifySukses("Cerita dilewati. Daftar tugas ditampilkan.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium">Cerita bebas — sebelum melihat daftar tugas</p>
        <p className="mt-1">
          Ceritakan dengan kata-kata Anda sendiri pekerjaan yang Anda lakukan sehari-hari. Setelah
          dibekukan, cerita tidak dapat diubah dan daftar tugas baru ditampilkan.
        </p>
      </div>

      {error && (
        <div role="alert" className="form-server-error">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="cerita-bebas" className="mb-1 block text-sm font-medium">
          Cerita pekerjaan Anda
        </label>
        <textarea
          id="cerita-bebas"
          className="min-h-48 w-full rounded-md border border-gray-300 p-3 text-sm"
          value={teks}
          maxLength={BATAS_CERITA}
          readOnly={beku}
          disabled={sibuk}
          onChange={(e) => setTeks(e.target.value)}
        />
        <p className="mt-1 text-xs text-gray-500">
          {teks.length} / {BATAS_CERITA} karakter
        </p>
      </div>

      {beku ? (
        <p className="text-sm text-gray-600">
          Cerita sudah dibekukan. Lanjutkan untuk menampilkan daftar tugas.
        </p>
      ) : (
        !bersih &&
        teks.trim().length > 0 && (
          <p className="text-sm text-amber-700">Simpan cerita lebih dulu sebelum membekukan.</p>
        )
      )}

      <div className="flex flex-wrap gap-3">
        {!beku && (
          <button
            type="button"
            className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            disabled={sibuk}
            onClick={simpan}
          >
            {sibuk ? "Memproses…" : "Simpan cerita"}
          </button>
        )}
        <button
          type="button"
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          disabled={sibuk || (!beku && !bersih)}
          onClick={bekukanLanjut}
        >
          {beku ? "Lanjut ke daftar tugas" : "Bekukan & lanjut ke daftar tugas"}
        </button>
        {!beku && (
          <button
            type="button"
            className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            disabled={sibuk}
            onClick={lewati}
          >
            Lewati cerita
          </button>
        )}
      </div>
    </div>
  );
}
