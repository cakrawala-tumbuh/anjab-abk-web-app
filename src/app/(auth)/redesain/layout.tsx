import type { ReactNode } from "react";
import { BannerPrototipe } from "@/components/banner-prototipe";
import { WajibGrup } from "@/components/wajib-grup";
import { GRUP_TIM_KAJIAN } from "@/lib/auth/auth";

/**
 * Layout segmen `/redesain/*` (Tim Kajian): guard grup `tim-kajian` + banner PROTOTIPE.
 * Admin tanpa grup `tim-kajian` ditolak di sini.
 */
export default function RedesainLayout({ children }: { children: ReactNode }) {
  return (
    <WajibGrup grup={GRUP_TIM_KAJIAN}>
      <div className="space-y-4">
        <BannerPrototipe />
        {children}
      </div>
    </WajibGrup>
  );
}
