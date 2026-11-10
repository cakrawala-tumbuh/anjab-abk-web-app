"use client";

import { PanelPengajuAi } from "@/app/(auth)/redesain/masalah/[id]/panel-pengaju-ai";
import { withServerAuth } from "@/lib/api/client";
import type { PengajuanP08 } from "@/lib/api/schema";
import { headerIdempotencyKey } from "@/lib/konkurensi";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

/** Properti {@link SintesisRisetAi}. */
export interface SintesisRisetAiProps {
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
  /** Id protokol riset (berstatus `TERKUNCI`). */
  protokolId: string;
  /** Jumlah statistik berstatus `TERVERIFIKASI` pada protokol ini. */
  jumlahTerverifikasi: number;
}

/**
 * Panel "Sintesis bukti dengan AI" (P08) pada detail protokol riset. Hasilnya usulan sintesis
 * yang ditinjau di layar Usulan AI; data riset tidak berubah.
 *
 * Kirim `POST /api/v1/riset/protokol/{protokol_id}/sintesis-ai` berbadan `{periode}` (isian
 * periode kosong, divalidasi `validasiPeriodeAi`). Tombol nonaktif bila belum ada statistik
 * terverifikasi; backend tetap penentu akhir. Galat 409 (`fungsi_belum_aktif`,
 * `PROTOKOL_BELUM_TERKUNCI`, `STATISTIK_TERVERIFIKASI_KOSONG`) dan 422 `SUMBER_TERLALU_BANYAK`
 * tampil sebagai pesan backend.
 *
 * @param props - Lihat {@link SintesisRisetAiProps}.
 */
export function SintesisRisetAi({
  accessToken,
  protokolId,
  jumlahTerverifikasi,
}: SintesisRisetAiProps) {
  const idem = useIdempotencyKey();
  return (
    <PanelPengajuAi
      judul="Sintesis bukti dengan AI (P08)"
      deskripsi="AI menyusun sintesis dari protokol terkunci, statistik terverifikasi, dan kasus negatif. Hasilnya berupa usulan yang harus Anda tinjau dan putuskan."
      catatan="Hasil sintesis adalah draf untuk ditinjau; fungsi ini bisa belum diaktifkan operator."
      labelTombol="Minta sintesis bukti"
      pesanSukses="Permintaan sintesis bukti diterima. Hasilnya muncul di layar Usulan AI."
      periodeAwal=""
      nonaktif={jumlahTerverifikasi < 1}
      alasanNonaktif="Butuh minimal satu statistik terverifikasi."
      panggil={async (periode) => {
        const body: PengajuanP08 = { periode };
        const res = await withServerAuth(accessToken).POST(
          "/api/v1/riset/protokol/{protokol_id}/sintesis-ai",
          {
            params: { path: { protokol_id: protokolId } },
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
