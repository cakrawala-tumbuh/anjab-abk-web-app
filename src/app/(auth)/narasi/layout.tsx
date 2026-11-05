import type { ReactNode } from "react";
import { WajibGrup } from "@/components/wajib-grup";
import { GRUP_TIM_KAJIAN } from "@/lib/auth/auth";

/**
 * Layout segmen `/narasi/*` (jalur manual narasi, Tim Kajian): guard grup `tim-kajian`.
 *
 * Admin tanpa grup `tim-kajian` melihat panel penolakan dan tidak pernah memanggil backend;
 * penegak sebenarnya tetap backend (403 dilempar ke `error.tsx`). Tanpa `BannerPrototipe`.
 */
export default function NarasiLayout({ children }: { children: ReactNode }) {
  return (
    <WajibGrup grup={GRUP_TIM_KAJIAN}>
      <div className="space-y-4">{children}</div>
    </WajibGrup>
  );
}
