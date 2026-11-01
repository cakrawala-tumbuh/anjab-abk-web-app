import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get, POST: post, PATCH: patch }),
}));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh }) }));
vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifyGagal: vi.fn(),
  notifySukses: vi.fn(),
}));

import { FormLuring } from "@/app/(auth)/redesain/masalah/[id]/form-luring";
import { DialogPutuskan } from "@/app/(auth)/redesain/masalah/[id]/dialog-putuskan";
import { SesiForm } from "@/app/(auth)/redesain/sesi/sesi-form";
import { PilihKodeOrang } from "@/components/pilih-kode-orang";
import { PESAN_KODE_ORANG_WAJIB } from "@/lib/redesain-kode-orang";
import type { MasalahRead, PenilaianRead } from "@/lib/api/schema";

const resp = (data: unknown) => ({
  data,
  error: undefined,
  response: { status: 200, headers: { get: () => "req-1" } },
});
const kodeHalaman = resp({
  items: [{ id: "a", kode: "O-0001", keterangan_peran: "Wakasek", partisipan_id: null }],
  total: 1,
  limit: 500,
  offset: 0,
});

beforeEach(() => {
  [get, post, patch, refresh].forEach((m) => m.mockReset());
  get.mockResolvedValue(kodeHalaman);
  post.mockResolvedValue(resp({ id: "x" }));
  patch.mockResolvedValue(resp({ id: "x" }));
});

function kodeSelect(): HTMLSelectElement {
  return document.querySelector(
    "select[name='kode_orang'], select[name='pemutus_kode_orang']",
  ) as HTMLSelectElement;
}
async function siapSelect(): Promise<HTMLSelectElement> {
  await screen.findAllByRole("option", { name: "O-0001 — Wakasek" });
  return kodeSelect();
}
function pesanTerhubung(sel: HTMLSelectElement) {
  expect(sel).toHaveAttribute("aria-invalid", "true");
  const id = sel.getAttribute("aria-describedby");
  expect(id).toBeTruthy();
  const el = document.getElementById(id as string);
  expect(el).toHaveTextContent(PESAN_KODE_ORANG_WAJIB);
}

describe("PilihKodeOrang wajib: tanpa validasi bawaan browser", () => {
  it("tidak memasang atribut required (struktural) tetapi aria-required", async () => {
    render(<PilihKodeOrang name="kode_orang" value="" onChange={() => {}} wajib accessToken="t" />);
    const sel = await siapSelect();
    expect(sel.required).toBe(false);
    expect(sel.hasAttribute("required")).toBe(false);
    expect(sel).toHaveAttribute("aria-required", "true");
    expect(sel).not.toHaveAttribute("aria-invalid");
  });

  it("invalid + describedBy → aria-invalid dan aria-describedby terpasang", async () => {
    render(
      <PilihKodeOrang
        name="kode_orang"
        value=""
        onChange={() => {}}
        wajib
        invalid
        describedBy="p1"
        accessToken="t"
      />,
    );
    const sel = await siapSelect();
    expect(sel).toHaveAttribute("aria-invalid", "true");
    expect(sel).toHaveAttribute("aria-describedby", "p1");
  });
});

