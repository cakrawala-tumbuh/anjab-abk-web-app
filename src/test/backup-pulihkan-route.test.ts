// @vitest-environment node
//
// Route Handler murni server-side (tanpa DOM). Environment `node` dipakai eksplisit
// karena `FormData` global di environment `jsdom` (default proyek ini) adalah
// implementasi jsdom sendiri — tidak dikenali `Request`/`fetch` milik undici (Node),
// sehingga Content-Type multipart tidak terdeteksi dan `request.formData()` gagal.
import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@/lib/auth/auth", () => ({
  auth: () => authMock(),
}));

import { POST } from "@/app/api/backup/pulihkan/route";

function buatRequest(formData: FormData): Request {
  return new Request("http://localhost/api/backup/pulihkan", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/backup/pulihkan", () => {
  beforeEach(() => {
    authMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("tanpa sesi/token membalas 401 tanpa memanggil backend", async () => {
    authMock.mockResolvedValue(null);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const fd = new FormData();
    fd.set("berkas", new File(["dump"], "backup.dump"));
    fd.set("konfirmasi", "anjab_abk");

    const res = await POST(buatRequest(fd));

    expect(res.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("meneruskan FormData (berkas + konfirmasi) ke endpoint backend yang benar, dengan Authorization dari sesi", async () => {
    authMock.mockResolvedValue({ accessToken: "tok-abc" });
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", peringatan: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const fd = new FormData();
    fd.set("berkas", new File(["dump-bytes"], "backup.dump"));
    fd.set("konfirmasi", "anjab_abk");

    const res = await POST(buatRequest(fd));

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("/api/v1/system/restore");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer tok-abc");

    const forwardedFd = init.body as FormData;
    expect(forwardedFd.get("konfirmasi")).toBe("anjab_abk");
    expect((forwardedFd.get("berkas") as File).name).toBe("backup.dump");

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
  });

  it("meneruskan status 422 (konfirmasi tidak cocok) apa adanya dari backend", async () => {
    authMock.mockResolvedValue({ accessToken: "tok-abc" });
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ error: "confirmation_mismatch", message: "Konfirmasi tidak cocok." }),
          { status: 422, headers: { "content-type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchSpy);

    const fd = new FormData();
    fd.set("berkas", new File(["dump-bytes"], "backup.dump"));
    fd.set("konfirmasi", "salah");

    const res = await POST(buatRequest(fd));

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.message).toBe("Konfirmasi tidak cocok.");
  });
});
