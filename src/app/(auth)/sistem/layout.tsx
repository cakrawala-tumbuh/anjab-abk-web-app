import type { ReactNode } from "react";
import { WajibGrup } from "@/components/wajib-grup";

/**
 * Layout segmen `/sistem/*` (kendali sistem): hanya grup `admin`.
 *
 * Non-admin melihat panel penolakan dan tidak pernah memanggil backend; penegak sebenarnya
 * tetap backend (403 dilempar ke `error.tsx`).
 */
export default function SistemLayout({ children }: { children: ReactNode }) {
  return <WajibGrup grup="admin">{children}</WajibGrup>;
}
