import type { ReactNode } from "react";

export default function MasterDataLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">Master Data</h1>
        <p className="page-subtext">Kelola data referensi yang digunakan di seluruh aplikasi.</p>
      </div>

      <div>{children}</div>
    </div>
  );
}
