import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/lib/api/client", () => ({ withServerAuth: () => ({ POST: post }) }));
vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifySukses: vi.fn(),
  notifyGagal: vi.fn(),
}));

import { KritikVersiAi } from "@/app/(auth)/narasi/antrean/[narasi_id]/kritik-versi-ai";
import { TanyaBuktiAi } from "@/app/(auth)/narasi/kasus/[id]/tanya-bukti-ai";
import { EkstraksiSumberAi } from "@/app/(auth)/narasi/sumber/[id]/ekstraksi-sumber-ai";
import { validasiP04, validasiPeranRef } from "@/lib/ai-usulan-narasi";
import { notifySukses } from "@/lib/notify";

const OK = { data: { id: "u1" }, response: new Response() };
const GAGAL_409 = {
  data: undefined,
  error: { error: "usulan_berjalan", message: "Sudah ada usulan berjalan." },
  response: new Response(null, { status: 409 }),
};
const GAGAL_422 = {
  data: undefined,
  error: { error: "validation_error", message: "Isian tidak valid dari server." },
  response: new Response(null, { status: 422 }),
};

beforeEach(() => {
  post.mockReset();
  vi.mocked(notifySukses).mockReset();
});

describe("validasi murni", () => {
  it("peran_ref", () => {
    expect(validasiPeranRef("guru.sd:1")).toBeNull();
    expect(validasiPeranRef("guru sd")).not.toBeNull();
    expect(validasiPeranRef("")).not.toBeNull();
  });
  it("P04", () => {
    expect(validasiP04("abcde", "fghij", 1)).toBeNull();
    expect(validasiP04("abcd", "fghij", 1)).not.toBeNull();
    expect(validasiP04("abcde", "fghij", 0)).toBe("Pilih minimal satu sumber.");
  });
});

describe("EkstraksiSumberAi (P01)", () => {
  const props = { accessToken: "t", sumberId: "s1", periodeAwal: "2026/27" };

  it("kirim sah: body, header idempotensi, tautan usulan", async () => {
    post.mockResolvedValue(OK);
    render(<EkstraksiSumberAi {...props} />);
    fireEvent.change(screen.getByLabelText("Peran"), { target: { value: "guru-sd" } });
    fireEvent.click(screen.getByRole("button", { name: "Ekstrak dengan AI" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    const opsi = post.mock.calls[0][1];
    expect(opsi.body).toEqual({ peran_ref: "guru-sd", periode: "2026/27" });
    expect(opsi.params.path.sumber_id).toBe("s1");
    expect(opsi.headers["Idempotency-Key"]).toBeTruthy();
    expect(await screen.findByRole("link", { name: "Buka usulan" })).toHaveAttribute(
      "href",
      "/ai-usulan/u1",
    );
  });

  it("peran berspasi tidak memanggil API", () => {
    render(<EkstraksiSumberAi {...props} />);
    fireEvent.change(screen.getByLabelText("Peran"), { target: { value: "guru sd" } });
    fireEvent.click(screen.getByRole("button", { name: "Ekstrak dengan AI" }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("periode '2026 27' tidak memanggil API", () => {
    render(<EkstraksiSumberAi {...props} periodeAwal="2026 27" />);
    fireEvent.change(screen.getByLabelText("Peran"), { target: { value: "guru" } });
    fireEvent.click(screen.getByRole("button", { name: "Ekstrak dengan AI" }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Periode harus kode tanpa spasi");
  });

  it("409: pesan backend, tanpa tautan dan tanpa notifikasi sukses", async () => {
    post.mockResolvedValue(GAGAL_409);
    render(<EkstraksiSumberAi {...props} />);
    fireEvent.change(screen.getByLabelText("Peran"), { target: { value: "guru" } });
    fireEvent.click(screen.getByRole("button", { name: "Ekstrak dengan AI" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sudah ada usulan berjalan.");
    expect(screen.queryByRole("link", { name: "Buka usulan" })).toBeNull();
    expect(notifySukses).not.toHaveBeenCalled();
  });
});

describe("TanyaBuktiAi (P04)", () => {
  const sumber = [
    { id: "s1", judul: "Notulen", versi: "v1", periode: "2026/27", izin_ai: true },
    { id: "s2", judul: "Laporan", versi: "v1", periode: "2026/27", izin_ai: false },
  ];
  const props = { accessToken: "t", kasusId: "k1", sumberOpsi: sumber };

  function isi(klaim: string, keputusan: string) {
    fireEvent.change(screen.getByLabelText("Klaim"), { target: { value: klaim } });
    fireEvent.change(screen.getByLabelText("Keputusan terkait"), { target: { value: keputusan } });
  }

  it("kirim sah: body tertrim dan tautan usulan", async () => {
    post.mockResolvedValue(OK);
    render(<TanyaBuktiAi {...props} />);
    isi("  klaim sah  ", "  keputusan sah ");
    fireEvent.click(screen.getByLabelText(/Notulen/));
    fireEvent.click(screen.getByRole("button", { name: "Tanya bukti dengan AI" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body).toEqual({
      klaim: "klaim sah",
      keputusan_terkait: "keputusan sah",
      sumber_ids: ["s1"],
    });
    expect(post.mock.calls[0][1].params.path.narasi_id).toBe("k1");
    expect(await screen.findByRole("link", { name: "Buka usulan" })).toHaveAttribute(
      "href",
      "/ai-usulan/u1",
    );
  });

  it("klaim 4 karakter tidak memanggil API", () => {
    render(<TanyaBuktiAi {...props} />);
    isi("abcd", "keputusan sah");
    fireEvent.click(screen.getByLabelText(/Notulen/));
    fireEvent.click(screen.getByRole("button", { name: "Tanya bukti dengan AI" }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("tanpa sumber tidak memanggil API", () => {
    render(<TanyaBuktiAi {...props} />);
    isi("klaim sah", "keputusan sah");
    fireEvent.click(screen.getByRole("button", { name: "Tanya bukti dengan AI" }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Pilih minimal satu sumber.");
  });

  it("422: pesan backend tampil", async () => {
    post.mockResolvedValue(GAGAL_422);
    render(<TanyaBuktiAi {...props} />);
    isi("klaim sah", "keputusan sah");
    fireEvent.click(screen.getByLabelText(/Notulen/));
    fireEvent.click(screen.getByRole("button", { name: "Tanya bukti dengan AI" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Isian tidak valid dari server.");
    expect(screen.queryByRole("link", { name: "Buka usulan" })).toBeNull();
  });
});

describe("KritikVersiAi (P09)", () => {
  const props = { accessToken: "t", narasiId: "n1", versiId: "v9", adaTeks: true };

  it("kirim: body hanya narasi_versi_id", async () => {
    post.mockResolvedValue(OK);
    render(<KritikVersiAi {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Minta kritik AI" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body).toEqual({ narasi_versi_id: "v9" });
    expect(post.mock.calls[0][1].params.path.narasi_id).toBe("n1");
    expect(await screen.findByRole("link", { name: "Buka usulan" })).toHaveAttribute(
      "href",
      "/ai-usulan/u1",
    );
  });

  it("409: pesan backend", async () => {
    post.mockResolvedValue(GAGAL_409);
    render(<KritikVersiAi {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Minta kritik AI" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sudah ada usulan berjalan.");
  });

  it("teks null: tombol tidak dirender", () => {
    render(<KritikVersiAi {...props} adaTeks={false} />);
    expect(screen.queryByRole("button", { name: "Minta kritik AI" })).toBeNull();
  });
});
