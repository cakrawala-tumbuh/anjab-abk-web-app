/**
 * `ambilSemuaHalaman` — pengganti `limit: 500` telanjang.
 *
 * `POST …/search` membatasi `limit` ≤ 100 (GET koleksi ≤ 500), jadi satu panggilan
 * `limit: 500` BUKAN "ambil semua": koleksi di atas 500 baris terpotong senyap.
 * Test ini menjaga tiga hal: seluruh halaman benar-benar diambil, error dari
 * callback diteruskan apa adanya (bukan ditelan jadi `[]`), dan backend yang
 * tidak konsisten gagal keras alih-alih mengembalikan daftar terpotong.
 */
import { describe, it, expect, vi } from "vitest";
import { ambilSemuaHalaman, LIMIT_MAKS, MAKS_HALAMAN } from "@/lib/api/paginasi";

/** Pengambil halaman palsu di atas sebuah array sumber. */
function pengambil(total: number) {
  const sumber = Array.from({ length: total }, (_, i) => `item-${i + 1}`);
  const panggilan: { limit: number; offset: number }[] = [];
  const ambil = async (limit: number, offset: number) => {
    panggilan.push({ limit, offset });
    return { items: sumber.slice(offset, offset + limit), total };
  };
  return { ambil, panggilan };
}

describe("ambilSemuaHalaman", () => {
  it("LIMIT_MAKS = 100 dan MAKS_HALAMAN = 250", () => {
    expect(LIMIT_MAKS).toBe(100);
    expect(MAKS_HALAMAN).toBe(250);
  });

  it("total 250 → 3 panggilan (100/100/100) offset 0/100/200, 250 item berurutan", async () => {
    const { ambil, panggilan } = pengambil(250);
    const hasil = await ambilSemuaHalaman<string>(ambil);

    expect(hasil).toHaveLength(250);
    expect(hasil[0]).toBe("item-1");
    expect(hasil[249]).toBe("item-250");
    expect(hasil).toEqual(Array.from({ length: 250 }, (_, i) => `item-${i + 1}`));
    expect(panggilan).toEqual([
      { limit: 100, offset: 0 },
      { limit: 100, offset: 100 },
      { limit: 100, offset: 200 },
    ]);
    expect(panggilan.every((p) => p.limit <= 100)).toBe(true);
  });

  it("total di bawah satu halaman → cukup satu panggilan", async () => {
    const { ambil, panggilan } = pengambil(37);
    const hasil = await ambilSemuaHalaman<string>(ambil);

    expect(hasil).toHaveLength(37);
    expect(panggilan).toHaveLength(1);
  });

  it("koleksi kosong → satu panggilan, hasil kosong, tanpa error", async () => {
    const { ambil, panggilan } = pengambil(0);
    await expect(ambilSemuaHalaman<string>(ambil)).resolves.toEqual([]);
    expect(panggilan).toHaveLength(1);
  });

  it("`limit` kustom dihormati", async () => {
    const { ambil, panggilan } = pengambil(5);
    const hasil = await ambilSemuaHalaman<string>(ambil, 2);

    expect(hasil).toHaveLength(5);
    expect(panggilan).toEqual([
      { limit: 2, offset: 0 },
      { limit: 2, offset: 2 },
      { limit: 2, offset: 4 },
    ]);
  });

  it("callback melempar → error diteruskan apa adanya (tidak jadi [])", async () => {
    const err = new Error("401 tidak berhak");
    const ambil = vi.fn().mockRejectedValue(err);

    await expect(ambilSemuaHalaman<string>(ambil)).rejects.toBe(err);
  });

  it("callback melempar di halaman kedua → error tetap diteruskan", async () => {
    const err = new Error("500 gagal");
    const ambil = vi
      .fn()
      .mockResolvedValueOnce({ items: Array.from({ length: 100 }, () => "x"), total: 1200 })
      .mockRejectedValueOnce(err);

    await expect(ambilSemuaHalaman<string>(ambil)).rejects.toBe(err);
  });

  it("halaman kosong padahal total belum tercapai → melempar Error", async () => {
    const ambil = vi
      .fn()
      .mockResolvedValueOnce({ items: Array.from({ length: 100 }, () => "x"), total: 1200 })
      .mockResolvedValue({ items: [], total: 1200 });

    await expect(ambilSemuaHalaman<string>(ambil)).rejects.toThrow(/kosong padahal/);
  });

  it("iterasi melewati pagar aman → melempar Error, tidak berputar tanpa henti", async () => {
    // Backend berbohong: `total` sangat besar tapi tiap halaman hanya 1 item.
    const ambil = vi.fn(async () => ({ items: ["x"], total: 1_000_000 }));

    await expect(ambilSemuaHalaman<string>(ambil, 1)).rejects.toThrow(/melewati 250 halaman/);
    expect(ambil).toHaveBeenCalledTimes(MAKS_HALAMAN);
  });
});
