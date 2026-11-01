import type { ReactNode } from "react";
import { BannerPrototipe } from "@/components/banner-prototipe";
import { WajibGrup } from "@/components/wajib-grup";
import { GRUP_SEKOLAH_PENGISI } from "@/lib/auth/auth";

/**
 * Layout segmen `/redesain-sekolah/*` (pengisi sekolah): guard grup `sekolah-pengisi` +
 * banner PROTOTIPE. Pengguna tanpa grup itu (termasuk admin) melihat "Tidak berhak".
 */
export default function RedesainSekolahLayout({ children }: { children: ReactNode }) {
  return (
    <WajibGrup grup={GRUP_SEKOLAH_PENGISI}>
      <div className="space-y-4">
        <BannerPrototipe />
        {children}
      </div>
    </WajibGrup>
  );
}
