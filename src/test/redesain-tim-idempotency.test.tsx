import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const post = vi.fn();
const patch = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: vi.fn(), POST: post, PATCH: patch }),
}));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh }) }));
const notifyGagal = vi.fn();
vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifySukses: vi.fn(),
  notifyGagal: (e: unknown) => notifyGagal(e),
}));

import { FormBukti } from "@/app/(auth)/redesain/masalah/[id]/form-bukti";
import { FormKoreksi } from "@/app/(auth)/redesain/masalah/[id]/form-koreksi";
import { MulaiPenilaian } from "@/app/(auth)/redesain/masalah/[id]/mulai-penilaian";
import { PilihStatus } from "@/app/(auth)/redesain/masalah/[id]/pilih-status";
import { ToggleKonfirmasi } from "@/app/(auth)/redesain/masalah/toggle-konfirmasi";
import { TambahKodeOrang } from "@/app/(auth)/redesain/kode-orang/tambah-kode-orang";
import { PESAN_MASIH_DIPROSES } from "@/lib/konkurensi";

const resp = (status = 200) => ({ status, headers: { get: () => "req-1" } });
const ok = (data: unknown, status = 200) => ({ data, response: resp(status) });
const gagal = (status: number, error: string, message: string) => ({
  data: undefined,
  error: { error, message },
  response: resp(status),
});

/** Klik tombol setelah ia aktif lagi (loading selesai). */
async function klikSetelahAktif(name: string | RegExp) {
  await waitFor(() => expect(screen.getByRole("button", { name })).not.toBeDisabled());
  fireEvent.click(screen.getByRole("button", { name }));
}

/** Ambil nilai Idempotency-Key dari panggilan POST ke-`n` (0-based). */
const keyKe = (n: number): string =>
  (post.mock.calls[n][1] as { headers: Record<string, string> }).headers["Idempotency-Key"];

beforeEach(() => {
  post.mockReset();
  patch.mockReset();
  refresh.mockReset();
  notifyGagal.mockReset();
});

describe("Idempotency-Key — form-bukti (mode tambah)", () => {
  const langkah = [{ id: "l1", label: "P-001-S01 — Pengumpulan data" }];
  const isiWajib = () => {
    fireEvent.change(screen.getByLabelText("Unit / periode"), { target: { value: "SD A" } });
    fireEvent.change(screen.getByLabelText("Klaim didukung"), { target: { value: "klaim" } });
    fireEvent.change(screen.getByLabelText(/Tanggal \/ versi \/ lokasi/), {
      target: { value: "Mei 2026" },
    });
  };
  const kirim = () =>
    fireEvent.click(screen.getByRole("button", { name: /Tambah bukti|Menyimpan/ }));

  it("mengirim key; kirim ulang setelah gagal memakai key sama; setelah sukses key berganti", async () => {
    post.mockResolvedValueOnce(gagal(500, "internal", "galat"));
    post.mockResolvedValueOnce(ok({ id: "b1", kode: "B-0001" }, 201));
    post.mockResolvedValueOnce(ok({ id: "b2", kode: "B-0002" }, 201));
    render(<FormBukti masalahId="m1" langkah={langkah} accessToken="tok" />);
    isiWajib();
    kirim();
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect(keyKe(0)).toBeTruthy();
    await klikSetelahAktif(/Tambah bukti/);
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(keyKe(1)).toBe(keyKe(0));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    isiWajib();
    await klikSetelahAktif(/Tambah bukti/);
    await waitFor(() => expect(post).toHaveBeenCalledTimes(3));
    expect(keyKe(2)).not.toBe(keyKe(1));
  });

  it("409 conflict → pesan baku; 409 kode lain tetap pesan aslinya", async () => {
    post.mockResolvedValueOnce(gagal(409, "conflict", "sedang diproses"));
    post.mockResolvedValueOnce(gagal(409, "kode_lain", "pesan asli"));
    render(<FormBukti masalahId="m1" langkah={langkah} accessToken="tok" />);
    isiWajib();
    kirim();
    expect(await screen.findByText(PESAN_MASIH_DIPROSES)).toBeInTheDocument();
    await klikSetelahAktif(/Tambah bukti/);
    expect(await screen.findByText("pesan asli")).toBeInTheDocument();
    expect(screen.queryByText(PESAN_MASIH_DIPROSES)).toBeNull();
  });
});

