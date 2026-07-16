"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";

// Selaras konstanta di @/components/calhr + kolom di detail-form.tsx.
const KOLOM = [
  { nama: "Sumber Bukti", isi: "Formal / Aktual / Keduanya" },
  { nama: "Kondisi", isi: "Baseline / Peak / Both" },
  { nama: "Frekuensi", isi: "Harian / Mingguan / Semesteran / Insidental" },
  { nama: "Durasi/kali", isi: "lama sekali kerja, dalam menit" },
  { nama: "Jam/minggu", isi: "estimasi jam per minggu" },
  { nama: "Jam peak (4 minggu)", isi: "jam pada periode puncak" },
  {
    nama: "VA Type",
    isi: "VA-Core / VA-Enable / NVA-Residual / Context-Dependent / Needs Validation",
  },
] as const;

interface Props {
  defaultOpen: boolean;
}

export function PetunjukTahap3({ defaultOpen }: Props) {
  return (
    <PetunjukModal title="Petunjuk — Tahap 3: Detailing Tugas (CalHR)" defaultOpen={defaultOpen}>
      <p>
        Pada <strong>Tahap 3</strong> Anda merinci beban kerja (<strong>CalHR</strong>) untuk tugas
        yang <strong>benar-benar Anda kerjakan</strong> dari daftar final.
      </p>

      <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-950/40">
        <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-200">Petunjuk Umum</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-blue-900/90 dark:text-blue-200/90">
          <li>Centang tugas yang Anda kerjakan.</li>
          <li>
            Sebagian tugas punya <strong>isian standar</strong> yang otomatis terpakai saat
            dicentang. Bila sudah sesuai, biarkan (&ldquo;Setuju dengan isian standar&rdquo;); bila
            tidak, hapus centang persetujuan lalu ubah nilainya.
          </li>
          <li>Pilih minimal satu tugas.</li>
          <li>
            Anda bisa menekan &ldquo;Simpan&rdquo; untuk menyimpan draft dan melanjutkan nanti.
          </li>
          <li>
            <strong>&ldquo;Kirim Detail&rdquo; mengunci</strong> isian Anda — setelah dikirim tidak
            dapat diubah lagi.
          </li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Arti Kolom CalHR</h3>
        <ul className="space-y-1.5">
          {KOLOM.map((k) => (
            <li key={k.nama}>
              <strong>{k.nama}</strong> — {k.isi}.
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
          Keterangan &ldquo;(petunjuk standar: …)&rdquo; di samping Durasi hanya acuan — tetap isi
          angka sesuai keadaan Anda sendiri.
        </p>
      </div>
    </PetunjukModal>
  );
}
