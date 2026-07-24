"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";

/**
 * Definisi & contoh aktivitas per kategori Time Study — teks final Keputusan
 * Desain issue #38. Label (`label`) disalin persis dari `KATEGORI` di
 * `tambah/ts-log-form.tsx`; urutan mengikuti urutan di form. `definisi` dan
 * `contoh` adalah tambahan baru (sebelumnya kategori hanya disebut namanya).
 */
const KATEGORI = [
  {
    label: "Pekerjaan Inti",
    definisi: "Tugas utama jabatan yang langsung melayani murid atau mandat pokok jabatan",
    contoh: "mengajar di kelas, membimbing praktik, melayani wali murid",
  },
  {
    label: "Asesmen Karakter",
    definisi: "Menilai, membina, dan mendampingi karakter serta perilaku murid",
    contoh: "pembinaan sikap, penilaian karakter, penanganan kasus siswa",
  },
  {
    label: "Pengembangan Diri",
    definisi: "Belajar atau berlatih untuk meningkatkan kompetensi sendiri",
    contoh: "pelatihan, KKG/MGMP, membaca literatur profesi",
  },
  {
    label: "Pekerjaan Strategis",
    definisi: "Merancang & mengembangkan program, bukan menjalankan rutinitas",
    contoh: "rapat program, menyusun kurikulum/kebijakan, evaluasi program",
  },
  {
    label: "Administrasi",
    definisi: "Mencatat, melaporkan, dan mengarsipkan",
    contoh: "mengisi aplikasi/rapor, membuat laporan, mengarsipkan berkas",
  },
  {
    label: "Istirahat Terstruktur",
    definisi: "Jeda yang memang dijadwalkan dalam hari kerja",
    contoh: "istirahat, ibadah, makan siang",
  },
] as const;

/**
 * Kriteria Kategori Hari — teks final Keputusan Desain issue #38. `warna`
 * disalin dari nilai `day_color` (`GREEN`/`YELLOW`/`RED`) yang ditampilkan
 * sebagai Hijau/Kuning/Merah; `label` disalin dari opsi `<select>` di
 * `tambah/ts-log-form.tsx`; `kriteria` adalah tambahan baru.
 */
const KATEGORI_HARI = [
  {
    warna: "Hijau",
    label: "Hari Biasa",
    kriteria: "beban seperti hari kerja pada umumnya, tanpa agenda luar biasa",
  },
  {
    warna: "Kuning",
    label: "Hari Sibuk",
    kriteria: "ada agenda tambahan di luar rutinitas sehingga beban lebih berat dari biasanya",
  },
  {
    warna: "Merah",
    label: "Hari Puncak",
    kriteria:
      "beban tertinggi seperti pekan ujian, akreditasi, PPDB, atau awal tahun ajaran, kerap melewati jam kerja normal",
  },
] as const;

/**
 * Satu baris distribusi waktu pada kartu "Contoh Pengisian (ilustrasi)".
 * `label` mengikuti urutan & teks {@link KATEGORI}.
 */
interface ContohBaris {
  label: string;
  jam: number;
  menit: number;
}

/**
 * Log terisi penuh untuk kartu "Contoh Pengisian (ilustrasi)" — angka final
 * Keputusan Desain issue #38, murni ilustrasi (bukan data nyata). Jumlah
 * keenam kategori (8 j 30 m) sengaja dibuat mendekati rentang waktu masuk–keluar
 * (07.00–15.30 = 8 j 30 m) untuk mencontohkan anjuran, bukan aturan wajib.
 */
const CONTOH_DISTRIBUSI: ContohBaris[] = [
  { label: "Pekerjaan Inti", jam: 4, menit: 30 },
  { label: "Asesmen Karakter", jam: 0, menit: 45 },
  { label: "Pengembangan Diri", jam: 0, menit: 30 },
  { label: "Pekerjaan Strategis", jam: 1, menit: 0 },
  { label: "Administrasi", jam: 1, menit: 0 },
  { label: "Istirahat Terstruktur", jam: 0, menit: 45 },
];