describe("Idempotency-Key — aksi tombol redesain", () => {
  it("MulaiPenilaian: 409 conflict → notifikasi pesan baku tanpa refresh; 409 lain → refresh", async () => {
    post.mockResolvedValueOnce(gagal(409, "conflict", "sedang diproses"));
    render(<MulaiPenilaian masalahId="m1" accessToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: "Mulai penilaian" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect((notifyGagal.mock.calls[0][0] as Error).message).toBe(PESAN_MASIH_DIPROSES);
    expect(refresh).not.toHaveBeenCalled();
    post.mockResolvedValueOnce(gagal(409, "PENILAIAN_SUDAH_ADA", "sudah ada"));
    await klikSetelahAktif("Mulai penilaian");
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(keyKe(1)).toBe(keyKe(0));
  });

  it("ToggleKonfirmasi: key sama setelah gagal, berganti setelah sukses", async () => {
    post.mockResolvedValueOnce(gagal(500, "internal", "galat"));
    post.mockResolvedValueOnce(ok({ id: "m1" }));
    post.mockResolvedValueOnce(ok({ id: "m1" }));
    render(<ToggleKonfirmasi id="m1" dibuka={false} accessToken="tok" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    await klikSetelahAktif(/Buka untuk konfirmasi sekolah/);
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(keyKe(1)).toBe(keyKe(0));
    await klikSetelahAktif(/Buka untuk konfirmasi sekolah/);
    await waitFor(() => expect(post).toHaveBeenCalledTimes(3));
    expect(keyKe(2)).not.toBe(keyKe(1));
  });

  it("PilihStatus: gagal lalu memilih status lain memakai key berbeda; isi sama tetap key sama", async () => {
    post.mockResolvedValueOnce(gagal(500, "internal", "galat"));
    post.mockResolvedValueOnce(gagal(500, "internal", "galat"));
    post.mockResolvedValueOnce(gagal(500, "internal", "galat"));
    render(<PilihStatus penilaianId="p1" statusSaatIni="Belum ditelaah" accessToken="tok" />);
    const pilih = () => screen.getByRole("combobox", { name: "Status penilaian" });
    const ubah = async (nilai: string, jumlah: number) => {
      await waitFor(() => expect(pilih()).not.toBeDisabled());
      fireEvent.change(pilih(), { target: { value: nilai } });
      await waitFor(() => expect(post).toHaveBeenCalledTimes(jumlah));
    };
    await ubah("Ditunda", 1);
    await ubah("Perlu klarifikasi", 2);
    expect(keyKe(1)).not.toBe(keyKe(0));
    await ubah("Perlu klarifikasi", 3);
    expect(keyKe(2)).toBe(keyKe(1));
  });

  it("FormKoreksi: 409 conflict → pesan baku; 409 kode lain tidak dipetakan", async () => {
    post.mockResolvedValueOnce(gagal(409, "conflict", "sedang diproses"));
    post.mockResolvedValueOnce(gagal(409, "kode_lain", "pesan asli"));
    render(<FormKoreksi langkahId="l1" accessToken="tok" />);
    fireEvent.change(screen.getByLabelText("Isi koreksi"), { target: { value: "isi" } });
    fireEvent.click(screen.getByRole("button", { name: "Tambah koreksi Tim" }));
    expect(await screen.findByText(PESAN_MASIH_DIPROSES)).toBeInTheDocument();
    await klikSetelahAktif("Tambah koreksi Tim");
    expect(await screen.findByText("pesan asli")).toBeInTheDocument();
    expect(keyKe(1)).toBe(keyKe(0));
  });

  it("TambahKodeOrang: 409 conflict → pesan baku; 409 lain → pesan konflik kode", async () => {
    post.mockResolvedValueOnce(gagal(409, "conflict", "sedang diproses"));
    post.mockResolvedValueOnce(gagal(409, "kode_ada", "x"));
    render(<TambahKodeOrang partisipan={[]} accessToken="tok" />);
    fireEvent.change(screen.getByLabelText(/Keterangan peran/), { target: { value: "Kepsek" } });
    fireEvent.submit(screen.getByRole("button", { name: /Tambah/ }).closest("form")!);
    expect(await screen.findByText(PESAN_MASIH_DIPROSES)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /Tambah/ })).not.toBeDisabled());
    fireEvent.submit(screen.getByRole("button", { name: /Tambah/ }).closest("form")!);
    expect(await screen.findByText("Partisipan ini sudah punya kode")).toBeInTheDocument();
    expect(keyKe(1)).toBe(keyKe(0));
  });
});

/** Kumpulkan berkas `.tsx` non-test di bawah `dir`. */
function berkasTsx(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? berkasTsx(p) : p.endsWith(".tsx") ? [p] : [];
  });
}

describe("Idempotency-Key — jaring pengaman cakupan 16 POST tulis redesain", () => {
  it("setiap berkas redesain yang memanggil POST tulis (bukan /search) memakai header key", () => {
    const akar = join(process.cwd(), "src/app/(auth)/redesain");
    const pelanggar: string[] = [];
    let jumlahBerkas = 0;
    for (const f of berkasTsx(akar)) {
      const src = readFileSync(f, "utf8");
      const tulis = (src.match(/\.POST\(\s*"[^"]*"/g) ?? []).filter((m) => !m.includes("/search"));
      if (tulis.length === 0) continue;
      jumlahBerkas += 1;
      // Aksi berisi tetap (mulai-penilaian) memakai `idem.key`; semua aksi lain wajib `keyUntuk`.
      const tetap = f.endsWith("mulai-penilaian.tsx");
      const pola = tetap
        ? /headerIdempotencyKey\(idem\.key\)/g
        : /headerIdempotencyKey\(idem\.keyUntuk\(\w+\)\)/g;
      const dipasang = (src.match(pola) ?? []).length;
      const sisaKeyTelanjang = tetap
        ? 0
        : (src.match(/headerIdempotencyKey\(idem\.key\)/g) ?? []).length;
      if (dipasang < tulis.length || sisaKeyTelanjang > 0 || !src.includes("useIdempotencyKey")) {
        pelanggar.push(f);
      }
    }
    expect(pelanggar).toEqual([]);
    expect(jumlahBerkas).toBe(16);
  });
});
