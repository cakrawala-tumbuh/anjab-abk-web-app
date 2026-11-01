import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@/lib/auth/auth", () => ({ auth: () => authMock() }));
const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get, POST: post, PATCH: patch }),
}));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh }) }));
const notifyGagal = vi.fn();
const notifySukses = vi.fn();
vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifyGagal: (e: unknown) => notifyGagal(e),
  notifySukses: (m: string) => notifySukses(m),
}));

import VersiMetodePage from "@/app/(auth)/redesain/versi-metode/page";
import {
  FormVersiMetode,
  PESAN_KONFLIK_VERSI,
} from "@/app/(auth)/redesain/versi-metode/form-versi-metode";
import { ApiError } from "@/lib/api/errors";

const resp = (data: unknown, status = 200) => ({
  data: status < 400 ? data : undefined,
  error: status < 400 ? undefined : { error: "x", message: "ditolak" },
  response: { status, headers: { get: () => "req-1" } },
});
const item = (n: number) => ({
  id: `id-${n}`,
  versi: `v1.${n}`,
  tanggal: "2026-11-01",
  bagian: `Bagian ${n}`,
  apa_diperbarui: `Apa ${n}`,
  alasan_risiko: `Alasan ${n}`,
  status_hasil_uji: `Lulus ${n}`,
  pemeriksa_pemutus: "Ketua Tim Kajian",
  created_at: "2026-11-01T00:00:00Z",
  updated_at: "2026-11-01T00:00:00Z",
});

beforeEach(() => {
  [get, post, patch, refresh, notifyGagal, notifySukses].forEach((m) => m.mockReset());
  authMock.mockResolvedValue({ accessToken: "tok" });
});

function isiForm() {
  const isi = (label: RegExp, v: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value: v } });
  isi(/^Versi/, "v2.0");
  isi(/^Tanggal/, "2026-11-02");
  isi(/^Bagian/, "Batas");
  isi(/^Apa yang diperbarui/, "A");
  isi(/^Alasan/, "B");
  isi(/^Status dan hasil uji/, "C");
  isi(/^Pemeriksa/, "Ketua");
}

describe("halaman versi metode", () => {
  it("merender 5 baris seed", async () => {
    const items = [1, 2, 3, 4, 5].map(item);
    get.mockResolvedValue(resp({ items, total: 5, limit: 20, offset: 0 }));
    render(await VersiMetodePage({ searchParams: Promise.resolve({}) }));
    for (const n of [1, 2, 3, 4, 5]) {
      expect(screen.getByText(`v1.${n}`)).toBeInTheDocument();
    }
    expect(screen.getAllByRole("button", { name: "Ubah" })).toHaveLength(5);
  });

  it("index 403 melempar ApiError", async () => {
    get.mockResolvedValue(resp({}, 403));
    await expect(VersiMetodePage({ searchParams: Promise.resolve({}) })).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});

describe("form versi metode", () => {
  it("tambah 409 menampilkan pesan duplikat tanpa toast sukses", async () => {
    post.mockResolvedValue(resp({}, 409));
    render(<FormVersiMetode accessToken="tok" />);
    isiForm();
    fireEvent.click(screen.getByRole("button", { name: "Tambah" }));
    expect(await screen.findByText(PESAN_KONFLIK_VERSI)).toBeInTheDocument();
    expect(PESAN_KONFLIK_VERSI).toBe("Versi dan bagian ini sudah tercatat");
    expect(notifySukses).not.toHaveBeenCalled();
  });

  it("tambah sukses memanggil POST, toast sukses, dan refresh", async () => {
    post.mockResolvedValue(resp(item(9), 201));
    render(<FormVersiMetode accessToken="tok" />);
    isiForm();
    fireEvent.click(screen.getByRole("button", { name: "Tambah" }));
    await waitFor(() => expect(notifySukses).toHaveBeenCalled());
    expect(post.mock.calls[0][0]).toBe("/api/v1/redesain/versi-metode");
    expect(post.mock.calls[0][1].body.versi).toBe("v2.0");
    expect(refresh).toHaveBeenCalled();
  });

  it("PATCH 422 memanggil notifyGagal", async () => {
    patch.mockResolvedValue(resp({}, 422));
    render(<FormVersiMetode accessToken="tok" awal={item(1)} />);
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect(patch.mock.calls[0][1].params.path.versi_id).toBe("id-1");
    expect(notifySukses).not.toHaveBeenCalled();
  });
});