interface Props {
  defaultOpen: boolean;
}

/**
 * Pop-up petunjuk pengisian log harian Time Study — dirender di halaman
 * `/time-study/isi/{penugasan_id}` lewat {@link PetunjukModal} bersama
 * (pola backlog #20/049). Memuat definisi & contoh aktivitas keenam kategori,
 * kriteria ketiga Kategori Hari, dan satu kartu "Contoh Pengisian (ilustrasi)"
 * berisi log terisi penuh non-interaktif (backlog #38 — sebelumnya petunjuk
 * ini hanya mendaftar nama kategori tanpa definisi maupun contoh).
 *
 * @param props.defaultOpen - Bila `true`, modal terbuka otomatis sekali saat mount.
 */
export function PetunjukTs({ defaultOpen }: Props) {
  return (
    <PetunjukModal
      title="Petunjuk Pengisian Log Harian Time Study"
      defaultOpen={defaultOpen}
      ctaLabel="Saya Mengerti"
    >
      <p>
        <strong>Time Study (Studi Waktu)</strong> mencatat distribusi waktu kerja Anda per hari
        untuk mengukur beban kerja. Isi <strong>satu log tiap hari kerja</strong> selama penugasan
        aktif — jangan menumpuknya di akhir, karena ingatan atas rincian waktu memudar.
      </p>

      <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-950/40">
        <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-200">Petunjuk Umum</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-blue-900/90 dark:text-blue-200/90">
          <li>Isi waktu masuk dan waktu keluar Anda pada hari itu.</li>
          <li>
            Bagi durasi kerja Anda ke dalam <strong>enam kategori aktivitas</strong> (dalam jam dan
            menit).
          </li>
          <li>Pilih Kategori Hari sesuai tingkat kesibukan hari itu.</li>
          <li>Log yang sudah dibuat masih bisa diedit selama penugasan aktif.</li>
          <li>
            Isilah sejujurnya — data dipakai untuk analisis beban kerja, bukan menilai kinerja.
          </li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">
          Enam Kategori Aktivitas
        </h3>
        <ul className="space-y-2">
          {KATEGORI.map((k) => (
            <li key={k.label}>
              <strong>{k.label}</strong> — {k.definisi}.
              <br />
              <span className="text-xs text-gray-500 dark:text-gray-400">Contoh: {k.contoh}.</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Kategori Hari</h3>
        <ul className="space-y-1.5">
          {KATEGORI_HARI.map((h) => (
            <li key={h.warna}>
              <strong>
                {h.warna} ({h.label})
              </strong>{" "}
              — {h.kriteria}.
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Cara Mengisi</h3>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Pilih tanggal log.</li>
          <li>Isi waktu masuk dan waktu keluar.</li>
          <li>Isi jam dan menit untuk tiap kategori aktivitas.</li>
          <li>Pilih Kategori Hari (Hijau/Kuning/Merah).</li>
          <li>Tekan &ldquo;Simpan Log&rdquo;. Ulangi tiap hari kerja.</li>
        </ol>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">
          Contoh Pengisian (ilustrasi)
        </h3>
        <div className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-sm text-gray-800 dark:text-gray-200">
            Waktu Masuk <strong>07.00</strong> — Waktu Keluar <strong>15.30</strong> — Kategori Hari{" "}
            <strong>Hijau (Hari Biasa)</strong>
          </p>
          <ul className="mt-3 space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {CONTOH_DISTRIBUSI.map((c) => (
              <li key={c.label} className="flex justify-between gap-4">
                <span>{c.label}</span>
                <span className="font-mono">
                  {c.jam} j {c.menit} m
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Jumlah keenam kategori pada contoh di atas (8 j 30 m) <strong>sebaiknya mendekati</strong>{" "}
          rentang waktu masuk–keluar Anda.
        </p>
        <p className="mt-1 text-xs italic text-gray-500 dark:text-gray-400">
          Contoh di atas hanya ilustrasi — isilah sesuai keadaan Anda sendiri.
        </p>
      </div>
    </PetunjukModal>
  );
}
