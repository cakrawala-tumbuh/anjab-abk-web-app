"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";

interface Props {
  /** Bila true, dialog terbuka otomatis saat dimuat (konfirmasi belum terkirim). */
  defaultOpen: boolean;
}

/**
 * Petunjuk pengisian wizard Konfirmasi Redesain (Pengisi Sekolah).
 *
 * Ringkasan statis dari IK-11; tidak memanggil API. Terbuka otomatis selama konfirmasi belum terkirim.
 *
 * @param props.defaultOpen - `true` bila konfirmasi belum terkirim.
 * @returns Tombol "Petunjuk Pengisian" dan dialog berisi cara mengisi wizard.
 */
export function PetunjukKonfirmasi({ defaultOpen }: Props) {
  return (
    <PetunjukModal title="Petunjuk: Konfirmasi Redesain" defaultOpen={defaultOpen}>
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
        <p>
          Konfirmasi diisi sendiri dalam <strong>lima langkah</strong>.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Cerita dikunci lebih dulu</strong>, baru dugaan Tim Kajian diperlihatkan, agar
            jawaban tidak sekadar menyetujui dugaan.
          </li>
          <li>
            Langkah 1: tulis <strong>Cerita Anda</strong>, <strong>Simpan draf</strong>, lalu{" "}
            <strong>Kunci cerita</strong>.
          </li>
          <li>
            Langkah 2: klik <strong>Tampilkan dugaan</strong>, pilih kesesuaian, dan isi koreksi
            bila ada.
          </li>
          <li>Langkah 3 dan 4: jelaskan akibat dan periksa sumber.</li>
          <li>
            Langkah 5: periksa ringkasan, lalu klik <strong>Kirim</strong>. Sesudah terkirim semua
            isian hanya-baca; ralat lewat menu <strong>Isian Saya</strong>.
          </li>
          <li>
            <strong>Privasi:</strong> jangan menulis nama orang, identitas atau kasus
            murid/keluarga, diagnosis, atau isi konseling. Tulis jabatan atau peran.
          </li>
        </ul>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Panduan lengkap: &quot;IK-11 Konfirmasi Redesain&quot;.
        </p>
      </div>
    </PetunjukModal>
  );
}
