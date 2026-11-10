"use client";

import { bodyP06 } from "@/lib/ai-usulan-masalah";
import { withServerAuth } from "@/lib/api/client";
import { headerIdempotencyKey } from "@/lib/konkurensi";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";
import { PanelPengajuAi } from "./panel-pengaju-ai";

/** Properti {@link OpsiAi}. */
export interface OpsiAiProps {
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
  /** Id masalah redesain. */
  masalahId: string;
  /** Periode acuan masalah, dipakai sebagai isian awal. */
  periodeAcuan: string;
}

/**
 * Panel "Opsi redesain dengan AI" (P06) pada detail masalah. Backend menjaga gerbang F4:
 * bila syarat belum terpenuhi, pesan dan kode syarat tampil di panel (klien tidak
 * memeriksanya sendiri).
 *
 * Kirim `POST /api/v1/redesain/masalah/{masalah_id}/opsi-ai` berbadan `{periode}`.
 *
 * @param props - Lihat {@link OpsiAiProps}.
 */
export function OpsiAi({ accessToken, masalahId, periodeAcuan }: OpsiAiProps) {
  const idem = useIdempotencyKey();
  return (
    <PanelPengajuAi
      judul="Opsi redesain dengan AI (P06)"
      deskripsi="AI menyusun opsi redesain dari data dan alternatif masalah ini. Hanya berjalan bila masalah memenuhi syarat F4; bila belum, syarat yang kurang ditampilkan. Hasilnya berupa usulan yang harus Anda tinjau."
      labelTombol="Minta opsi redesain"
      pesanSukses="Permintaan opsi redesain diterima. Hasilnya muncul di layar Usulan AI."
      periodeAwal={periodeAcuan}
      panggil={async (periode) => {
        const body = bodyP06(periode);
        const res = await withServerAuth(accessToken).POST(
          "/api/v1/redesain/masalah/{masalah_id}/opsi-ai",
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
