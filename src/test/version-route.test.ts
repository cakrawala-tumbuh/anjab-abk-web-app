import { afterEach, describe, expect, it, vi } from "vitest";
import pkg from "../../package.json";
import { GET } from "@/app/api/version/route";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/version", () => {
  it("tanpa env -> commit unknown dan version sama dengan package.json", async () => {
    vi.stubEnv("APP_BUILD_COMMIT", "");
    const res = GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ version: pkg.version, commit: "unknown" });
  });

  it("dengan env -> commit mengikuti env", async () => {
    vi.stubEnv("APP_BUILD_COMMIT", "abc123");
    const body = await GET().json();
    expect(body.commit).toBe("abc123");
    expect(body.version).toBe(pkg.version);
  });
});
