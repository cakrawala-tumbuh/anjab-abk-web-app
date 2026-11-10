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

import { NormalisasiJabatanAi } from "@/app/(auth)/master-data/task-inventory/[unit]/[kategori]/normalisasi-jabatan-ai";
import { TagPeranJabatanAi } from "@/app/(auth)/master-data/task-inventory/[unit]/[kategori]/tag-peran-jabatan-ai";
import { hrefSasaran, labelFungsi, labelSasaran } from "@/lib/ai-usulan";
import { validasiPeriodeAi } from "@/lib/ai-usulan-konteks";
import { usulanP02Diterima } from "@/lib/ai-usulan-ti";
import type { AiUsulanRingkas } from "@/lib/api/schema";
import { notifySukses } from "@/lib/notify";

function usulan(id: string, putusan: string | null): AiUsulanRingkas {
  return {
    id,
    fungsi: "P02",
    sasaran_jenis: "JABATAN",
    sasaran_id: "jab-1",
    job_id: "j",
    created_at: "2026-11-10T00:00:00Z",
    putusan_terakhir: putusan
      ? ({
          id: "p",
          putusan,
          created_at: "2026-11-10T00:00:00Z",
        } as AiUsulanRingkas["putusan_terakhir"])
      : null,
  } as AiUsulanRingkas;
}

beforeEach(() => {
  post.mockReset();
  vi.mocked(notifySukses).mockReset();
});

describe("validasiPeriodeAi", () => {
  it("2026/27 sah", () => expect(validasiPeriodeAi("2026/27")).toBeNull());
  it.each(["", "2026 27", "x".repeat(101)])("menolak %j", (v) => {
    expect(validasiPeriodeAi(v)).toBe("Periode harus kode tanpa spasi, mis. 2026/27.");
  });
});

describe("usulanP02Diterima", () => {
  it("hanya APPROVE dan REVISE yang lolos", () => {
    const hasil = usulanP02Diterima([
      usulan("a", "APPROVE"),
      usulan("b", "REVISE"),
      usulan("c", "REJECT"),
      usulan("d", null),
    ]);
    expect(hasil.map((u) => u.id)).toEqual(["a", "b"]);
  });
});

describe("label P02/P03/JABATAN", () => {
  it("label dan tautan", () => {
    expect(labelFungsi("P02")).toBe("P02 — Normalisasi tugas");
    expect(labelFungsi("P03")).toBe("P03 — Tag peran");
    expect(labelSasaran("JABATAN")).toBe("Jabatan");
    expect(hrefSasaran("JABATAN", "x")).toBeNull();
  });
});

describe("NormalisasiJabatanAi (P02)", () => {
  const props = { accessToken: "t", jabatanId: "jab-1", unit: "SD" };

  it("kirim sah: body benar dan tautan usulan", async () => {
    post.mockResolvedValue({ data: { id: "u-1" }, response: new Response() });
    render(<NormalisasiJabatanAi {...props} />);
    fireEvent.change(screen.getByLabelText("Periode"), { target: { value: "2026/27" } });
    fireEvent.click(screen.getByRole("button", { name: "Normalisasi dengan AI" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body).toEqual({
      unit: "SD",
      periode: "2026/27",
      sumber_dokumen_ids: [],
    });
    expect(post.mock.calls[0][1].params.path.jabatan_id).toBe("jab-1");
    const tautan = await screen.findByRole("link", { name: "Buka usulan" });
    expect(tautan).toHaveAttribute("href", "/ai-usulan/u-1");
  });

  it("melepas 'Hanya unit ini' mengirim unit null", async () => {
    post.mockResolvedValue({ data: { id: "u-1" }, response: new Response() });
    render(<NormalisasiJabatanAi {...props} />);
    fireEvent.change(screen.getByLabelText("Periode"), { target: { value: "2026/27" } });
    fireEvent.click(screen.getByLabelText(/Hanya unit ini/));
    fireEvent.click(screen.getByRole("button", { name: "Normalisasi dengan AI" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body.unit).toBeNull();
  });

  it("periode ber-spasi tidak memanggil API", () => {
    render(<NormalisasiJabatanAi {...props} />);
    fireEvent.change(screen.getByLabelText("Periode"), { target: { value: "2026 27" } });
    fireEvent.click(screen.getByRole("button", { name: "Normalisasi dengan AI" }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Periode harus kode tanpa spasi");
  });
});

describe("TagPeranJabatanAi (P03)", () => {
  it("daftar kosong: tombol nonaktif", () => {
    render(<TagPeranJabatanAi accessToken="t" jabatanId="jab-1" usulanP02={[]} />);
    expect(screen.getByText("Belum ada usulan P02 yang diterima untuk jabatan ini.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Beri tag peran dengan AI" })).toBeDisabled();
  });

  it("409 fungsi_belum_aktif: pesan backend, tanpa notifikasi sukses", async () => {
    post.mockResolvedValue({
      data: undefined,
      error: { error: "fungsi_belum_aktif", message: "Fungsi P03 belum aktif." },
      response: new Response(null, { status: 409 }),
    });
    render(
      <TagPeranJabatanAi accessToken="t" jabatanId="jab-1" usulanP02={[usulan("a", "APPROVE")]} />,
    );
    fireEvent.change(screen.getByLabelText("Periode"), { target: { value: "2026/27" } });
    fireEvent.click(screen.getByRole("button", { name: "Beri tag peran dengan AI" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/P03 belum aktif|fungsi_belum_aktif/);
    expect(post.mock.calls[0][1].body).toEqual({ usulan_p02_id: "a", periode: "2026/27" });
    expect(notifySukses).not.toHaveBeenCalled();
  });
});
