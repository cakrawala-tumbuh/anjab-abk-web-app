import type { ReactNode } from "react";
import { WajibGrup } from "@/components/wajib-grup";
import { GRUP_TIM_KAJIAN } from "@/lib/auth/auth";

/**
 * Layout segmen `/riset/*` (protokol, statistik, kasus negatif; Tim Kajian): guard grup
 * `tim-kajian`. Admin tanpa grup itu melihat panel penolakan dan tidak pernah memanggil
 * backend; penegak sebenarnya tetap backend (403 dilempar ke `error.tsx`).
 */
export default function RisetLayout({ children }: { children: ReactNode }) {
  return (
    <WajibGrup grup={GRUP_TIM_KAJIAN}>
      <div className="space-y-4">{children}</div>
    </WajibGrup>
  );
}
