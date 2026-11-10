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

import { SintesisRisetAi } from "@/app/(auth)/riset/protokol/[id]/sintesis-riset-ai";
import { hrefSasaran, labelFungsi, labelSasaran } from "@/lib/ai-usulan";
import { notifySukses } from "@/lib/notify";

const galat409 = (error: string, message: string) => ({
  data: undefined,
  error: { error, message },
  response: new Response(null, { status: 409 }),
});

function render_(n = 1) {
  render(<SintesisRisetAi accessToken="t" protokolId="p1" jumlahTerverifikasi={n} />);
  fireEvent.click(screen.getByText("Sintesis bukti dengan AI (P08)"));
}

beforeEach(() => {
  post.mockReset();
  vi.mocked(notifySukses).mockReset();
});

describe("SintesisRisetAi (P08)", () => {
  it("kirim sah -> body {periode} dan tautan usulan", async () => {
    post.mockResolvedValue({ data: { id: "u9" }, response: new Response(null, { status: 202 }) });
    render_();
    fireEvent.change(screen.getByPlaceholderText("2026/27"), { target: { value: "2026/27" } });
    fireEvent.click(screen.getByRole("button", { name: "Minta sintesis bukti" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][0]).toBe("/api/v1/riset/protokol/{protokol_id}/sintesis-ai");
    expect(post.mock.calls[0][1].body).toEqual({ periode: "2026/27" });
    expect(post.mock.calls[0][1].params.path.protokol_id).toBe("p1");
    const tautan = await screen.findByRole("link", { name: "Buka usulan" });
    expect(tautan.getAttribute("href")).toBe("/ai-usulan/u9");
    expect(notifySukses).toHaveBeenCalledTimes(1);
  });

  it("periode ber-spasi -> API tidak dipanggil", async () => {
    render_();
    fireEvent.change(screen.getByPlaceholderText("2026/27"), { target: { value: "2026 27" } });
    fireEvent.click(screen.getByRole("button", { name: "Minta sintesis bukti" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
  });

  it("tanpa statistik terverifikasi -> tombol disabled + teks penjelas", () => {
    render_(0);
    expect(
      (screen.getByRole("button", { name: "Minta sintesis bukti" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(screen.getByText("Butuh minimal satu statistik terverifikasi.")).toBeTruthy();
  });

  it.each([
    ["fungsi_belum_aktif", "Fungsi AI belum diaktifkan."],
    ["STATISTIK_TERVERIFIKASI_KOSONG", "Belum ada statistik terverifikasi."],
  ])("409 %s -> pesan backend di alert, tanpa notifySukses", async (kode, pesan) => {
    post.mockResolvedValue(galat409(kode, pesan));
    render_();
    fireEvent.change(screen.getByPlaceholderText("2026/27"), { target: { value: "2026/27" } });
    fireEvent.click(screen.getByRole("button", { name: "Minta sintesis bukti" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(pesan);
    expect(notifySukses).not.toHaveBeenCalled();
  });
});

describe("label P08 / PROTOKOL_RISET", () => {
  it("label dan href", () => {
    expect(labelFungsi("P08")).toBe("P08 — Sintesis bukti riset");
    expect(labelSasaran("PROTOKOL_RISET")).toBe("Protokol riset");
    expect(hrefSasaran("PROTOKOL_RISET", "p1")).toBe("/riset/protokol/p1");
  });
});
