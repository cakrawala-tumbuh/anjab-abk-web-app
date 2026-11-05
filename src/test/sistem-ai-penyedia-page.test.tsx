import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn(async () => ({ accessToken: "tok" })) }));

const get = vi.fn();
vi.mock("@/lib/api/client", () => ({ withServerAuth: () => ({ GET: get, POST: vi.fn() }) }));

import PenyediaAiPage from "@/app/(auth)/sistem/ai/penyedia/page";
import { ApiError } from "@/lib/api/errors";

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

const penyedia = {
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
};
const saklar = {
  layanan: "AI_NARRATIVE_DRAFT",
  flag_aktif: true,
  dimatikan: false,
  boleh_jalan: true,
  alasan: null,
  aktor: null,
  pada: null,
};

beforeEach(() => get.mockReset());

/** Atur jawaban GET per path: `penyediaRes` untuk `.../penyedia`, `saklarRes` untuk `.../saklar`. */
function atur(penyediaRes: unknown, saklarRes: unknown) {
  get.mockImplementation(async (path: string) =>
    path === "/api/v1/system/ai/penyedia" ? penyediaRes : saklarRes,
  );
}

describe("halaman /sistem/ai/penyedia", () => {
  it("merender panel dari kedua GET", async () => {
    atur(ok(penyedia), ok(saklar));
    render(await PenyediaAiPage());
    expect(screen.getByRole("heading", { level: 1, name: "Penyedia AI" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Status penyedia" })).toBeInTheDocument();
  });

  it("GET penyedia gagal → dilempar ApiError, bukan panel kosong", async () => {
    atur(gagal(403, "forbidden", "Dilarang."), ok(saklar));
    await expect(PenyediaAiPage()).rejects.toBeInstanceOf(ApiError);
  });

  it("GET saklar gagal → dilempar ApiError", async () => {
    atur(ok(penyedia), gagal(500, "internal", "Galat server."));
    await expect(PenyediaAiPage()).rejects.toMatchObject({ status: 500 });
  });
});
