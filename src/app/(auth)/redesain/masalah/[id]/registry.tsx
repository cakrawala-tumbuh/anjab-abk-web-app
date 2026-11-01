import type { ReactNode } from "react";
import type { MasalahRead, SekolahRead } from "@/lib/api/schema";
import { BagianAlur } from "./bagian-alur";
import { BagianPenilaian } from "./bagian-penilaian";

/** Konteks yang diteruskan ke tiap bagian detail masalah. */
export interface KonteksBagianMasalah {
  masalah: MasalahRead;
  sekolah: SekolahRead[];
  accessToken: string | undefined;
}

/** Satu bagian pada halaman detail masalah. */
export interface BagianDetailMasalah {
  /** Nilai `?bagian=` yang memilih bagian ini. */
  kunci: string;
  /** Label tab. */
  label: string;
  /**
   * Render isi bagian. Boleh async: halaman meng-`await` hasilnya, sehingga kegagalan
   * pengambilan data bagian tersebut ikut ke `error.tsx` halaman.
   */
  render: (ctx: KonteksBagianMasalah) => ReactNode | Promise<ReactNode>;
}

/**
 * Registry bagian detail masalah (`/redesain/masalah/[id]?bagian=`).
 *
 * Item berikutnya (konfirmasi, bukti, penilaian, alternatif) menambah bagian dengan
 * menambahkan satu entri di sini — halaman tidak perlu disusun ulang. Entri pertama
 * adalah bagian bawaan (dipakai juga bila `?bagian=` tak dikenal).
 */
export const BAGIAN_DETAIL_MASALAH: BagianDetailMasalah[] = [
  {
    kunci: "alur",
    label: "Alur",
    render: (ctx) => BagianAlur(ctx),
  },
  {
    kunci: "penilaian",
    label: "Penilaian",
    render: (ctx) => BagianPenilaian(ctx),
  },
];

/**
 * Pilih bagian dari nilai `?bagian=`; tak dikenal/kosong jatuh ke bagian pertama (alur).
 *
 * @param kunci - Nilai query (string, array, atau undefined).
 * @returns Bagian terpilih dari {@link BAGIAN_DETAIL_MASALAH}.
 */
export function pilihBagian(kunci: string | string[] | undefined): BagianDetailMasalah {
  const k = Array.isArray(kunci) ? kunci[0] : kunci;
  return BAGIAN_DETAIL_MASALAH.find((b) => b.kunci === k) ?? BAGIAN_DETAIL_MASALAH[0];
}
