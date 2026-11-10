import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
vi.mock("@/lib/api/client", () => ({ withServerAuth: () => ({ POST: post }) }));

import { TerapkanKandidat } from "@/app/(auth)/ai-usulan/[id]/terapkan-kandidat";
import { UsulkanKontekAi } from "@/app/(auth)/redesain/konteks/usulkan-konteks-ai";
import {
  bodyPengajuan,
  bodyTerapkan,
  isianAwalTerapkan,
  kandidatDariIsi,
  panelTerapkanTampil,
  petaKandidatTerapan,
  validasiPengajuan,
  validasiTerapkan,
  type IsianTerapkan,
} from "@/lib/ai-usulan-konteks";
import { hrefSasaran, labelFungsi, labelSasaran } from "@/lib/ai-usulan";
import { notifySukses } from "@/lib/notify";

vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifySukses: vi.fn(),
  notifyGagal: vi.fn(),
}));

const lengkap: IsianTerapkan = {
  kode: "K-15",
  gelombang: "G2",
  tema: "Tema",
  ruang_dugaan: "Ruang",
  sumber_draft: "Sumber",
  batas_pemeriksaan: "Batas",
};

const ISI = {
  konteks_candidates: [
    {
      tema: "Beban administrasi guru",
      ruang_dugaan: "Ruang A",
      sumber_draft: "Sumber A",
      batas_pemeriksaan: "Batas A",
      gelombang_saran: "G1",
      mirip_kode: ["K-03"],
      source_ids: [],
    },
    { tema: "Kandidat dua", gelombang_saran: "G9" },
  ],
};

beforeEach(() => {
  post.mockReset();
  refresh.mockReset();
});

describe("validasi dan body Terapkan", () => {
  it("menerima K-15 + isian lengkap; body memuat keempat isian dan indeks benar", () => {
    expect(validasiTerapkan(lengkap)).toEqual({});
    expect(bodyTerapkan(2, lengkap)).toEqual({
      indeks_kandidat: 2,
      kode: "K-15",
      gelombang: "G2",
      tema: "Tema",
      ruang_dugaan: "Ruang",
      sumber_draft: "Sumber",
      batas_pemeriksaan: "Batas",
    });
  });

  it("menolak kode K15/kosong dan isian kosong dengan pesan", () => {
    expect(validasiTerapkan({ ...lengkap, kode: "K15" }).kode).toMatch(/K-NN/);
    expect(validasiTerapkan({ ...lengkap, kode: "" }).kode).toMatch(/K-NN/);
    const g = validasiTerapkan({
      ...lengkap,
      tema: " ",
      ruang_dugaan: "",
      sumber_draft: "",
      batas_pemeriksaan: "",
    });
    expect(Object.keys(g).sort()).toEqual(
      ["batas_pemeriksaan", "ruang_dugaan", "sumber_draft", "tema"].sort(),
    );
    expect(validasiTerapkan({ ...lengkap, tema: "x".repeat(201) }).tema).toMatch(/200/);
  });
});

describe("panelTerapkanTampil", () => {
  it("hanya P11 berisi dengan putusan APPROVE/REVISE", () => {
    expect(panelTerapkanTampil("P11", ISI, "APPROVE")).toBe(true);
    expect(panelTerapkanTampil("P11", ISI, "REVISE")).toBe(true);
    expect(panelTerapkanTampil("P11", ISI, null)).toBe(false);
    expect(panelTerapkanTampil("P11", ISI, undefined)).toBe(false);
    expect(panelTerapkanTampil("P11", ISI, "REJECT")).toBe(false);
    expect(panelTerapkanTampil("P09", ISI, "APPROVE")).toBe(false);
    expect(panelTerapkanTampil("P11", null, "APPROVE")).toBe(false);
  });
});

