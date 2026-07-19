import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";

// ── Mock router, auth, & API client ─────────────────────────────────────────
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn(),
  isPartisipan: (session: { user?: { groups?: string[] } } | null) =>
    session?.user?.groups?.includes("partisipan") ?? false,
}));

const get = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get }),
}));

import { auth } from "@/lib/auth/auth";
import { ApiError } from "@/lib/api/errors";
import OpmIsiPage from "@/app/(auth)/opm/isi/[responden_id]/page";

// ── Fixtures ────────────────────────────────────────────────────────────────
function ok(data: unknown) {
  return { data, error: undefined, response: { status: 200, headers: { get: () => "req-ok" } } };
}

function gagal(status: number, code: string, message: string, reqId = "req-err") {
  return {
    data: undefined,
    error: { error: code, message },
    response: { status, headers: { get: () => reqId } },
  };
}

const responden = { id: "oresp_1", sesi_id: "osesi_1", nama: "Budi", sudah_submit: false };
const task = [{ task_kode: "TIaaa", uraian_tugas: "Uraian A", tugas_pokok: "Pokok A", urutan: 1 }];

const props = { params: Promise.resolve({ responden_id: "oresp_lain" }) };

function sesiPartisipan(groups: string[] = ["partisipan"]) {
  return { user: { id: "u1", groups }, accessToken: "tok" };
}

beforeEach(() => {
  get.mockReset();
  vi.mocked(auth).mockReset();
  vi.mocked(auth).mockResolvedValue(sesiPartisipan() as never);
});

describe("OpmIsiPage — 403 (membuka responden_id milik orang lain) tampil sebagai TidakBerhak", () => {
  it("403 pada GET responden → panel Tidak Berwenang, bukan lempar", async () => {
    get.mockResolvedValueOnce(
      gagal(403, "forbidden", "Akses ditolak: Anda bukan pemilik data responden ini.", "req-403"),
    );

    const el = (await OpmIsiPage(props)) as ReactElement;
    render(el);

    expect(
      screen.getByText(
        "Anda tidak berhak membuka halaman ini. Halaman pengisian hanya dapat dibuka oleh partisipan pemiliknya.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("req-403")).toBeInTheDocument();
  });

  it("500 pada GET responden tetap MELEMPAR (tidak tertangkap sebagai TidakBerhak)", async () => {
    get.mockResolvedValueOnce(gagal(500, "internal_error", "Kesalahan server."));

    const err = await OpmIsiPage(props).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
  });
});

describe("OpmIsiPage — regresi: alur sukses (pemilik membuka kuesionernya sendiri) tidak berubah", () => {
  it("responden, task, jawaban sukses → form dirender tanpa panel Tidak Berwenang", async () => {
    get
      .mockResolvedValueOnce(ok(responden)) // respondenRes
      .mockResolvedValueOnce(ok(task)) // taskRes
      .mockResolvedValueOnce(ok([])); // jRes

    const el = (await OpmIsiPage(props)) as ReactElement;
    render(el);

    expect(screen.getByText("Kuesioner OPM — Rating Tugas")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Anda tidak berhak membuka halaman ini. Halaman pengisian hanya dapat dibuka oleh partisipan pemiliknya.",
      ),
    ).toBeNull();
  });
});
