import type { MasalahRead } from "@/lib/api/schema";
import { fetchUsulanP06Diterima } from "./data-ai";
import { HipotesisProsesAi } from "./hipotesis-proses-ai";
import { KartuKeputusanAi } from "./kartu-keputusan-ai";
import { OpsiAi } from "./opsi-ai";

/** Properti {@link BagianAi}. */
export interface BagianAiProps {
  masalah: MasalahRead;
  accessToken: string | undefined;
}

/**
 * Bagian "AI" pada detail masalah (Server Component async): tiga panel pengaju P05, P06, P07.
 * Daftar usulan P06 yang diterima untuk masalah ini diambil sebagai data inti (gagal ->
 * `error.tsx`). Hasil AI ditinjau di layar Usulan AI; bagian ini tidak mengisi tabel redesain.
 *
 * @param props - Lihat {@link BagianAiProps}.
 */
export async function BagianAi({ masalah, accessToken }: BagianAiProps) {
  const usulanP06 = await fetchUsulanP06Diterima(accessToken, masalah.id);
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Permintaan AI hanya menghasilkan usulan. Tinjau dan putuskan hasilnya di layar Usulan AI.
      </p>
      <HipotesisProsesAi
        accessToken={accessToken}
        masalahId={masalah.id}
        periodeAcuan={masalah.periode_acuan}
      />
      <OpsiAi
        accessToken={accessToken}
        masalahId={masalah.id}
        periodeAcuan={masalah.periode_acuan}
      />
      <KartuKeputusanAi
        accessToken={accessToken}
        masalahId={masalah.id}
        periodeAcuan={masalah.periode_acuan}
        usulanP06={usulanP06}
      />
    </div>
  );
}
