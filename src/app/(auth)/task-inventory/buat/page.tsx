import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { petaJumlahAnggotaPanel, type PetaAnggotaPanel } from "@/lib/sme-panel";
import type { SMEPanelRead, TiKombinasiRead } from "@/lib/api/schema";
import { TiSesiForm } from "./ti-sesi-form";

export const metadata = { title: "Mulai Analisis Jabatan — Task Inventory" };

async function fetchPageData(
  accessToken: string | undefined,
): Promise<{ kombinasi: TiKombinasiRead[]; petaAnggota: PetaAnggotaPanel }> {
  const client = withServerAuth(accessToken);
  const [kombinasiRes, panelRes] = await Promise.all([
    client.GET("/api/v1/task-inventory/catalog/kombinasi", {}),
    client.GET("/api/v1/sme-panel", { params: { query: { limit: 100 } } }),
  ]);
  // Keduanya kritis. Kegagalan panel yang ditelan akan tampil sebagai "jabatan
  // belum punya SME panel" — informasi PALSU yang justru menyesatkan pengisian
  // max_responden (invariant backlog 026).
  if (!kombinasiRes.data) throw apiErrorDari(kombinasiRes);
  if (!panelRes.data) throw apiErrorDari(panelRes);

  return {
    kombinasi: kombinasiRes.data as TiKombinasiRead[],
    petaAnggota: petaJumlahAnggotaPanel(panelRes.data.items as SMEPanelRead[]),
  };
}

export default async function BuatTiSesiPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { kombinasi, petaAnggota } = await fetchPageData(session?.accessToken);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/task-inventory" className="hover:text-gray-700">
          Task Inventory
        </Link>
        <span>/</span>
        <span className="text-gray-900">Mulai Analisis Jabatan</span>
      </div>

      <div>
        <h1 className="page-heading">Mulai Analisis Jabatan — Task Inventory</h1>
        <p className="page-subtext">
          Pilih kombinasi unit & kategori jabatan beserta periode. Setelah dibuat, mulai Tahap 1
          untuk membuka seleksi relevansi task.
        </p>
      </div>

      <TiSesiForm
        kombinasi={kombinasi}
        petaAnggota={petaAnggota}
        accessToken={session?.accessToken}
      />
    </div>
  );
}
