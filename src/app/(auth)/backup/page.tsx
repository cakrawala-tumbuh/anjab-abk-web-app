import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { UnduhButton } from "./unduh-button";
import { PulihkanForm } from "./pulihkan-form";

export const metadata = { title: "Backup & Restore" };

/**
 * Halaman admin untuk mencadangkan & memulihkan basis data.
 *
 * Guard admin ditegakkan DI SINI (Server Component) — pengguna non-admin yang
 * membuka `/backup` langsung mendapat `notFound()`, bukan sekadar disembunyikan
 * dari sidebar (`NAV_ADMIN`). Data sensitif (dump basis data) tidak pernah keluar
 * lewat komponen ini secara langsung — kedua aksi (unduh/pulihkan) memanggil proxy
 * Route Handler (`/api/backup/unduh`, `/api/backup/pulihkan`) yang menyisipkan token
 * di server, bukan backend langsung dari browser.
 */
export default async function BackupPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-heading">Backup & Restore</h1>
        <p className="page-subtext">
          Cadangkan seluruh basis data saat ini atau pulihkan dari berkas cadangan sebelumnya.
        </p>
      </div>

      <section className="form-card space-y-3 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Unduh Cadangan</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Mengunduh salinan penuh basis data saat ini dalam format <code>pg_dump</code>. Server
          tidak menyimpan salinan cadangan — unduh dan simpan berkasnya sendiri.
        </p>
        <UnduhButton />
      </section>

      <section className="form-card space-y-4 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
          Pulihkan dari Cadangan
        </h2>
        <PulihkanForm />
      </section>
    </div>
  );
}
