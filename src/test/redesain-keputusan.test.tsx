import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const get = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get, POST: post }),
}));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));
const notifyGagal = vi.fn();
const notifySukses = vi.fn();
vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifyGagal: (e: unknown) => notifyGagal(e),
  notifySukses: (m: string) => notifySukses(m),
}));
vi.mock("@/components/pilih-kode-orang", () => ({
  PilihKodeOrang: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select
      aria-label="Kode orang pemutus"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">—</option>
      <option value="O-0001">O-0001</option>
    </select>
  ),
}));
vi.mock("@/lib/auth/auth", () => ({ auth: async () => ({ accessToken: "tok" }) }));

import AgendaYayasanPage from "@/app/(auth)/redesain/agenda-yayasan/page";
import { fetchAgendaYayasan } from "@/app/(auth)/redesain/agenda-yayasan/data";
import { fetchSebaranK } from "@/app/(auth)/redesain/masalah/[id]/data-penilaian";
import { PanelKeputusan } from "@/app/(auth)/redesain/masalah/[id]/panel-keputusan";
import { PilihStatus } from "@/app/(auth)/redesain/masalah/[id]/pilih-status";
import { TabelSebaran } from "@/app/(auth)/redesain/masalah/[id]/tabel-sebaran";
import { ApiError } from "@/lib/api/errors";
import type { PenilaianRead, SebaranK } from "@/lib/api/schema";
import { hariIniWib, labelPemutus, validasiKeputusan } from "@/lib/redesain-keputusan";

const resp = (data: unknown, status = 200) => ({
  data: status < 400 ? data : undefined,
  error: status < 400 ? undefined : { error: { code: "X", message: "ditolak" } },
  response: { status, headers: { get: () => "req-1" } },
});
const penilaian = (p: Partial<PenilaianRead> = {}): PenilaianRead =>
  ({
    id: "n1",
    masalah_id: "m1",
    status_bukti: "Belum cukup",
    gap_material: "Belum tahu",
    indikasi_kritis: "Belum tahu",
    saran_otomatis: "K - Klarifikasi",
    versi_aturan_triase: "v1.3",
    status_penilaian: "Belum ditelaah",
    peringatan: [],
    ...p,
  }) as PenilaianRead;

function bukaDialog(p: PenilaianRead = penilaian()) {
  render(<PanelKeputusan penilaian={p} accessToken="tok" />);
  fireEvent.click(screen.getByRole("button", { name: "Catat keputusan prioritas" }));
}
function isiLengkap(prioritas = "P2 - Berikutnya") {
  fireEvent.change(screen.getByLabelText("Prioritas final"), { target: { value: prioritas } });
  fireEvent.change(screen.getByLabelText("Alasan keputusan"), { target: { value: "Karena X" } });
  fireEvent.change(screen.getByLabelText("Kode orang pemutus"), { target: { value: "O-0001" } });
  fireEvent.change(screen.getByLabelText("Jabatan pemutus"), { target: { value: "Ketua" } });
}

beforeEach(() => vi.clearAllMocks());