describe("kandidat dan penanda", () => {
  it("membaca kandidat defensif dan menormalkan gelombang tak sah", () => {
    const k = kandidatDariIsi(ISI);
    expect(k).toHaveLength(2);
    expect(k[0]).toMatchObject({ indeks: 0, gelombang_saran: "G1", mirip_kode: ["K-03"] });
    expect(k[1]).toMatchObject({
      indeks: 1,
      gelombang_saran: "Belum dijadwalkan",
      ruang_dugaan: "",
    });
    expect(kandidatDariIsi(null)).toEqual([]);
    expect(kandidatDariIsi({ konteks_candidates: "x" })).toEqual([]);
    expect(isianAwalTerapkan(k[0])).toMatchObject({ kode: "", gelombang: "G1", tema: k[0].tema });
  });

  it("memetakan konteks ber-ai_kandidat_indeks menjadi penanda, bukan form", () => {
    const terapan = petaKandidatTerapan([
      { kode: "K-20", ai_kandidat_indeks: 0 },
      { kode: "K-01", ai_kandidat_indeks: null },
    ]);
    expect([...terapan.entries()]).toEqual([[0, "K-20"]]);
    render(
      <TerapkanKandidat
        usulanId="u1"
        kandidat={kandidatDariIsi(ISI)}
        terapan={terapan}
        accessToken="t"
      />,
    );
    expect(screen.getByText("Sudah diterapkan sebagai K-20")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Terapkan kandidat" })).toHaveLength(1);
  });
});

describe("label P11 dan REDESAIN_KONTEKS", () => {
  it("label dan tautan", () => {
    expect(labelFungsi("P11")).toBe("P11 — Pengusul Konteks");
    expect(labelSasaran("REDESAIN_KONTEKS")).toBe("Katalog konteks redesain");
    expect(hrefSasaran("REDESAIN_KONTEKS", "KATALOG")).toBe("/redesain/konteks");
  });
});

describe("pengajuan P11", () => {
  it("menolak jumlah di luar 1-5 dan menerima batas", () => {
    for (const j of ["0", "6", "", "2.5", "abc"]) {
      expect(validasiPengajuan({ sertakan_masalah: true, jumlah_kandidat: j })).toMatch(/1-5/);
    }
    for (const j of ["1", "3", "5"]) {
      expect(validasiPengajuan({ sertakan_masalah: true, jumlah_kandidat: j })).toBeNull();
    }
    expect(bodyPengajuan({ sertakan_masalah: false, jumlah_kandidat: "4" })).toEqual({
      sertakan_masalah: false,
      jumlah_kandidat: 4,
      sumber_dokumen_ids: [],
    });
  });

  it("202 menampilkan tautan usulan; 409 menampilkan pesan tanpa notifikasi sukses", async () => {
    post.mockResolvedValueOnce({
      data: { id: "u9" },
      response: new Response(null, { status: 202 }),
    });
    render(<UsulkanKontekAi accessToken="t" />);
    fireEvent.click(screen.getByRole("button", { name: "Usulkan dengan AI" }));
    await waitFor(() => expect(screen.getByRole("link", { name: "Buka usulan" })).toBeTruthy());
    expect(screen.getByRole("link", { name: "Buka usulan" }).getAttribute("href")).toBe(
      "/ai-usulan/u9",
    );
    expect(notifySukses).toHaveBeenCalledTimes(1);

    vi.mocked(notifySukses).mockClear();
    post.mockResolvedValueOnce({
      error: { error: "fungsi_belum_aktif", message: "Fungsi AI belum aktif." },
      response: new Response(null, { status: 409 }),
    });
    fireEvent.click(screen.getByRole("button", { name: "Usulkan dengan AI" }));
    await waitFor(() => expect(screen.getByText("Fungsi AI belum aktif.")).toBeTruthy());
    expect(notifySukses).not.toHaveBeenCalled();
  });
});

describe("FormKandidat", () => {
  it("kode salah tidak memanggil API; sukses 201 memberi notifikasi dan refresh", async () => {
    render(
      <TerapkanKandidat
        usulanId="u1"
        kandidat={kandidatDariIsi(ISI).slice(0, 1)}
        terapan={new Map()}
        accessToken="t"
      />,
    );
    const tombol = screen.getByRole("button", { name: "Terapkan kandidat" });
    fireEvent.change(screen.getByLabelText(/Kode/), { target: { value: "K15" } });
    fireEvent.click(tombol);
    expect(post).not.toHaveBeenCalled();
    expect(await screen.findByText(/berpola K-NN/)).toBeTruthy();

    post.mockResolvedValueOnce({
      data: { kode: "K-15" },
      response: new Response(null, { status: 201 }),
    });
    fireEvent.change(screen.getByLabelText(/Kode/), { target: { value: "K-15" } });
    fireEvent.click(tombol);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body).toMatchObject({
      indeks_kandidat: 0,
      kode: "K-15",
      gelombang: "G1",
    });
    expect(notifySukses).toHaveBeenCalledWith("Konteks K-15 dibuat");
  });
});
