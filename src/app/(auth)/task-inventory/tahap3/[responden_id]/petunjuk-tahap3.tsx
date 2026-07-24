"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";
import { SUMBER_BUKTI, KONDISI, VA_TYPE } from "@/components/calhr";

/**
 * Makna tiap nilai `SUMBER_BUKTI` (`@/components/calhr`). Nilai opsinya sendiri
 * dibaca dari konstanta, bukan diketik ulang sebagai literal — hanya
 * penjelasannya yang statis di sini (teks final sesuai `## Keputusan Desain`
 * issue backlog #36).
 */
const SUMBER_BUKTI_MAKNA: Record<(typeof SUMBER_BUKTI)[number], string> = {
  Formal: "tertulis di SK/uraian jabatan resmi",
  Aktual: "nyata dikerjakan meski tidak tertulis",
  Keduanya: "tertulis sekaligus dikerjakan",
};

/** Makna tiap nilai `KONDISI` (`@/components/calhr`). */
const KONDISI_MAKNA: Record<(typeof KONDISI)[number], string> = {
  Baseline: "terjadi pada pekan kerja biasa",
  Peak: "hanya pada periode puncak (awal tahun ajaran, ujian, akreditasi, PPDB)",
  Both: "terjadi di kedua kondisi",
};

/** Makna tiap nilai `VA_TYPE` (`@/components/calhr`). */
const VA_TYPE_MAKNA: Record<(typeof VA_TYPE)[number], string> = {
  "VA-Core": "inti, langsung menghasilkan nilai bagi murid/layanan utama",
  "VA-Enable": "pendukung yang memungkinkan pekerjaan inti berjalan",
  "NVA-Residual": "tidak menambah nilai tapi tetap harus dilakukan",
  "Context-Dependent": "nilainya bergantung konteks/hasil",
  "Needs Validation": "belum bisa diputuskan, perlu validasi lanjutan",
};

interface Props {
  defaultOpen: boolean;
}

/**
 * Konten petunjuk pengisian Tahap 3 Task Inventory (detailing CalHR),
 * dirender di dalam {@link PetunjukModal}.
 *
 * Setara kedalaman dengan `PetunjukDcs`/`PetunjukWcp` (issue backlog #36).
 * Blok "Arti Kolom CalHR" yang sebelumnya hanya mendaftar nilai opsi tanpa
 * penjelasan (mis. "Sumber Bukti — Formal / Aktual / Keduanya") diperluas
 * menjadi makna tiap nilai satu per satu (`SUMBER_BUKTI_MAKNA`,
 * `KONDISI_MAKNA`, `VA_TYPE_MAKNA`) — istilah seperti `VA-Core`/
 * `NVA-Residual`/`Baseline`/`Peak` tidak dikenal guru & staf sekolah tanpa
 * penjelasan eksplisit. Blok baru "Contoh Pengisian (ilustrasi)" menampilkan
 * satu kartu tugas dengan ketujuh kolom CalHR terisi, meniru gaya kartu contoh
 * non-interaktif `PetunjukDcs`.
 *
 * Isi teks & data contoh mengikuti `## Keputusan Desain` issue #36 apa adanya
 * — bukan konten yang boleh dikarang ulang. Nilai opsi (`Formal`/`Aktual`/
 * `Keduanya`, `Baseline`/`Peak`/`Both`, lima `VA_TYPE`) tetap dibaca dari
 * `@/components/calhr.ts`, bukan diketik ulang sebagai literal.
 */
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
        <ul className="space-y-3">
          <li>
            <strong>Sumber Bukti</strong>
            <ul className="mt-1 list-disc space-y-1 pl-5 font-normal">
              {SUMBER_BUKTI.map((v) => (
                <li key={v}>
                  <strong>{v}</strong> = {SUMBER_BUKTI_MAKNA[v]}
                </li>
              ))}
            </ul>
          </li>
          <li>
            <strong>Kondisi</strong>
            <ul className="mt-1 list-disc space-y-1 pl-5 font-normal">
              {KONDISI.map((v) => (
                <li key={v}>
                  <strong>{v}</strong> = {KONDISI_MAKNA[v]}
                </li>
              ))}
            </ul>
          </li>
          <li>
            <strong>Durasi/kali</strong> — lama sekali kerja dalam <strong>menit</strong>.
          </li>
          <li>
            <strong>Jam/minggu</strong> — perkiraan jam per pekan pada kondisi biasa ≈ (durasi ×
            jumlah kali per pekan) ÷ 60.
          </li>
          <li>
            <strong>Jam peak (4 minggu)</strong> — <strong>total</strong> jam untuk tugas ini
            sepanjang 4 pekan periode puncak, <strong>bukan</strong> per pekan.
          </li>
          <li>
            <strong>VA Type</strong>
            <ul className="mt-1 list-disc space-y-1 pl-5 font-normal">
              {VA_TYPE.map((v) => (
                <li key={v}>
                  <strong>{v}</strong> = {VA_TYPE_MAKNA[v]}
                </li>
              ))}
            </ul>
          </li>
        </ul>
        <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
          Keterangan &ldquo;(petunjuk standar: …)&rdquo; di samping Durasi hanya acuan — tetap isi
          angka sesuai keadaan Anda sendiri.
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">
          Contoh Pengisian (ilustrasi)
        </h3>
        <div className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            &ldquo;Menyusun modul ajar per pekan&rdquo;
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>Sumber Bukti: Keduanya</li>
            <li>Kondisi: Baseline</li>
            <li>Frekuensi: Mingguan</li>
            <li>Durasi/kali: 90 menit</li>
            <li>Jam/minggu: 1,5 jam/minggu</li>
            <li>Jam peak (4 minggu): 8 jam peak</li>
            <li>VA Type: VA-Core</li>
          </ul>
        </div>
        <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
          Angka pada contoh di atas hanya ilustrasi — isi sesuai beban kerja Anda yang sebenarnya.
        </p>
      </div>
    </PetunjukModal>
  );
}
