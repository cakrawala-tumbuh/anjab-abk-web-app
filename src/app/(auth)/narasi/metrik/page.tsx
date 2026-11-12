import { auth } from "@/lib/auth/auth";
import { bacaFilterMetrik, validasiRentang } from "@/lib/narasi-metrik";
import { fetchMetrikNarasi } from "./data";
import { FilterMetrik } from "./filter-metrik";
import { PanelMetrik } from "./panel-metrik";

export const metadata = { title: "Metrik Narasi" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Panel metrik alur narasi (Server Component, Tim Kajian). Rentang tanggal (bawaan 30 hari
 * terakhir, paling panjang 366 hari) dan jenis narasi hidup di URL. Rentang tak sah dari URL
 * ditampilkan sebagai galat TANPA memanggil backend; kegagalan backend dilempar ke `error.tsx`.
 */
export default async function MetrikNarasiPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filter = bacaFilterMetrik(sp, new Date());
  const galatRentang = validasiRentang(filter.dari, filter.sampai);
  const metrik = galatRentang ? null : await fetchMetrikNarasi((await auth())?.accessToken, filter);

  return (
    <div className="space-y-4">
      <h1 className="page-heading">Metrik Alur Narasi</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Ringkasan keputusan Tim Kajian, cakupan sumber, dan menit aktif tinjauan pada rentang
        tanggal (hari UTC, inklusif).
      </p>
      <FilterMetrik filter={filter} />
      {galatRentang ? (
        <p role="alert" className="text-sm text-red-600">
          {galatRentang}
        </p>
      ) : (
        metrik && <PanelMetrik metrik={metrik} />
      )}
    </div>
  );
}