describe("dialog putuskan", () => {
  it("alasan kosong → tombol simpan nonaktif dan putuskan tidak dipanggil", () => {
    bukaDialog();
    fireEvent.change(screen.getByLabelText("Prioritas final"), {
      target: { value: "P2 - Berikutnya" },
    });
    fireEvent.change(screen.getByLabelText("Kode orang pemutus"), { target: { value: "O-0001" } });
    fireEvent.change(screen.getByLabelText("Jabatan pemutus"), { target: { value: "Ketua" } });
    const tombol = screen.getByRole("button", { name: "Simpan keputusan" });
    expect(tombol).toBeDisabled();
    fireEvent.click(tombol);
    expect(post).not.toHaveBeenCalled();
  });

  it("kode pemutus kosong (field lain valid) → simpan nonaktif; setelah dipilih → aktif", () => {
    bukaDialog();
    fireEvent.change(screen.getByLabelText("Prioritas final"), {
      target: { value: "P2 - Berikutnya" },
    });
    fireEvent.change(screen.getByLabelText("Alasan keputusan"), { target: { value: "Karena X" } });
    fireEvent.change(screen.getByLabelText("Jabatan pemutus"), { target: { value: "Ketua" } });
    const tombol = screen.getByRole("button", { name: "Simpan keputusan" });
    expect(tombol).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Kode orang pemutus"), { target: { value: "O-0001" } });
    expect(tombol).toBeEnabled();
  });

  it("mengirim kelima field dengan kode orang terpilih", async () => {
    post.mockResolvedValue(resp(penilaian()));
    bukaDialog();
    isiLengkap();
    fireEvent.click(screen.getByRole("button", { name: "Simpan keputusan" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    const [path, opsi] = post.mock.calls[0];
    expect(path).toBe("/api/v1/redesain/penilaian/{penilaian_id}/putuskan");
    expect(opsi.params.path.penilaian_id).toBe("n1");
    expect(opsi.body).toEqual({
      prioritas_final: "P2 - Berikutnya",
      alasan_final: "Karena X",
      pemutus_kode_orang: "O-0001",
      pemutus_jabatan: "Ketua",
      tanggal_keputusan: hariIniWib(),
    });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(notifySukses).toHaveBeenCalled();
  });

  it("tanggal besok → validasi klien menolak, putuskan tidak dipanggil", () => {
    bukaDialog();
    isiLengkap();
    fireEvent.change(screen.getByLabelText("Tanggal keputusan"), {
      target: { value: "2999-01-01" },
    });
    expect(screen.getByRole("button", { name: "Simpan keputusan" })).toBeDisabled();
    expect(screen.getByText(/tidak boleh di masa depan/)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
    expect(
      validasiKeputusan(
        {
          prioritas_final: "P1 - Utama",
          alasan_final: "a",
          pemutus_kode_orang: "O-1",
          pemutus_jabatan: "j",
          tanggal_keputusan: "2026-11-02",
        },
        "2026-11-01",
      ).tanggal_keputusan,
    ).toBeDefined();
  });

  it("pratinjau peringatan untuk P2 pada Belum cukup", () => {
    bukaDialog(penilaian({ status_bukti: "Belum cukup" }));
    fireEvent.change(screen.getByLabelText("Prioritas final"), {
      target: { value: "P2 - Berikutnya" },
    });
    expect(screen.getByTestId("peringatan-pratinjau")).toBeInTheDocument();
  });

  it("pratinjau peringatan untuk P1 pada Hipotesis tetap bisa simpan", async () => {
    post.mockResolvedValue(resp(penilaian()));
    bukaDialog(penilaian({ status_bukti: "Hipotesis" }));
    isiLengkap("P1 - Utama");
    expect(screen.getByTestId("peringatan-pratinjau")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Simpan keputusan" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
  });

  it("tidak ada pratinjau untuk P1 pada Diperkuat untuk klaim", () => {
    bukaDialog(penilaian({ status_bukti: "Diperkuat untuk klaim" }));
    fireEvent.change(screen.getByLabelText("Prioritas final"), { target: { value: "P1 - Utama" } });
    expect(screen.queryByTestId("peringatan-pratinjau")).not.toBeInTheDocument();
  });

  it("putuskan 422 → toast gagal, tidak ada toast sukses", async () => {
    post.mockResolvedValue(resp(null, 422));
    bukaDialog();
    isiLengkap();
    fireEvent.click(screen.getByRole("button", { name: "Simpan keputusan" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect(notifySukses).not.toHaveBeenCalled();
  });
});

describe("panel keputusan", () => {
  it("peringatan[] dirender: badge Berbeda dari saran dan peringatan tanpa bukti", () => {
    render(
      <PanelKeputusan
        accessToken="tok"
        penilaian={penilaian({
          prioritas_final: "P1 - Utama",
          alasan_final: "alasan",
          pemutus_kode_orang: "O-0001",
          pemutus_jabatan: "Ketua",
          tanggal_keputusan: "2026-11-01",
          saran_saat_keputusan: "K - Klarifikasi",
          peringatan: [
            { kode: "BERBEDA_DARI_SARAN", pesan: "beda" },
            { kode: "PRIORITAS_TANPA_BUKTI", pesan: "bukti lemah" },
          ],
        })}
      />,
    );
    expect(screen.getByText("Berbeda dari saran")).toBeInTheDocument();
    expect(screen.getByText(/bukti lemah/)).toBeInTheDocument();
  });

  it("pemutus tampil kode + jabatan, tanpa nama", () => {
    expect(labelPemutus({ pemutus_kode_orang: "O-0001", pemutus_jabatan: "Ketua" })).toBe(
      "O-0001 — Ketua",
    );
    render(
      <PanelKeputusan
        accessToken="tok"
        penilaian={penilaian({
          prioritas_final: "P3 - Pantau",
          alasan_final: "a",
          pemutus_kode_orang: "O-0001",
          pemutus_jabatan: "Ketua",
          tanggal_keputusan: "2026-11-01",
        })}
      />,
    );
    expect(screen.getByText("O-0001 — Ketua")).toBeInTheDocument();
  });
});

describe("pilih status", () => {
  it("tidak memuat Telah diputuskan di pilihan", () => {
    render(<PilihStatus penilaianId="n1" statusSaatIni="Telah diputuskan" accessToken="tok" />);
    const opsi = within(screen.getByLabelText("Status penilaian"))
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(opsi).toEqual([
      "— ubah status —",
      "Belum ditelaah",
      "Perlu klarifikasi",
      "Siap untuk telaah yayasan",
      "Ditunda",
    ]);
  });

  it("memilih status → POST /status lalu refresh", async () => {
    post.mockResolvedValue(resp(penilaian()));
    render(<PilihStatus penilaianId="n1" statusSaatIni="Belum ditelaah" accessToken="tok" />);
    fireEvent.change(screen.getByLabelText("Status penilaian"), { target: { value: "Ditunda" } });
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][0]).toBe("/api/v1/redesain/penilaian/{penilaian_id}/status");
    expect(post.mock.calls[0][1].body).toEqual({ status_penilaian: "Ditunda" });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});

describe("sebaran K", () => {
  const sebaran = {
    masalah_id: "m1",
    jumlah_konfirmasi: 3,
    k1: { Tinggi: 2, Sedang: 1 },
    k2: { Rendah: 3 },
    k3: { "Belum tahu": 1, kosong: 2 },
    k4: {},
  } as SebaranK;

  it("merender hitungan tanpa kolom rata-rata", () => {
    render(<TabelSebaran sebaran={sebaran} />);
    expect(screen.getByText(/bukan rata-rata/)).toBeInTheDocument();
    const heads = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(heads).toEqual(["Dimensi", "Tinggi", "Sedang", "Rendah", "Belum tahu", "kosong"]);
    expect(heads.some((h) => /rata/i.test(h ?? ""))).toBe(false);
    const k1 = within(screen.getByText("K1").closest("tr")!)
      .getAllByRole("cell")
      .map((c) => c.textContent);
    expect(k1).toEqual(["K1", "2", "1", "0", "0", "0"]);
  });

  it("fetchSebaranK gagal 403 melempar ApiError", async () => {
    get.mockResolvedValue(resp(null, 403));
    await expect(fetchSebaranK("tok", "m1")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("agenda yayasan", () => {
  it("403 melempar ApiError", async () => {
    get.mockResolvedValue(resp(null, 403));
    await expect(fetchAgendaYayasan("tok", 0)).rejects.toBeInstanceOf(ApiError);
  });

  it("merender kolom masalah (kode berantai ke detail), status bukti, saran, prioritas final", async () => {
    get.mockResolvedValue(
      resp({
        items: [
          penilaian({
            prioritas_final: "P2 - Berikutnya",
            status_penilaian: "Siap untuk telaah yayasan",
          }),
        ],
        total: 1,
        limit: 20,
        offset: 0,
      }),
    );
    post.mockResolvedValue(
      resp({ items: [{ id: "m1", kode: "M-K01-01" }], total: 1, limit: 1, offset: 0 }),
    );
    render(await AgendaYayasanPage({ searchParams: Promise.resolve({}) }));
    const link = screen.getByRole("link", { name: "M-K01-01" });
    expect(link).toHaveAttribute("href", "/redesain/masalah/m1");
    expect(screen.getByText("Belum cukup")).toBeInTheDocument();
    expect(screen.getByText("K - Klarifikasi")).toBeInTheDocument();
    expect(screen.getByText("P2 - Berikutnya")).toBeInTheDocument();
    expect(post.mock.calls[0][1].body.domain).toEqual([["id", "in", ["m1"]]]);
  });

  it("agenda kosong → pesan kosong, tanpa panggilan masalah", async () => {
    get.mockResolvedValue(resp({ items: [], total: 0, limit: 20, offset: 0 }));
    render(await AgendaYayasanPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/Belum ada penilaian yang siap/)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });
});
