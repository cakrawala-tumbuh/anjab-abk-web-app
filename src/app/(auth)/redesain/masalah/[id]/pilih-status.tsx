"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { PenilaianStatus } from "@/lib/api/schema";
import { notifyGagal, notifySukses } from "@/lib/notify";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";
import { OPSI_STATUS_PILIHAN } from "@/lib/redesain-keputusan";

/** Properti {@link PilihStatus}. */
export interface PilihStatusProps {
  penilaianId: string;
  /** `status_penilaian` saat ini (boleh `Telah diputuskan`, yang tidak ada di pilihan). */
  statusSaatIni: string;
  accessToken: string | undefined;
}

/**
 * Pilihan status penilaian (4 status; `Telah diputuskan` hanya lewat aksi putuskan).
 *
 * Memilih status → `POST /api/v1/redesain/penilaian/{id}/status`, lalu `router.refresh()`.
 * POST membawa `Idempotency-Key` per upaya (`keyUntuk(body)`: isi kiriman berubah → key baru) (key diganti hanya setelah sukses); 409 `conflict` dipetakan ke pesan "masih diproses".
 *
 * @param props - Lihat {@link PilihStatusProps}.
 */
export function PilihStatus({ penilaianId, statusSaatIni, accessToken }: PilihStatusProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const idem = useIdempotencyKey();
  const dalamPilihan = (OPSI_STATUS_PILIHAN as readonly string[]).includes(statusSaatIni);

  async function ubah(baru: string) {
    if (!baru || baru === statusSaatIni) return;
    setLoading(true);
    try {
      const body = { status_penilaian: baru as PenilaianStatus["status_penilaian"] };
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/redesain/penilaian/{penilaian_id}/status",
        {
          params: { path: { penilaian_id: penilaianId } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      notifySukses("Status penilaian diubah.");
      router.refresh();
    } catch (galatMentah) {
      notifyGagal(petakanKonkurensi(galatMentah, true));
    } finally {
      setLoading(false);
    }
  }

  return (
    <label className="block text-sm">
      <span className="block text-gray-600 dark:text-gray-400">
        Status penilaian
        {!dalamPilihan && <strong className="ml-2">({statusSaatIni})</strong>}
      </span>
      <select
        aria-label="Status penilaian"
        value={dalamPilihan ? statusSaatIni : ""}
        disabled={loading}
        onChange={(e) => ubah(e.target.value)}
        className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
      >
        {!dalamPilihan && <option value="">— ubah status —</option>}
        {OPSI_STATUS_PILIHAN.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
