"use client";

import { useState } from "react";
import { bodyP07 } from "@/lib/ai-usulan-masalah";
import { withServerAuth } from "@/lib/api/client";
import type { AiUsulanRingkas } from "@/lib/api/schema";
import { headerIdempotencyKey } from "@/lib/konkurensi";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";
import { PanelPengajuAi } from "./panel-pengaju-ai";

/** Properti {@link KartuKeputusanAi}. */
export interface KartuKeputusanAiProps {
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
  /** Id masalah redesain. */
  masalahId: string;
  /** Periode acuan masalah, dipakai sebagai isian awal. */
  periodeAcuan: string;
  /** Usulan P06 masalah ini yang sudah diterima reviewer (`APPROVE`/`REVISE`). */
  usulanP06: readonly AiUsulanRingkas[];
}

/**
 * Panel "Kartu keputusan dengan AI" (P07) pada detail masalah. Usulan P06 yang diterima
 * dapat dipilih sebagai bahan tambahan; pilihan bawaan "Tanpa usulan P06" mengirim
 * `usulan_p06_id: null`. Gerbang F4 dan syarat alternatif dijaga backend.
 *
 * Kirim `POST /api/v1/redesain/masalah/{masalah_id}/kartu-keputusan-ai`.
 *
 * @param props - Lihat {@link KartuKeputusanAiProps}.
 */
export function KartuKeputusanAi({
  accessToken,
  masalahId,
  periodeAcuan,
  usulanP06,
}: KartuKeputusanAiProps) {
  const idem = useIdempotencyKey();
  const [p06, setP06] = useState("");
  return (
    <PanelPengajuAi
      judul="Kartu keputusan dengan AI (P07)"
      deskripsi="AI menyusun kartu keputusan dari data masalah ini, dan bila dipilih, dari usulan opsi redesain (P06) yang sudah diterima. Hanya berjalan bila masalah memenuhi syarat F4 dan memiliki minimal satu alternatif."
      labelTombol="Minta kartu keputusan"
      pesanSukses="Permintaan kartu keputusan diterima. Hasilnya muncul di layar Usulan AI."
      periodeAwal={periodeAcuan}
      ekstra={
        <label className="flex items-center gap-2">
          <span>Usulan P06</span>
          <select
            value={p06}
            onChange={(e) => setP06(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="">Tanpa usulan P06</option>
            {usulanP06.map((u) => (
              <option key={u.id} value={u.id}>
                {`${u.putusan_terakhir?.putusan ?? ""} — ${u.created_at.slice(0, 10)} — ${u.id.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </label>
      }
      panggil={async (periode) => {
        const body = bodyP07(periode, p06);
        const res = await withServerAuth(accessToken).POST(
          "/api/v1/redesain/masalah/{masalah_id}/kartu-keputusan-ai",
          {
            params: { path: { masalah_id: masalahId } },
            body,
            headers: headerIdempotencyKey(idem.keyUntuk(body)),
          },
        );
        if (res.data) idem.perbarui();
        return res;
      }}
    />
  );
}
