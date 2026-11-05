import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const post = vi.fn();
vi.mock("@/lib/api/client", () => ({ withServerAuth: () => ({ POST: post }) }));

const notifyGagal = vi.fn();
const notifySukses = vi.fn();
vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifyGagal: (e: unknown) => notifyGagal(e),
  notifySukses: (m: string) => notifySukses(m),
}));

import { PenyediaPanel } from "@/app/(auth)/sistem/ai/penyedia/penyedia-panel";
import type { AiPenyediaRead, SaklarAiRead } from "@/lib/api/schema";
import { KETERANGAN_LANGGANAN, TAUTAN_LANGGANAN } from "@/lib/ai-penyedia";
import { PESAN_MASIH_DIPROSES } from "@/lib/konkurensi";

const RAHASIA = "sk-ant-RAHASIA-1234567890abcdef";

const penyedia = (o: Partial<AiPenyediaRead> = {}): AiPenyediaRead => ({
  mode: "MATI",
  mode_tersedia: ["MATI", "API_ANTHROPIC", "LANGGANAN_CLAUDE"],
  kredensial_terpasang: false,
  kredensial_akhiran: null,
  kredensial_terbaca: false,
  enkripsi_siap: true,
  model: "claude-opus-5-5",
  effort: "high",
  effort_tersedia: ["low", "medium", "high", "xhigh", "max"],
  model_bawaan: "claude-opus-5-5",
  effort_bawaan: "high",
  diperbarui_oleh: null,
  diperbarui_pada: null,
  langganan_cli_terpasang: false,
  langganan_cli_masuk: false,
  langganan_cli_versi: null,
  inference_geo: "us",
  refusal_fallback: false,
  ...o,
});

const saklar = (o: Partial<SaklarAiRead> = {}): SaklarAiRead => ({
  layanan: "AI_NARRATIVE_DRAFT",
  flag_aktif: true,
  dimatikan: false,
  boleh_jalan: true,
  alasan: null,
  aktor: null,
  pada: null,
  ...o,
});

function ok(data: unknown) {
  return { data, response: { status: 200, headers: { get: () => "r1" } } };
}
function gagal(status: number, code: string, message: string) {
  return {
    data: undefined,
    error: { error: code, message },
    response: { status, headers: { get: () => "r2" } },
  };
}

function tampil(p: Partial<AiPenyediaRead> = {}, s: Partial<SaklarAiRead> = {}) {
  return render(<PenyediaPanel penyedia={penyedia(p)} saklar={saklar(s)} accessToken="tok" />);
}

beforeEach(() => {
  post.mockReset();
  refresh.mockReset();
  notifyGagal.mockReset();
  notifySukses.mockReset();
});

