"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";

/**
 * Petunjuk penggunaan halaman Detail Masalah Redesain (Tim Kajian).
 *
 * Ringkasan statis dari IK-10; tidak memanggil API. Tidak terbuka sendiri saat dimuat.
 *
 * @returns Tombol "Petunjuk" dan dialog berisi cara memakai halaman detail masalah.
 */
export function PetunjukDetailMasalah() {
  return (
    <PetunjukModal
      title="Petunjuk: Detail Masalah"
      defaultOpen={false}
      triggerLabel="Petunjuk"
      ctaLabel="Mengerti"
    >
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
        <p>Halaman ini memperlihatkan satu masalah dari berbagai sisi lewat tab bagian.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Tab <strong>Alur</strong>, <strong>Penilaian</strong>, <strong>Konfirmasi</strong>,{" "}
            <strong>Bukti</strong>, dan <strong>Alternatif</strong>. Proses sekolah berbeda tidak
            pernah digabung.
          </li>
          <li>
            Tab Penilaian: klik <strong>Mulai penilaian</strong>, isi Status bukti, Gap material,
            Indikasi kritis, dan K1 sampai K4, lalu <strong>Simpan penilaian</strong>. Saran sistem
            bukan keputusan.
          </li>
          <li>
            Prioritas final: klik <strong>Catat keputusan prioritas</strong>, pilih prioritas, isi
            alasan (selalu wajib), pemutus, dan tanggal, lalu <strong>Simpan keputusan</strong>.
          </li>
          <li>
            Tabel <strong>Sebaran K1–K4</strong> menghitung jawaban konfirmasi sekolah; ini bahan
            pertimbangan, bukan skor.
          </li>
          <li>
            Tab Alternatif ditelaah terpisah dari skor K1–K4; prioritas tinggi bukan izin
            memindahkan tugas.
          </li>
          <li>
            Klik <strong>Unduh Lembar Konfirmasi</strong> untuk berkas DOCX pra-isi.
          </li>
        </ul>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Panduan lengkap: &quot;IK-10 Redesain Pekerjaan&quot;.
        </p>
      </div>
    </PetunjukModal>
  );
}
