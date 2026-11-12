import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ POST: post }),
}));

import { PencatatMenitAktif } from "@/app/(auth)/narasi/antrean/[narasi_id]/pencatat-menit-aktif";

function ok() {
  return Promise.resolve({
    data: undefined,
    error: undefined,
    response: { status: 204, headers: { get: () => null } },
  });
}

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
}

function interaksi() {
  act(() => {
    document.dispatchEvent(new Event("click", { bubbles: true }));
  });
}

async function maju(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("useMenitAktif (lewat PencatatMenitAktif)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    post.mockReset();
    post.mockImplementation(ok);
    setVisibility("visible");
  });
  afterEach(() => {
    vi.useRealTimers();
    setVisibility("visible");
  });

  it("interaksi lalu 60 detik → satu detak ke endpoint yang benar", async () => {
    render(<PencatatMenitAktif narasiId="nar_1" accessToken="tok" />);
    interaksi();
    await maju(60_000);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith("/api/v1/narasi/kasus/{narasi_id}/menit-aktif", {
      params: { path: { narasi_id: "nar_1" } },
    });
  });

  it("tanpa interaksi sama sekali → tidak ada detak", async () => {
    render(<PencatatMenitAktif narasiId="nar_1" accessToken="tok" />);
    await maju(180_000);
    expect(post).not.toHaveBeenCalled();
  });

  it("tab tersembunyi → tidak ada detak", async () => {
    render(<PencatatMenitAktif narasiId="nar_1" accessToken="tok" />);
    interaksi();
    setVisibility("hidden");
    await maju(60_000);
    expect(post).not.toHaveBeenCalled();
  });

  it("idle 61 detik → berhenti; interaksi lagi → lanjut", async () => {
    render(<PencatatMenitAktif narasiId="nar_1" accessToken="tok" />);
    interaksi();
    await maju(60_000); // detak 1
    await maju(60_000); // idle 120 dtk sejak interaksi → berhenti
    expect(post).toHaveBeenCalledTimes(1);
    interaksi();
    await maju(60_000);
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("aktif terus 3 menit → tepat 3 detak", async () => {
    render(<PencatatMenitAktif narasiId="nar_1" accessToken="tok" />);
    for (let i = 0; i < 6; i++) {
      interaksi();
      await maju(30_000);
    }
    expect(post).toHaveBeenCalledTimes(3);
  });

  it("gagal detak (ditolak atau jaringan) tidak melempar, hanya console.warn", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    post.mockImplementationOnce(() =>
      Promise.resolve({
        data: undefined,
        error: { error: "rate_limited", message: "Terlalu banyak" },
        response: { status: 429, headers: { get: () => null } },
      }),
    );
    render(<PencatatMenitAktif narasiId="nar_1" accessToken="tok" />);
    interaksi();
    await maju(60_000);
    expect(warn).toHaveBeenCalledTimes(1);

    post.mockImplementationOnce(() => Promise.reject(new Error("jaringan putus")));
    interaksi();
    await maju(60_000);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it("unmount menghentikan detak", async () => {
    const { unmount } = render(<PencatatMenitAktif narasiId="nar_1" accessToken="tok" />);
    interaksi();
    unmount();
    await maju(120_000);
    expect(post).not.toHaveBeenCalled();
  });
});
