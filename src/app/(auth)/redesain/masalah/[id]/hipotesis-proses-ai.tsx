"use client";

import { bodyP05 } from "@/lib/ai-usulan-masalah";
import { withServerAuth } from "@/lib/api/client";
import { headerIdempotencyKey } from "@/lib/konkurensi";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";
import { PanelPengajuAi } from "./panel-pengaju-ai";

/** Properti {@link HipotesisProsesAi}. */
export interface HipotesisProsesAiProps {
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
  /** Id masalah redesain. */
  masalahId: string;
  /** Periode acuan masalah, dipakai sebagai isian awal. */
  periodeAcuan: string;
}

/**
 * Panel "Hipotesis proses dengan AI" (P05) pada detail masalah. Hasilnya usulan hipotesis
 * yang ditinjau di layar Usulan AI; tabel redesain tidak berubah.
 *
 * Kirim `POST /api/v1/redesain/masalah/{masalah_id}/hipotesis-proses-ai` berbadan `{periode}`.
 * Galat 409 `SUMBER_PROSES_BELUM_TERHUBUNG`, 422 `SUMBER_TERLALU_BANYAK`, dan 409
 * `fungsi_belum_aktif` tampil sebagai pesan backend.
 *
 * @param props - Lihat {@link HipotesisProsesAiProps}.
 */
export function HipotesisProsesAi({
  accessToken,
  masalahId,
  periodeAcuan,
}: HipotesisProsesAiProps) {
  const idem = useIdempotencyKey();
  return (
    <PanelPengajuAi
      judul="Hipotesis proses dengan AI (P05)"
      deskripsi="AI menyusun hipotesis proses dan masalah dari data redesain masalah ini. Hasilnya berupa usulan yang harus Anda tinjau dan putuskan; Tim memindahkannya sendiri bila diterima."
      labelTombol="Minta hipotesis proses"
      pesanSukses="Permintaan hipotesis proses diterima. Hasilnya muncul di layar Usulan AI."
      periodeAwal={periodeAcuan}
      panggil={async (periode) => {
        const body = bodyP05(periode);
        const res = await withServerAuth(accessToken).POST(
          "/api/v1/redesain/masalah/{masalah_id}/hipotesis-proses-ai",
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
