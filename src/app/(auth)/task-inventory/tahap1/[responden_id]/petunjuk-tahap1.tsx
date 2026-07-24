"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";

interface Props {
  defaultOpen: boolean;
}

/**
 * Konten petunjuk pengisian Tahap 1 Task Inventory (seleksi relevansi tugas),
 * dirender di dalam {@link PetunjukModal}.
 *
 * Setara kedalaman dengan `PetunjukDcs`/`PetunjukWcp` (issue backlog #36): di
 * samping "Petunjuk Umum" & "Cara Mengisi" yang sudah ada sejak backlog 049,
 * komponen ini menambahkan blok "Kapan Mencentang" (kriteria konkret memilih
 * sebuah task) dan blok "Contoh Pengisian (ilustrasi)" — kaskade tiga level
 * (Tugas Pokok → Detil Tugas → Uraian Tugas) dengan checkbox statis (☑/☐),
 * meniru gaya kartu contoh non-interaktif `PetunjukDcs`.
 *
 * Isi teks & data contoh mengikuti `## Keputusan Desain` issue #36 apa adanya
 * — bukan konten yang boleh dikarang ulang.
 */
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
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Kapan Mencentang</h3>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Centang</strong> bila tugas <strong>benar-benar bagian pekerjaan Anda</strong>{" "}
            walau jarang dilakukan.
          </li>
          <li>
            <strong>Jangan centang</strong> bila itu tugas rekan/jabatan lain, atau Anda hanya
            pernah sekali membantu.
          </li>
          <li>
            <strong>Bila ragu, centang</strong> — task yang tidak dipilih bulat oleh seluruh anggota
            panel akan diputuskan koordinator di Tahap 2.
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

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">
          Contoh Pengisian (ilustrasi)
        </h3>
        <div className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="mb-2 text-xs font-medium text-gray-400">Tugas Pokok</p>
          <ul className="space-y-1 pl-1 text-sm text-gray-800 dark:text-gray-200">
            <li>☑ Perencanaan Pembelajaran</li>
            <li>☐ Pengelolaan Sarana Laboratorium</li>
          </ul>

          <p className="mb-2 mt-4 pl-4 text-xs font-medium text-gray-400">
            ↳ Detil Tugas (turunan &ldquo;Perencanaan Pembelajaran&rdquo;)
          </p>
          <ul className="space-y-1 pl-5 text-sm text-gray-800 dark:text-gray-200">
            <li>☑ Menyusun perangkat ajar</li>
          </ul>

          <p className="mb-2 mt-4 pl-8 text-xs font-medium text-gray-400">
            ↳ Uraian Tugas (turunan &ldquo;Menyusun perangkat ajar&rdquo;)
          </p>
          <ul className="space-y-1 pl-9 text-sm text-gray-800 dark:text-gray-200">
            <li>☑ Menyusun modul ajar per pekan</li>
          </ul>

          <p className="mt-3 text-xs italic text-gray-500 dark:text-gray-400">
            &ldquo;Pengelolaan Sarana Laboratorium&rdquo; tidak dicentang, sehingga Detil Tugas dan
            Uraian Tugas turunannya tidak akan muncul sama sekali di level berikutnya.
          </p>
        </div>
        <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
          Contoh di atas hanya ilustrasi — pilih sesuai tugas Anda yang sebenarnya.
        </p>
      </div>
    </PetunjukModal>
  );
}
