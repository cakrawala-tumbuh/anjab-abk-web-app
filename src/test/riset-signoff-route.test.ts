// @vitest-environment node
//
// Route Handler murni server-side; environment `node` agar FormData/Request sama-sama undici
// (lihat backup-pulihkan-route.test.ts).
import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@/lib/auth/auth", () => ({ auth: () => authMock() }));

import { POST } from "@/app/api/riset/protokol/[id]/sign-off/route";
import { GET } from "@/app/api/riset/protokol/[id]/sign-off/lampiran/route";

const ctx = { params: Promise.resolve({ id: "p-1" }) };

function requestUnggah(): Request {
  const fd = new FormData();
  fd.set("pi_nama", "Dr. Ayu");
  fd.set("tanggal_persetujuan_etik", "2026-11-01");
  fd.set("lampiran", new File(["%PDF-1.4 isi"], "etik.pdf", { type: "application/pdf" }));
  return new Request("http://localhost/api/riset/protokol/p-1/sign-off", {
    method: "POST",
    body: fd,
  });
}

beforeEach(() => {
  authMock.mockReset();
  vi.unstubAllGlobals();
});

describe("POST /api/riset/protokol/[id]/sign-off", () => {
  it("tanpa sesi -> 401 dan backend tidak dipanggil", async () => {
    authMock.mockResolvedValue(null);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const res = await POST(requestUnggah(), ctx);
    expect(res.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("201 diteruskan: path backend, Bearer dari sesi, multipart utuh, X-Request-ID", async () => {
    authMock.mockResolvedValue({ accessToken: "tok-abc" });
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "s-1", pi_nama: "Dr. Ayu" }), {
        status: 201,
        headers: { "content-type": "application/json", "x-request-id": "rid-9" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const res = await POST(requestUnggah(), ctx);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("/api/v1/riset/protokol/p-1/sign-off");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok-abc");
    const fd = init.body as FormData;
    expect(fd.get("pi_nama")).toBe("Dr. Ayu");
    expect(fd.get("tanggal_persetujuan_etik")).toBe("2026-11-01");
    expect((fd.get("lampiran") as File).name).toBe("etik.pdf");
    expect(res.status).toBe(201);
    expect(res.headers.get("x-request-id")).toBe("rid-9");
    expect((await res.json()).id).toBe("s-1");
  });

  it.each([
    [409, "SIGNOFF_SUDAH_ADA"],
    [409, "PROTOKOL_BELUM_TERKUNCI"],
    [422, "LAMPIRAN_BUKAN_PDF"],
    [422, "LAMPIRAN_TERLALU_BESAR"],
    [413, "payload_too_large"],
  ])("status %i %s diteruskan beserta envelope, bukan jadi 500", async (status, kode) => {
    authMock.mockResolvedValue({ accessToken: "t" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: kode, message: `pesan ${kode}` }), {
          status,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const res = await POST(requestUnggah(), ctx);
    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ error: kode, message: `pesan ${kode}` });
  });

  it("body bukan multipart -> 400 tanpa memanggil backend", async () => {
    authMock.mockResolvedValue({ accessToken: "t" });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const res = await POST(
      new Request("http://localhost/x", {
        method: "POST",
        body: "bukan form",
        headers: { "content-type": "text/plain" },
      }),
      ctx,
    );
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("GET /api/riset/protokol/[id]/sign-off/lampiran", () => {
  it("tanpa sesi -> 401 dan backend tidak dipanggil", async () => {
    authMock.mockResolvedValue(null);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const res = await GET(new Request("http://x/a"), ctx);
    expect(res.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("meneruskan Content-Type, Content-Disposition, Bearer, dan byte PDF", async () => {
    authMock.mockResolvedValue({ accessToken: "tok-abc" });
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response("%PDF-1.4 isi", {
        status: 200,
        headers: {
          "content-type": "application/pdf",
          "content-disposition": 'attachment; filename="etik.pdf"',
        },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const res = await GET(new Request("http://x/a"), ctx);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("/api/v1/riset/protokol/p-1/sign-off/lampiran");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok-abc");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="etik.pdf"');
    expect(await res.text()).toBe("%PDF-1.4 isi");
  });

  it("404 backend (SIGNOFF_TAK_ADA) diteruskan sebagai 404", async () => {
    authMock.mockResolvedValue({ accessToken: "t" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "SIGNOFF_TAK_ADA", message: "x" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const res = await GET(new Request("http://x/a"), ctx);
    expect(res.status).toBe(404);
  });
});
