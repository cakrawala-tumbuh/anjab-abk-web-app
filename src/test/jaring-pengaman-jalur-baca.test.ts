/**
 * JARING PENGAMAN — jalur BACA tidak boleh menelan kegagalan API secara senyap.
 *
 * Backlog 017 → 026 → 029 → 031 memberantas kelas bug yang sama berulang kali:
 * respons gagal (401/403/5xx) di-`?? []`-kan menjadi daftar kosong, lalu halaman
 * merender daftar/dropdown/formulir kosong yang TIDAK TERBEDAKAN dari "memang
 * belum ada data" — notifikasi bohong.
 *
 * Ia terus kembali karena tiap pemberantasan hanya mengejar SATU ejaan pola-nya:
 * grep 026 (`\.data \?\? \[\]`) tidak menangkap varian `\.data\?\.items \?\? \[\]`,
 * sehingga ~25 kemunculan di jalur data PENDUKUNG lolos sampai backlog 031.
 *
 * Test ini menutup celah itu secara permanen: SEMUA ejaan dilarang di seluruh
 * `src/`, dan satu-satunya jalan keluar adalah menambahkan entri ke
 * `PENGECUALIAN` di bawah — yang berarti keputusannya harus eksplisit, ditinjau,
 * dan terlihat di review, bukan diselundupkan lewat ejaan baru.
 *
 * Yang benar (lihat `src/lib/api/errors.ts` & `src/lib/api/pendukung.ts`):
 *   - Data INTI gagal      → `if (!res.data) throw apiErrorDari(res);`
 *   - Data PENDUKUNG gagal → `pendukungList(...)` + render `<GagalMuatSebagian>`
 *   - Client Component     → lempar, laporkan lewat `notifyGagal(err)`
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const SRC = join(process.cwd(), "src");

/** Berkas yang tidak diperiksa: test itu sendiri + artefak generate. */
const LEWATI = [join("src", "test") + sep, join("src", "lib", "api", "schema.ts")];

/**
 * PENGECUALIAN yang sudah dikunci — 404 di sini adalah jawaban SAH backend,
 * bukan kegagalan. Menambah entri baru = keputusan sadar, bukan kelalaian.
 *
 * - `GET /partisipan/saya` → 404 untuk admin yang bukan partisipan (backlog 026).
 *   Sejak issue #21, baris `sayaRes.data?.id ?? null` didahului guard eksplisit
 *   `if (!sayaRes.data && sayaRes.response.status !== 404) throw apiErrorDari(sayaRes);`
 *   — hanya 404 yang jatuh ke `?? null`; 401/403/5xx melempar seperti data
 *   kritis lain. Sebelumnya guard ini tidak ada dan SEMUA status ditelan.
 * - `GET .../seleksi` → 404 pada kunjungan pertama Tahap 1 sudah ditangani
 *   secara eksplisit lewat pengecekan `err.status !== 404` (bukan `?? []`),
 *   jadi ia tidak perlu terdaftar di sini.
 */
const PENGECUALIAN: { berkas: string; penggalan: string }[] = [
  {
    berkas: join("src", "app", "(auth)", "task-inventory", "tahap2", "[sesi_id]", "page.tsx"),
    penggalan: "sayaRes.data?.id ?? null",
  },
];

/**
 * Ejaan-ejaan pola telan-senyap. Sengaja luas: `.data ?? X` DAN `.data?.apa ?? X`
 * (varian inilah yang lolos dari grep backlog 026).
 */
const POLA_TERLARANG: { nama: string; re: RegExp }[] = [
  {
    nama: "`.data ?? []` / `.data ?? null` — kegagalan API ditelan jadi kekosongan",
    re: /\.data\s*\?\?\s*(\[\]|null)/g,
  },
  {
    nama: "`.data?.<apa pun> ?? …` — varian yang lolos dari grep backlog 026",
    re: /\.data\?\.[A-Za-z_$][\w$]*(\?\.\[?\d*\]?)?\s*\?\?\s*/g,
  },
  {
    nama: "`.catch(() => set…)` — kegagalan Client Component ditelan (backlog 029)",
    re: /\.catch\(\s*\(\s*\)\s*=>\s*set/g,
  },
  {
    nama: "klien `api` telanjang tanpa Bearer — wajib lewat withServerAuth (backlog 029)",
    re: /(^|[^.\w])api\.(GET|POST|PATCH|PUT|DELETE)\(/g,
  },
];

/** Buang komentar agar contoh pola di dalam dokumentasi tidak ikut tertangkap. */
function tanpaKomentar(isi: string): string {
  return isi.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

function berkasSumber(dir: string): string[] {
  const hasil: string[] = [];
  for (const nama of readdirSync(dir)) {
    const penuh = join(dir, nama);
    if (statSync(penuh).isDirectory()) {
      hasil.push(...berkasSumber(penuh));
    } else if (/\.tsx?$/.test(nama)) {
      hasil.push(penuh);
    }
  }
  return hasil;
}

function dikecualikan(berkas: string, baris: string): boolean {
  return PENGECUALIAN.some((p) => berkas.endsWith(p.berkas) && baris.includes(p.penggalan));
}

describe("jaring pengaman: jalur baca dilarang menelan kegagalan API", () => {
  const berkas = berkasSumber(SRC)
    .map((f) => relative(process.cwd(), f))
    .filter((f) => !LEWATI.some((l) => f.startsWith(l) || f === l));

  it("menemukan berkas sumber untuk diperiksa (jaring ini tidak boleh kosong)", () => {
    expect(berkas.length).toBeGreaterThan(50);
  });

  for (const { nama, re } of POLA_TERLARANG) {
    it(`nol kemunculan: ${nama}`, () => {
      const pelanggaran: string[] = [];

      for (const f of berkas) {
        const baris = tanpaKomentar(readFileSync(f, "utf8")).split("\n");
        baris.forEach((isi, i) => {
          re.lastIndex = 0;
          if (!re.test(isi)) return;
          if (dikecualikan(f, isi)) return;
          pelanggaran.push(`${f}:${i + 1}: ${isi.trim()}`);
        });
      }

      expect(pelanggaran).toEqual([]);
    });
  }

  it("pengecualian yang terdaftar masih benar-benar ada (jangan jadi allowlist basi)", () => {
    for (const p of PENGECUALIAN) {
      const isi = readFileSync(join(process.cwd(), p.berkas), "utf8");
      expect(isi, `${p.berkas} tidak lagi memuat "${p.penggalan}"`).toContain(p.penggalan);
    }
  });
});
