import Link from "next/link";
import { UnduhDocx } from "@/components/unduh-docx";
import { urlRegisterXlsx } from "@/lib/redesain-yayasan";

export const metadata = { title: "Redesain Pekerjaan — Beranda" };

/** Beranda Tim Kajian modul Redesain Pekerjaan (diperluas item WEB berikutnya). */
export default function RedesainBerandaPage() {
  return (
    <div className="space-y-4">
      <h1 className="page-heading">Redesain Pekerjaan</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Ruang kerja Tim Kajian untuk Paket Validasi &amp; Prioritas Redesain Pekerjaan. Orang selalu
        ditampilkan sebagai kode (mis. <span className="font-mono">O-0001</span>), tidak pernah
        nama.
      </p>
      <div>
        <UnduhDocx
          href={urlRegisterXlsx()}
          label="Unduh register (XLSX)"
          namaCadangan="register-redesain.xlsx"
        />
      </div>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        <li>
          <Link
            href="/redesain/riwayat"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Riwayat Perubahan
          </Link>{" "}
          — catatan append-only setiap perubahan data redesain.
        </li>
        <li>
          <Link
            href="/redesain/versi-metode"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Versi Metode
          </Link>{" "}
          — log versi metode (sheet PERUBAHAN pada register).
        </li>
      </ul>
    </div>
  );
}
