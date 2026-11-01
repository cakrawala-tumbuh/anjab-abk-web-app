import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@/lib/auth/auth", () => ({ auth: () => authMock() }));

import { GET as GET_BATCH } from "@/app/api/redesain/ekspor/ringkasan-yayasan/route";
import { GET as GET_SATUAN } from "@/app/api/redesain/ekspor/ringkasan-yayasan/[masalah_id]/route";
import { GET as GET_LEMBAR } from "@/app/api/redesain/ekspor/lembar-konfirmasi/[masalah_id]/route";

const ctx = { params: Promise.resolve({ masalah_id: "m-1" }) };
const docxRes = () =>
  new Response("docx", {
    status: 200,
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "content-disposition": 'attachment; filename="ringkasan-M-K01-01.docx"',
    },
  });

beforeEach(() => {
  authMock.mockReset();
  vi.unstubAllGlobals();
});

describe("route ekspor redesain: tanpa sesi", () => {
  it.each([
    ["satuan", () => GET_SATUAN(new Request("http://x/a"), ctx)],
    ["lembar", () => GET_LEMBAR(new Request("http://x/a"), ctx)],
    ["batch", () => GET_BATCH(new Request("http://x/a?status_penilaian=Ditunda"))],
  ])("%s membalas 401 dan TIDAK memanggil backend", async (_n, panggil) => {
    authMock.mockResolvedValue(null);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const res = await panggil();
    expect(res.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("route ekspor redesain: dengan sesi", () => {
  it("satuan meneruskan Bearer, path backend, dan Content-Disposition apa adanya", async () => {
    authMock.mockResolvedValue({ accessToken: "tok-abc" });
    const fetchSpy = vi.fn().mockResolvedValue(docxRes());
    vi.stubGlobal("fetch", fetchSpy);
    const res = await GET_SATUAN(new Request("http://x/a"), ctx);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("/api/v1/redesain/ekspor/ringkasan-yayasan/m-1");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok-abc");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="ringkasan-M-K01-01.docx"',
    );
    expect(res.headers.get("content-type")).toContain("wordprocessingml");
  });

  it("lembar konfirmasi memanggil path backend lembar-konfirmasi", async () => {
    authMock.mockResolvedValue({ accessToken: "tok" });
    const fetchSpy = vi.fn().mockResolvedValue(docxRes());
    vi.stubGlobal("fetch", fetchSpy);
    await GET_LEMBAR(new Request("http://x/a"), ctx);
    expect(String(fetchSpy.mock.calls[0][0])).toContain(
      "/api/v1/redesain/ekspor/lembar-konfirmasi/m-1",
    );
  });

  it("batch meneruskan status_penilaian ke backend", async () => {
    authMock.mockResolvedValue({ accessToken: "tok" });
    const fetchSpy = vi.fn().mockResolvedValue(docxRes());
    vi.stubGlobal("fetch", fetchSpy);
    await GET_BATCH(
      new Request("http://x/a?status_penilaian=" + encodeURIComponent("Siap untuk telaah yayasan")),
    );
    const url = new URL(String(fetchSpy.mock.calls[0][0]));
    expect(url.pathname).toBe("/api/v1/redesain/ekspor/ringkasan-yayasan");
    expect(url.searchParams.get("status_penilaian")).toBe("Siap untuk telaah yayasan");
  });

  it("meneruskan status gagal backend (403 dan 404) apa adanya", async () => {
    authMock.mockResolvedValue({ accessToken: "tok" });
    for (const status of [403, 404]) {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ error: "x", message: "m" }), {
            status,
            headers: { "content-type": "application/json" },
          }),
        ),
      );
      const res = await GET_SATUAN(new Request("http://x/a"), ctx);
      expect(res.status).toBe(status);
    }
  });
});
