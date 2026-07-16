"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";

interface Props {
  defaultOpen: boolean;
}

export function PetunjukTahap1({ defaultOpen }: Props) {
  return (
    <PetunjukModal title="Petunjuk — Tahap 1: Seleksi Relevansi" defaultOpen={defaultOpen}>
      <p>
        Pada <strong>Tahap 1</strong> Anda memilih tugas yang <strong>relevan</strong> dengan
        jabatan Anda dari katalog. Pemilihannya <strong>bertingkat tiga level</strong>:{" "}
        <strong>Tugas Pokok → Detil Tugas → Uraian Tugas</strong>.
      </p>

      <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-950/40">
        <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-200">Petunjuk Umum</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-blue-900/90 dark:text-blue-200/90">
          <li>Centang item yang relevan pada tiap level.</li>
          <li>
            Hanya turunan dari item yang Anda pilih yang akan muncul di level berikutnya (Detil
            Tugas dari Tugas Pokok terpilih, Uraian Tugas dari Detil Tugas terpilih).
          </li>
          <li>Pilih minimal satu item di tiap level.</li>
          <li>
            Anda bisa menekan &ldquo;Simpan&rdquo; untuk menyimpan draft dan melanjutkan nanti.
          </li>
          <li>
            <strong>&ldquo;Kirim Seleksi&rdquo; mengunci pilihan Anda</strong> — setelah dikirim
            tidak dapat diubah lagi. Bila keliru, hubungi admin.
          </li>
          <li>
            Jujurlah — pilih hanya tugas yang{" "}
            <strong>benar-benar bagian dari pekerjaan Anda</strong>.
          </li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Cara Mengisi</h3>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Centang <strong>Tugas Pokok</strong> yang relevan → tekan &ldquo;Lanjut ke Detil
            Tugas&rdquo;.
          </li>
          <li>
            Centang <strong>Detil Tugas</strong> yang relevan → tekan &ldquo;Lanjut ke Uraian
            Tugas&rdquo;.
          </li>
          <li>
            Centang <strong>Uraian Tugas</strong> yang relevan → tekan &ldquo;Simpan&rdquo; atau
            &ldquo;Kirim Seleksi&rdquo;.
          </li>
        </ol>
      </div>
    </PetunjukModal>
  );
}
