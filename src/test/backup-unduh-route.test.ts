import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@/lib/auth/auth", () => ({
  auth: () => authMock(),
}));

import { POST } from "@/app/api/backup/unduh/route";

describe("POST /api/backup/unduh", () => {
  beforeEach(() => {
    authMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("tanpa sesi/token membalas 401 tanpa memanggil backend", async () => {
    authMock.mockResolvedValue(null);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const res = await POST();

    expect(res.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.error).toBe("unauthorized");
  });

  it("menyisipkan Authorization dari sesi dan meneruskan Content-Type & Content-Disposition backend apa adanya", async () => {
    authMock.mockResolvedValue({ accessToken: "tok-abc" });
    const backendHeaders = new Headers({
      "content-type": "application/octet-stream",
      "content-disposition": 'attachment; filename="backup_20260726.dump"',
    });
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(new Response("dump-bytes", { status: 200, headers: backendHeaders }));
    vi.stubGlobal("fetch", fetchSpy);

    const res = await POST();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("/api/v1/system/backup");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer tok-abc");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/octet-stream");
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="backup_20260726.dump"',
    );
  });

  it("meneruskan status gagal backend (mis. 403) apa adanya", async () => {
    authMock.mockResolvedValue({ accessToken: "tok-abc" });
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "forbidden", message: "Bukan admin." }), {
        status: 403,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const res = await POST();

    expect(res.status).toBe(403);
  });
});
