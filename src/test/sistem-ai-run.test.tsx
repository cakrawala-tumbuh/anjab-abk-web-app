import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn() }));
const get = vi.fn();
vi.mock("@/lib/api/client", () => ({ withServerAuth: () => ({ GET: get }) }));

import { auth } from "@/lib/auth/auth";
import { RunTabel } from "@/app/(auth)/sistem/ai/run-tabel";
import { DetailRun } from "@/app/(auth)/sistem/ai/run/[run_id]/detail-run";
import SistemAiPage from "@/app/(auth)/sistem/ai/page";
import { WajibGrup } from "@/components/wajib-grup";
import type { AiRunRead } from "@/lib/api/schema";

const run = (o: Partial<AiRunRead> = {}): AiRunRead => ({
  id: "11111111-2222-3333-4444-555555555555",
  fungsi: "draf_narasi",
  prompt_version: "v1",
  prompt_hash: "ph",
  model_diminta: "m1",
  model_dilayani: null,
  protocol_id: "p1",
  input_snapshot_id: "snap",
  sumber: [{ source_id: "bukti-1", source_hash: "h1" }],
  status_qa: "LOLOS",
  kode_qa: [],
  stop_reason: null,
  input_tokens: 10,
  output_tokens: 5,
  dibuat_oleh: "u",
  created_at: "2026-11-05T00:00:00Z",
  selesai_at: null,
  ...o,
});

const ok = (data: unknown) => ({ data, response: { status: 200, headers: { get: () => "r" } } });

beforeEach(() => {
  get.mockReset();
  vi.mocked(auth).mockReset();
});

describe("RunTabel", () => {
  it("filter lewat URL: form GET memuat nilai dari searchParams", () => {
    const { container } = render(
      <RunTabel
        items={[run()]}
        total={1}
        offset={0}
        fungsi="draf_narasi"
        statusQa="GAGAL"
        searchParams={{ fungsi: "draf_narasi", status_qa: "GAGAL" }}
      />,
    );
    expect(container.querySelector("form")).toHaveAttribute("method", "get");
    expect(screen.getByLabelText("Fungsi")).toHaveValue("draf_narasi");
    expect(screen.getByLabelText("Status QA")).toHaveValue("GAGAL");
    expect(screen.getByRole("link", { name: "11111111" })).toHaveAttribute(
      "href",
      "/sistem/ai/run/11111111-2222-3333-4444-555555555555",
    );
  });

  it("membedakan kosong dan kosong karena filter", () => {
    const { rerender } = render(
      <RunTabel items={[]} total={0} offset={0} fungsi="" statusQa="" searchParams={{}} />,
    );
    expect(screen.getByText("Belum ada run AI.")).toBeInTheDocument();
    rerender(<RunTabel items={[]} total={0} offset={0} fungsi="x" statusQa="" searchParams={{}} />);
    expect(screen.getByText(/cocok dengan filter/)).toBeInTheDocument();
  });
});

describe("DetailRun", () => {
  it("tidak merender masukan/keluaran walau objek memuatnya", () => {
    const berisi = {
      ...run(),
      masukan: { rahasia: "ISI-MASUKAN-RAHASIA" },
      keluaran: { teks: "ISI-KELUARAN-RAHASIA" },
    } as AiRunRead;
    const { container } = render(<DetailRun run={berisi} />);
    expect(container.textContent).not.toContain("RAHASIA");
    expect(container.textContent).not.toMatch(/masukan"|keluaran"/);
    expect(screen.getByText("draf_narasi")).toBeInTheDocument();
  });
});

describe("SistemAiPage", () => {
  const props = { searchParams: Promise.resolve({ fungsi: "f", status_qa: "GAGAL", hlm: "2" }) };

  it("meneruskan filter URL ke backend dan merender saklar + register", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { groups: ["admin"] }, accessToken: "t" } as never);
    get.mockImplementation(async (path: string) =>
      path.endsWith("/saklar")
        ? ok({
            layanan: "AI_NARRATIVE_DRAFT",
            flag_aktif: true,
            dimatikan: false,
            boleh_jalan: true,
          })
        : ok({ items: [run()], total: 1, limit: 20, offset: 20 }),
    );
    render(await SistemAiPage(props));
    const panggilanRuns = get.mock.calls.find((c) => c[0].endsWith("/runs"));
    expect(panggilanRuns?.[1].params.query).toMatchObject({
      fungsi: "f",
      status_qa: "GAGAL",
      offset: 20,
    });
    expect(screen.getByRole("heading", { name: /Saklar & Run AI/ })).toBeInTheDocument();
  });

  it("kegagalan backend dilempar, bukan panel kosong", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { groups: ["admin"] }, accessToken: "t" } as never);
    get.mockResolvedValue({
      data: undefined,
      error: { error: "forbidden", message: "x" },
      response: { status: 403, headers: { get: () => "r" } },
    });
    await expect(SistemAiPage(props)).rejects.toBeTruthy();
  });
});

describe("Guard admin segmen /sistem", () => {
  it("non-admin melihat panel penolakan", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { groups: ["partisipan"] } } as never);
    render(await WajibGrup({ grup: "admin", children: <p>RAHASIA-ADMIN</p> }));
    expect(screen.getByRole("alert")).toHaveTextContent("Tidak berhak");
    expect(screen.queryByText("RAHASIA-ADMIN")).not.toBeInTheDocument();
  });
});