describe("FormLuring: kode orang wajib", () => {
  const masalah = { id: "m1", sekolah_id: null } as unknown as MasalahRead;
  async function buka() {
    render(<FormLuring masalah={masalah} sekolah={[]} accessToken="t" />);
    fireEvent.click(screen.getByRole("button", { name: "Catat isian luring" }));
    return siapSelect();
  }
  it("negatif: Simpan tanpa kode → pesan aplikasi + aria, tanpa POST", async () => {
    const sel = await buka();
    fireEvent.click(screen.getByRole("button", { name: "Simpan isian luring" }));
    expect(await screen.findByText(PESAN_KODE_ORANG_WAJIB)).toBeInTheDocument();
    pesanTerhubung(sel);
    expect(sel.required).toBe(false);
    expect(post).not.toHaveBeenCalled();
  });
  it("positif: pilih kode → galat hilang dan POST terkirim dengan kode_orang", async () => {
    const sel = await buka();
    fireEvent.click(screen.getByRole("button", { name: "Simpan isian luring" }));
    await screen.findByText(PESAN_KODE_ORANG_WAJIB);
    fireEvent.change(sel, { target: { value: "O-0001" } });
    expect(screen.queryByText(PESAN_KODE_ORANG_WAJIB)).toBeNull();
    expect(sel).not.toHaveAttribute("aria-invalid");
    fireEvent.click(screen.getByRole("button", { name: "Simpan isian luring" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body.kode_orang).toBe("O-0001");
  });
});

describe("SesiForm: kode orang wajib", () => {
  async function buka() {
    render(<SesiForm sekolah={[]} masalah={[]} konteks={[]} accessToken="t" />);
    const sel = await siapSelect();
    const kodeSesi = document.querySelector("input[required]") as HTMLInputElement;
    fireEvent.change(kodeSesi, { target: { value: "S-1" } });
    return sel;
  }
  const simpan = () => document.querySelector("form") as HTMLFormElement;
  it("negatif: submit tanpa kode → pesan aplikasi + aria, tanpa POST/PATCH", async () => {
    const sel = await buka();
    fireEvent.submit(simpan());
    expect(await screen.findByText(PESAN_KODE_ORANG_WAJIB)).toBeInTheDocument();
    pesanTerhubung(sel);
    expect(sel.required).toBe(false);
    expect(post).not.toHaveBeenCalled();
    expect(patch).not.toHaveBeenCalled();
  });
  it("positif: pilih kode → galat hilang dan POST terkirim", async () => {
    const sel = await buka();
    fireEvent.submit(simpan());
    await screen.findByText(PESAN_KODE_ORANG_WAJIB);
    fireEvent.change(sel, { target: { value: "O-0001" } });
    expect(screen.queryByText(PESAN_KODE_ORANG_WAJIB)).toBeNull();
    fireEvent.submit(simpan());
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body.kode_orang).toBe("O-0001");
  });
});

describe("DialogPutuskan: kode pemutus wajib", () => {
  const penilaian = {
    id: "n1",
    masalah_id: "m1",
    status_bukti: "Belum cukup",
    saran_otomatis: "K - Klarifikasi",
    peringatan: [],
  } as unknown as PenilaianRead;
  async function buka() {
    render(<DialogPutuskan penilaian={penilaian} accessToken="t" />);
    fireEvent.click(screen.getByRole("button", { name: "Catat keputusan prioritas" }));
    const sel = await siapSelect();
    fireEvent.change(screen.getByLabelText("Prioritas final"), {
      target: { value: "P2 - Berikutnya" },
    });
    fireEvent.change(screen.getByLabelText("Alasan keputusan"), { target: { value: "Karena X" } });
    fireEvent.change(screen.getByLabelText("Jabatan pemutus"), { target: { value: "Ketua" } });
    return sel;
  }
  it("negatif: kode kosong → pesan aplikasi + aria, Simpan tidak mengirim", async () => {
    const sel = await buka();
    expect(await screen.findByText(PESAN_KODE_ORANG_WAJIB)).toBeInTheDocument();
    pesanTerhubung(sel);
    expect(sel.required).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Simpan keputusan" }));
    expect(post).not.toHaveBeenCalled();
  });
  it("positif: pilih kode → galat hilang dan POST terkirim dengan pemutus_kode_orang", async () => {
    const sel = await buka();
    fireEvent.change(sel, { target: { value: "O-0001" } });
    expect(screen.queryByText(PESAN_KODE_ORANG_WAJIB)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Simpan keputusan" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body.pemutus_kode_orang).toBe("O-0001");
  });
});
