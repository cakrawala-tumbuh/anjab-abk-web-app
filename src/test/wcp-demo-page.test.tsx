import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn(),
  isAdmin: (session: { user?: { groups?: string[] } } | null) =>
    session?.user?.groups?.includes("admin") ?? false,
}));

const get = vi.fn();
const put = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get, PUT: put, POST: post }),
}));

import { auth } from "@/lib/auth/auth";
import { ApiError } from "@/lib/api/errors";
import WcpDemoPage from "@/app/(auth)/wcp/demo/page";

function ok(data: unknown) {
  return { data, error: undefined, response: { status: 200, headers: { get: () => "req-ok" } } };
}
function gagal(status: number, code: string, message: string) {
  return {
    data: undefined,
    error: { error: code, message },
    response: { status, headers: { get: () => "req-err" } },
  };
}

const dimensi = {
  kode: "SC",
  nama: "Supervisory Climate",
  urutan: 1,
  is_risk: false,
  items: [{ item_id: "w1", pernyataan: "Pernyataan contoh", urutan: 1 }],
};

function sesi(groups: string[]) {
  return { user: { id: "u1", groups }, accessToken: "tok" };
}

beforeEach(() => {
  get.mockReset();
  put.mockReset();
  post.mockReset();
  vi.mocked(auth).mockReset();
});

describe("WcpDemoPage", () => {
  it("bukan admin → notFound (404)", async () => {
    vi.mocked(auth).mockResolvedValue(sesi(["partisipan"]) as never);
    const err = await WcpDemoPage().catch((e: unknown) => e);
    expect((err as Error).message).toBe("NEXT_NOT_FOUND");
  });

  it("admin + instrumen sukses → render halaman demo dengan banner, tanpa jalur tulis", async () => {
    vi.mocked(auth).mockResolvedValue(sesi(["admin"]) as never);
    // Tiap GET dimensi mengembalikan kode unik supaya tidak ada tabrakan key
    // React di test (backend nyata mengembalikan 12 kode dimensi berbeda).
    let n = 0;
    get.mockImplementation(() => Promise.resolve(ok({ ...dimensi, kode: `DM${n++}` })));

    const el = (await WcpDemoPage()) as ReactElement;
    render(el);

    expect(screen.getByRole("heading", { name: "Demo Pengisian WCP" })).toBeInTheDocument();
    expect(screen.getByText(/Mode Demo\./)).toBeInTheDocument();
    expect(screen.getAllByText("Pernyataan contoh").length).toBeGreaterThan(0);
    expect(put).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it("instrumen gagal dimuat → melempar ApiError (tidak menelan jadi kosong)", async () => {
    vi.mocked(auth).mockResolvedValue(sesi(["admin"]) as never);
    get.mockResolvedValue(gagal(500, "internal_error", "Kesalahan server."));

    const err = await WcpDemoPage().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
  });
});
