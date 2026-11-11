import { describe, expect, it, vi } from "vitest";
import {
  perbaruiTokenBilaPerlu,
  sesiDiizinkan,
  type DependensiRefresh,
} from "@/lib/auth/token-refresh";

const NOW = 1_000_000;
const dasar = { accessToken: "lama", refreshToken: "rt-lama", expiresAt: NOW - 10 };

function resp(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

function dep(fetchFn: typeof fetch): DependensiRefresh {
  return { now: NOW, fetchFn, issuer: "https://idp.test/app/", clientId: "cid" };
}

const disc = () => resp(200, { token_endpoint: "https://idp.test/token" });

describe("perbaruiTokenBilaPerlu", () => {
  it("token belum mendekati kedaluwarsa dikembalikan apa adanya tanpa fetch", async () => {
    const f = vi.fn();
    const token = { ...dasar, expiresAt: NOW + 61 };
    const hasil = await perbaruiTokenBilaPerlu(token, dep(f as unknown as typeof fetch));
    expect(hasil).toBe(token);
    expect(f).not.toHaveBeenCalled();
  });

  it("kedaluwarsa + refresh 200 menyimpan token baru dan refresh token rotasi", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(disc())
      .mockResolvedValueOnce(
        resp(200, { access_token: "baru", expires_in: 300, refresh_token: "rt-baru" }),
      );
    const hasil = await perbaruiTokenBilaPerlu(dasar, dep(f as unknown as typeof fetch));
    expect(hasil).toMatchObject({
      accessToken: "baru",
      expiresAt: NOW + 300,
      refreshToken: "rt-baru",
    });
    expect(hasil.error).toBeUndefined();
    const [url, init] = f.mock.calls[1];
    expect(url).toBe("https://idp.test/token");
    const body = (init as RequestInit).body as URLSearchParams;
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("client_id")).toBe("cid");
    expect(body.has("client_secret")).toBe(false);
  });

  it("tanpa rotasi refresh token lama dipertahankan", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(disc())
      .mockResolvedValueOnce(resp(200, { access_token: "baru", expires_in: 300 }));
    const hasil = await perbaruiTokenBilaPerlu(dasar, dep(f as unknown as typeof fetch));
    expect(hasil.refreshToken).toBe("rt-lama");
  });

  it("refresh 400 menghasilkan RefreshTokenError", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(disc())
      .mockResolvedValueOnce(resp(400, { error: "invalid_grant" }));
    const hasil = await perbaruiTokenBilaPerlu(dasar, dep(f as unknown as typeof fetch));
    expect(hasil.error).toBe("RefreshTokenError");
  });

  it("fetch melempar galat menghasilkan RefreshTokenError", async () => {
    const f = vi.fn().mockRejectedValue(new Error("jaringan putus"));
    const hasil = await perbaruiTokenBilaPerlu(dasar, dep(f as unknown as typeof fetch));
    expect(hasil.error).toBe("RefreshTokenError");
  });

  it("kedaluwarsa tanpa refresh token menghasilkan RefreshTokenError tanpa fetch", async () => {
    const f = vi.fn();
    const hasil = await perbaruiTokenBilaPerlu(
      { accessToken: "lama", expiresAt: NOW - 10 },
      dep(f as unknown as typeof fetch),
    );
    expect(hasil.error).toBe("RefreshTokenError");
    expect(f).not.toHaveBeenCalled();
  });
});

describe("sesiDiizinkan (authorized)", () => {
  it("sesi ber-error ditolak", () => {
    expect(sesiDiizinkan({ error: "RefreshTokenError" })).toBe(false);
  });
  it("sesi normal diizinkan, sesi kosong ditolak", () => {
    expect(sesiDiizinkan({})).toBe(true);
    expect(sesiDiizinkan(null)).toBe(false);
  });
});