const kunciInput = () => screen.getByLabelText(/Kunci API \(min/) as HTMLInputElement;
function isiKunci(alasan = "Pasang kunci produksi", kunci = RAHASIA) {
  fireEvent.change(kunciInput(), { target: { value: kunci } });
  fireEvent.change(screen.getByLabelText(/Alasan perubahan kunci/), { target: { value: alasan } });
}

describe("PenyediaPanel — status", () => {
  it("kunci terpasang menampilkan … + akhiran dan tidak merender nilai kunci", () => {
    const { container } = tampil({
      kredensial_terpasang: true,
      kredensial_akhiran: "9z8y",
      kredensial_terbaca: true,
      mode: "API_ANTHROPIC",
    });
    expect(screen.getAllByText(/Terpasang …9z8y/).length).toBeGreaterThan(0);
    expect(container.innerHTML).not.toContain("sk-ant");
    expect((kunciInput() as HTMLInputElement).value).toBe("");
  });

  it("menampilkan mode, model, effort, status CLI, setelan baca-saja, dan boleh_jalan", () => {
    tampil({ mode: "API_ANTHROPIC", inference_geo: "us" }, { boleh_jalan: false });
    const status = screen.getByRole("region", { name: "Status penyedia" });
    expect(within(status).getByText("Anthropic API")).toBeInTheDocument();
    expect(within(status).getByText("claude-opus-5-5")).toBeInTheDocument();
    expect(within(status).getByText("CLI langganan").nextSibling).toHaveTextContent(
      "Belum terpasang",
    );
    expect(within(status).getByText("Masuk CLI langganan").nextSibling).toHaveTextContent(
      "Belum masuk",
    );
    expect(within(status).getByText("us")).toBeInTheDocument();
    expect(within(status).getByText("Boleh jalan (saklar)").nextSibling).toHaveTextContent("Tidak");
    expect(status).toHaveTextContent("Memilih penyedia tidak menyalakan AI");
  });

  it("CLI terpasang menampilkan versi", () => {
    tampil({
      langganan_cli_terpasang: true,
      langganan_cli_masuk: true,
      langganan_cli_versi: "2.1.0",
    });
    expect(screen.getByText("Terpasang (2.1.0)")).toBeInTheDocument();
    expect(screen.getByText("Sudah masuk")).toBeInTheDocument();
  });

  it("kunci terpasang tetapi tidak terbaca → peringatan pasang ulang", () => {
    tampil({ kredensial_terpasang: true, kredensial_akhiran: "abcd", kredensial_terbaca: false });
    expect(screen.getByText(/Pasang ulang kunci API/)).toBeInTheDocument();
  });

  it("opsi mode persis mengikuti mode_tersedia", () => {
    tampil({ mode_tersedia: ["MATI", "API_ANTHROPIC"] });
    const opsi = within(screen.getByLabelText("Mode")).getAllByRole("option");
    expect(opsi.map((o) => (o as HTMLOptionElement).value)).toEqual(["MATI", "API_ANTHROPIC"]);
  });

  it("opsi effort mengikuti effort_tersedia", () => {
    tampil({ effort_tersedia: ["low", "max"], effort: "low" });
    const opsi = within(screen.getByLabelText("Effort")).getAllByRole("option");
    expect(opsi.map((o) => (o as HTMLOptionElement).value)).toEqual(["low", "max"]);
  });

  it("menampilkan nilai bawaan model dan effort", () => {
    tampil({ model_bawaan: "claude-bawaan-x", effort_bawaan: "medium" });
    expect(screen.getByText("claude-bawaan-x")).toBeInTheDocument();
    expect(screen.getByText("medium", { selector: "span" })).toBeInTheDocument();
  });

  it("tepat satu input kredensial (password), juga saat mode LANGGANAN_CLAUDE", () => {
    const { container, unmount } = tampil();
    expect(container.querySelectorAll('input[type="password"]')).toHaveLength(1);
    unmount();
    const r = tampil({ mode: "LANGGANAN_CLAUDE" });
    expect(r.container.querySelectorAll('input[type="password"]')).toHaveLength(1);
    const jenis = Array.from(r.container.querySelectorAll("input")).map((i) => i.type);
    expect(jenis).toEqual(["text", "password"]);
  });

  it("input kunci: autoComplete off dan type password", () => {
    tampil();
    expect(kunciInput()).toHaveAttribute("type", "password");
    expect(kunciInput()).toHaveAttribute("autocomplete", "off");
  });
});

describe("PenyediaPanel — ganti mode", () => {
  it("memanggil path mode dengan alasan dan Idempotency-Key", async () => {
    post.mockResolvedValue(ok(penyedia({ mode: "API_ANTHROPIC" })));
    tampil();
    fireEvent.change(screen.getByLabelText("Mode"), { target: { value: "API_ANTHROPIC" } });
    fireEvent.change(screen.getByLabelText(/Alasan perubahan mode \(/), {
      target: { value: "Beralih ke produksi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ganti mode" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [path, opsi] = post.mock.calls[0];
    expect(path).toBe("/api/v1/system/ai/penyedia/mode");
    expect(opsi.body).toEqual({ mode: "API_ANTHROPIC", alasan: "Beralih ke produksi" });
    expect(opsi.headers["Idempotency-Key"]).toMatch(/^[0-9a-f-]{36}$/);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(notifySukses).toHaveBeenCalled();
  });

  it("alasan kurang dari 5 karakter → tidak ada panggilan API", () => {
    tampil();
    fireEvent.change(screen.getByLabelText(/Alasan perubahan mode \(/), {
      target: { value: "abc" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ganti mode" }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("minimal 5");
  });

  it("409 conflict penolakan keadaan: teks backend tampil di alert dan notifyGagal", async () => {
    post.mockResolvedValue(gagal(409, "conflict", "Mode penyedia sudah MATI."));
    tampil();
    fireEvent.change(screen.getByLabelText(/Alasan perubahan mode \(/), {
      target: { value: "Coba lagi saja" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ganti mode" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Mode penyedia sudah MATI."),
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent(PESAN_MASIH_DIPROSES);
    expect(notifyGagal).toHaveBeenCalledTimes(1);
    expect((notifyGagal.mock.calls[0][0] as Error).message).toBe("Mode penyedia sudah MATI.");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("409 conflict idempotensi: teks backend tampil apa adanya", async () => {
    post.mockResolvedValue(
      gagal(409, "conflict", "Permintaan dengan Idempotency-Key ini sedang diproses."),
    );
    tampil();
    fireEvent.change(screen.getByLabelText(/Alasan perubahan mode \(/), {
      target: { value: "Coba lagi saja" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ganti mode" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Permintaan dengan Idempotency-Key ini sedang diproses.",
      ),
    );
    expect((notifyGagal.mock.calls[0][0] as Error).message).toBe(
      "Permintaan dengan Idempotency-Key ini sedang diproses.",
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("PenyediaPanel — model dan effort", () => {
  it("memanggil path model dengan model, effort, alasan", async () => {
    post.mockResolvedValue(ok(penyedia({ effort: "max" })));
    tampil();
    fireEvent.change(screen.getByLabelText("Model"), { target: { value: " claude-sonnet-5-5 " } });
    fireEvent.change(screen.getByLabelText("Effort"), { target: { value: "max" } });
    fireEvent.change(screen.getByLabelText(/Alasan perubahan model/), {
      target: { value: "Uji model lain" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan model dan effort" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [path, opsi] = post.mock.calls[0];
    expect(path).toBe("/api/v1/system/ai/penyedia/model");
    expect(opsi.body).toEqual({
      model: "claude-sonnet-5-5",
      effort: "max",
      alasan: "Uji model lain",
    });
    expect(opsi.headers["Idempotency-Key"]).toBeTruthy();
  });

  it("model dikosongkan → dikirim null (bawaan)", async () => {
    post.mockResolvedValue(ok(penyedia()));
    tampil();
    fireEvent.change(screen.getByLabelText("Model"), { target: { value: "  " } });
    fireEvent.change(screen.getByLabelText(/Alasan perubahan model/), {
      target: { value: "Kembali ke bawaan" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan model dan effort" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][1].body.model).toBeNull();
  });

  it("409 conflict simpan model: teks backend tampil di alert dan notifyGagal", async () => {
    post.mockResolvedValue(gagal(409, "conflict", "Model dan effort sudah demikian."));
    tampil();
    fireEvent.change(screen.getByLabelText(/Alasan perubahan model/), {
      target: { value: "Simpan tanpa ubah" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan model dan effort" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Model dan effort sudah demikian."),
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent(PESAN_MASIH_DIPROSES);
    expect((notifyGagal.mock.calls[0][0] as Error).message).toBe(
      "Model dan effort sudah demikian.",
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it("422 MODEL_DITOLAK tampil sebagai pesan", async () => {
    post.mockResolvedValue(gagal(422, "MODEL_DITOLAK", "Model ini tidak diizinkan."));
    tampil();
    fireEvent.change(screen.getByLabelText("Model"), { target: { value: "claude-fable-x" } });
    fireEvent.change(screen.getByLabelText(/Alasan perubahan model/), {
      target: { value: "Coba model ditolak" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan model dan effort" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Model ini tidak diizinkan."),
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("PenyediaPanel — kunci API", () => {
  it("sukses → path benar, input kosong, router.refresh terpanggil", async () => {
    post.mockResolvedValue(
      ok(penyedia({ kredensial_terpasang: true, kredensial_akhiran: "cdef" })),
    );
    tampil();
    isiKunci();
    fireEvent.click(screen.getByRole("button", { name: "Pasang kunci" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [path, opsi] = post.mock.calls[0];
    expect(path).toBe("/api/v1/system/ai/penyedia/kredensial");
    expect(opsi.body).toEqual({ kunci_api: RAHASIA, alasan: "Pasang kunci produksi" });
    expect(opsi.headers["Idempotency-Key"]).toMatch(/^[0-9a-f-]{36}$/);
    expect(opsi.headers["Idempotency-Key"]).not.toContain("RAHASIA");
    await waitFor(() => expect(kunciInput().value).toBe(""));
    expect(refresh).toHaveBeenCalled();
  });

  it("503 → pesan galat tampil, input kosong, kunci tidak bocor ke pesan/toast", async () => {
    post.mockResolvedValue(gagal(503, "KUNCI_INDUK_TIDAK_ADA", "Kunci induk belum diatur."));
    const { container } = tampil();
    isiKunci();
    fireEvent.click(screen.getByRole("button", { name: "Pasang kunci" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Kunci induk belum diatur."),
    );
    expect(kunciInput().value).toBe("");
    expect(refresh).not.toHaveBeenCalled();
    expect(container.innerHTML).not.toContain(RAHASIA);
    expect(JSON.stringify(notifyGagal.mock.calls)).not.toContain(RAHASIA);
  });

  it("409 conflict hapus kunci: teks backend tampil di alert dan notifyGagal", async () => {
    post.mockResolvedValue(gagal(409, "conflict", "Tidak ada kredensial tersimpan."));
    tampil({ kredensial_terpasang: true, kredensial_akhiran: "9z8y", kredensial_terbaca: true });
    fireEvent.change(screen.getByLabelText(/Alasan perubahan kunci/), {
      target: { value: "Hapus kunci lama" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Hapus kunci" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Tidak ada kredensial tersimpan."),
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent(PESAN_MASIH_DIPROSES);
    expect((notifyGagal.mock.calls[0][0] as Error).message).toBe("Tidak ada kredensial tersimpan.");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("galat jaringan (promise ditolak) → input tetap dikosongkan", async () => {
    post.mockRejectedValue(new TypeError("Failed to fetch"));
    tampil();
    isiKunci();
    fireEvent.click(screen.getByRole("button", { name: "Pasang kunci" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Failed to fetch"));
    expect(kunciInput().value).toBe("");
    expect(notifyGagal).toHaveBeenCalled();
  });

  it("setiap upaya memakai Idempotency-Key baru", async () => {
    post.mockResolvedValue(gagal(503, "KUNCI_INDUK_TIDAK_ADA", "Gagal."));
    tampil();
    isiKunci();
    fireEvent.click(screen.getByRole("button", { name: "Pasang kunci" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(kunciInput().value).toBe(""));
    isiKunci();
    fireEvent.click(screen.getByRole("button", { name: "Pasang kunci" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(post.mock.calls[0][1].headers["Idempotency-Key"]).not.toBe(
      post.mock.calls[1][1].headers["Idempotency-Key"],
    );
  });

  it("alasan kurang dari 5 karakter → tidak ada panggilan API", () => {
    tampil();
    isiKunci("abc");
    fireEvent.click(screen.getByRole("button", { name: "Pasang kunci" }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("minimal 5");
  });

  it("kunci terlalu pendek → tidak ada panggilan API", () => {
    tampil();
    isiKunci("Alasan cukup", "pendek");
    fireEvent.click(screen.getByRole("button", { name: "Pasang kunci" }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("minimal 20");
  });

  it("enkripsi_siap=false → input dan tombol pasang nonaktif, dengan pesan operator", () => {
    tampil({ enkripsi_siap: false });
    expect(kunciInput()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Pasang kunci" })).toBeDisabled();
    expect(screen.getByText(/AI_KREDENSIAL_KUNCI_INDUK/)).toBeInTheDocument();
  });

  it("hapus kunci memanggil path hapus; tombol hanya ada bila terpasang", async () => {
    const { unmount } = tampil();
    expect(screen.queryByRole("button", { name: "Hapus kunci" })).not.toBeInTheDocument();
    unmount();
    post.mockResolvedValue(ok(penyedia()));
    tampil({ kredensial_terpasang: true, kredensial_akhiran: "abcd", kredensial_terbaca: true });
    fireEvent.change(screen.getByLabelText(/Alasan perubahan kunci/), {
      target: { value: "Kunci bocor, dicabut" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Hapus kunci" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][0]).toBe("/api/v1/system/ai/penyedia/kredensial/hapus");
    expect(post.mock.calls[0][1].body).toEqual({ alasan: "Kunci bocor, dicabut" });
  });
});

describe("PenyediaPanel — langganan", () => {
  it("LANGGANAN_CLAUDE + CLI belum masuk → peringatan dan claude auth login", () => {
    tampil({ mode: "LANGGANAN_CLAUDE", langganan_cli_terpasang: true, langganan_cli_masuk: false });
    expect(screen.getByText(/panggilan model akan gagal/)).toBeInTheDocument();
    expect(screen.getByText("claude auth login")).toBeInTheDocument();
  });

  it("LANGGANAN_CLAUDE + CLI terpasang dan masuk → peringatan hilang", () => {
    tampil({ mode: "LANGGANAN_CLAUDE", langganan_cli_terpasang: true, langganan_cli_masuk: true });
    expect(screen.queryByText(/panggilan model akan gagal/)).not.toBeInTheDocument();
    expect(screen.queryByText("claude auth login")).not.toBeInTheDocument();
  });

  it("mode lain tidak memunculkan peringatan CLI", () => {
    tampil({ mode: "API_ANTHROPIC" });
    expect(screen.queryByText(/panggilan model akan gagal/)).not.toBeInTheDocument();
  });

  it("keterangan fakta lengkap dan ketiga tautan tampil", () => {
    tampil();
    expect(screen.getByText(KETERANGAN_LANGGANAN)).toBeInTheDocument();
    expect(KETERANGAN_LANGGANAN).toContain("Tanggung jawab atas pemakaian ada pada pemilik akun");
    expect(KETERANGAN_LANGGANAN).toContain("retensi sampai 5 tahun");
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    for (const t of TAUTAN_LANGGANAN) expect(hrefs).toContain(t.href);
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "https://claude.ai/settings/data-privacy-controls",
        "https://code.claude.com/docs/en/data-usage.md",
        "https://code.claude.com/docs/en/legal-and-compliance.md",
      ]),
    );
  });

  it("opsi LANGGANAN_CLAUDE tetap bisa dipilih, tanpa pemblokiran", async () => {
    post.mockResolvedValue(ok(penyedia({ mode: "LANGGANAN_CLAUDE" })));
    tampil();
    const opsi = screen
      .getAllByRole("option")
      .find((o) => (o as HTMLOptionElement).value === "LANGGANAN_CLAUDE") as HTMLOptionElement;
    expect(opsi).not.toBeDisabled();
    fireEvent.change(screen.getByLabelText("Mode"), { target: { value: "LANGGANAN_CLAUDE" } });
    fireEvent.change(screen.getByLabelText(/Alasan perubahan mode \(/), {
      target: { value: "Pengujian internal" },
    });
    expect(screen.getByRole("button", { name: "Ganti mode" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Ganti mode" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][1].body.mode).toBe("LANGGANAN_CLAUDE");
    expect(screen.queryByText(/diblokir|ditolak|dilarang/i)).not.toBeInTheDocument();
  });
});
