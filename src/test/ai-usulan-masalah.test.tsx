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

import { HipotesisProsesAi } from "@/app/(auth)/redesain/masalah/[id]/hipotesis-proses-ai";
import { KartuKeputusanAi } from "@/app/(auth)/redesain/masalah/[id]/kartu-keputusan-ai";
import { OpsiAi } from "@/app/(auth)/redesain/masalah/[id]/opsi-ai";
import { BAGIAN_DETAIL_MASALAH, pilihBagian } from "@/app/(auth)/redesain/masalah/[id]/registry";
import { hrefSasaran, labelFungsi, labelSasaran } from "@/lib/ai-usulan";
import { kodeSyaratF4, usulanP06Diterima } from "@/lib/ai-usulan-masalah";
import type { AiUsulanRingkas } from "@/lib/api/schema";
import { notifySukses } from "@/lib/notify";

function usulan(id: string, putusan: string | null): AiUsulanRingkas {
  return {
    id,
    fungsi: "P06",
    sasaran_jenis: "REDESAIN_MASALAH",
    sasaran_id: "m1",
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

const props = { accessToken: "t", masalahId: "m1", periodeAcuan: "2026/27" };
const galat409 = (error: string, message: string, details?: unknown[]) => ({
  data: undefined,
  error: { error, message, details },
  response: new Response(null, { status: 409 }),
});

beforeEach(() => {
  post.mockReset();
  vi.mocked(notifySukses).mockReset();
});

describe("kodeSyaratF4", () => {
  it("dua detail ber-code -> dua butir berlabel", () => {
    expect(
      kodeSyaratF4([{ code: "KLAIM_BELUM_TERVALIDASI" }, { code: "ALTERNATIF_BELUM_ADA" }]),
    ).toEqual([
      { kode: "KLAIM_BELUM_TERVALIDASI", label: "Klaim belum tervalidasi" },
      { kode: "ALTERNATIF_BELUM_ADA", label: "Belum ada alternatif redesain" },
    ]);
  });
  it("kode asing tampil mentah", () => {
    expect(kodeSyaratF4([{ code: "X_BARU" }])).toEqual([{ kode: "X_BARU", label: "X_BARU" }]);
  });
  it("bentuk tak dikenal -> []", () => {
    expect(kodeSyaratF4(undefined)).toEqual([]);
    expect(kodeSyaratF4({ code: "A" })).toEqual([]);
    expect(kodeSyaratF4([{ loc: ["alasan"] }, null, "x"])).toEqual([]);
  });
});

describe("usulanP06Diterima", () => {
  it("hanya APPROVE dan REVISE", () => {
    const h = usulanP06Diterima([
      usulan("a", "APPROVE"),
      usulan("b", "REVISE"),
      usulan("c", "REJECT"),
      usulan("d", null),
    ]);
    expect(h.map((u) => u.id)).toEqual(["a", "b"]);
  });
});

describe("label dan registry", () => {
  it("label P05/P06/P07 dan tautan masalah", () => {
    expect(labelFungsi("P05")).toBe("P05 — Hipotesis proses");
    expect(labelFungsi("P06")).toBe("P06 — Opsi redesain");
    expect(labelFungsi("P07")).toBe("P07 — Kartu keputusan");
    expect(labelSasaran("REDESAIN_MASALAH")).toBe("Masalah redesain");
    expect(hrefSasaran("REDESAIN_MASALAH", "m1")).toBe("/redesain/masalah/m1");
  });
  it("kunci ai terakhir; bawaan tetap alur", () => {
    const kunci = BAGIAN_DETAIL_MASALAH.map((b) => b.kunci);
    expect(kunci[kunci.length - 1]).toBe("ai");
    expect(BAGIAN_DETAIL_MASALAH[kunci.length - 1].label).toBe("AI");
    expect(pilihBagian(undefined).kunci).toBe("alur");
    expect(pilihBagian("ai").kunci).toBe("ai");
  });
});

describe("HipotesisProsesAi (P05)", () => {
  it("prefill periode; kirim sah -> body dan tautan", async () => {
    post.mockResolvedValue({ data: { id: "u-5" }, response: new Response() });
    render(<HipotesisProsesAi {...props} />);
    expect(screen.getByLabelText("Periode")).toHaveValue("2026/27");
    fireEvent.click(screen.getByRole("button", { name: "Minta hipotesis proses" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body).toEqual({ periode: "2026/27" });
    expect(post.mock.calls[0][1].params.path.masalah_id).toBe("m1");
    expect(await screen.findByRole("link", { name: "Buka usulan" })).toHaveAttribute(
      "href",
      "/ai-usulan/u-5",
    );
    expect(notifySukses).toHaveBeenCalled();
  });
  it("periode ber-spasi: API tidak dipanggil", () => {
    render(<HipotesisProsesAi {...props} />);
    fireEvent.change(screen.getByLabelText("Periode"), { target: { value: "TA 2026/27" } });
    fireEvent.click(screen.getByRole("button", { name: "Minta hipotesis proses" }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Periode harus kode tanpa spasi");
  });
  it("409 fungsi_belum_aktif: pesan backend tanpa notifikasi sukses", async () => {
    post.mockResolvedValue(galat409("fungsi_belum_aktif", "Fungsi P05 belum aktif."));
    render(<HipotesisProsesAi {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Minta hipotesis proses" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Fungsi P05 belum aktif.");
    expect(notifySukses).not.toHaveBeenCalled();
  });
});

describe("OpsiAi (P06)", () => {
  it("409 SYARAT_F4_BELUM_TERPENUHI: kedua label tampil di alert", async () => {
    post.mockResolvedValue(
      galat409("SYARAT_F4_BELUM_TERPENUHI", "Syarat F4 belum terpenuhi.", [
        { loc: ["alasan"], code: "KLAIM_BELUM_TERVALIDASI" },
        { loc: ["alasan"], code: "BUKTI_DIPERSELISIHKAN" },
      ]),
    );
    render(<OpsiAi {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Minta opsi redesain" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Syarat F4 belum terpenuhi.");
    expect(alert).toHaveTextContent("Klaim belum tervalidasi");
    expect(alert).toHaveTextContent("Ada bukti yang diperselisihkan");
    expect(post.mock.calls[0][1].body).toEqual({ periode: "2026/27" });
    expect(notifySukses).not.toHaveBeenCalled();
  });
});

describe("KartuKeputusanAi (P07)", () => {
  const p06 = [usulan("aaaaaaaa-1", "APPROVE")];

  it("pilih usulan -> usulan_p06_id terkirim", async () => {
    post.mockResolvedValue({ data: { id: "u-7" }, response: new Response() });
    render(<KartuKeputusanAi {...props} usulanP06={p06} />);
    fireEvent.change(screen.getByLabelText("Usulan P06"), { target: { value: "aaaaaaaa-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Minta kartu keputusan" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body).toEqual({ periode: "2026/27", usulan_p06_id: "aaaaaaaa-1" });
  });

  it("pilihan bawaan -> usulan_p06_id null", async () => {
    post.mockResolvedValue({ data: { id: "u-7" }, response: new Response() });
    render(<KartuKeputusanAi {...props} usulanP06={p06} />);
    expect(screen.getByRole("option", { name: "Tanpa usulan P06" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Minta kartu keputusan" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body).toEqual({ periode: "2026/27", usulan_p06_id: null });
  });

  it("422 USULAN_BUKAN_P06: pesan backend tampil", async () => {
    post.mockResolvedValue({
      data: undefined,
      error: { error: "USULAN_BUKAN_P06", message: "Usulan itu bukan P06." },
      response: new Response(null, { status: 422 }),
    });
    render(<KartuKeputusanAi {...props} usulanP06={p06} />);
    fireEvent.click(screen.getByRole("button", { name: "Minta kartu keputusan" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Usulan itu bukan P06.");
  });
});
