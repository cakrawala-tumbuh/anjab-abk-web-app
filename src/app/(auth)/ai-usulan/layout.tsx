import type { ReactNode } from "react";
import { WajibGrup } from "@/components/wajib-grup";
import { GRUP_TIM_KAJIAN } from "@/lib/auth/auth";

/**
 * Layout segmen `/ai-usulan/*` (peninjauan usulan AI, Tim Kajian): guard grup `tim-kajian`.
 * Penegak sebenarnya tetap backend (403 dilempar ke `error.tsx`).
 */
export default function AiUsulanLayout({ children }: { children: ReactNode }) {
  return (
    <WajibGrup grup={GRUP_TIM_KAJIAN}>
      <div className="space-y-4">{children}</div>
    </WajibGrup>
  );
}
