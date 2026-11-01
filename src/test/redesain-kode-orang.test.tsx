import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";

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

import { PilihKodeOrang } from "@/components/pilih-kode-orang";
import KodeOrangPage from "@/app/(auth)/redesain/kode-orang/page";
import { TambahKodeOrang } from "@/app/(auth)/redesain/kode-orang/tambah-kode-orang";

const resp = (data: unknown, status = 200) => ({
  data: status < 400 ? data : undefined,
  error: status < 400 ? undefined : { error: "x", message: "ditolak" },
  response: { status, headers: { get: () => "req-1" } },
});
const page = (items: unknown[]) => resp({ items, total: items.length, limit: 500, offset: 0 });
const kode = (id: string, k: string, ket: string | null, partisipan_id: string | null = null) => ({
  id,
  kode: k,
  keterangan_peran: ket,
  partisipan_id,
  created_at: "2026-11-01T00:00:00Z",
});

beforeEach(() => {
  [get, post, patch, refresh, notifyGagal, notifySukses].forEach((m) => m.mockReset());
  authMock.mockResolvedValue({ accessToken: "tok" });
});

function Pembungkus({ onNilai }: { onNilai: (v: string) => void }) {
  const [v, setV] = useState("");
  return (
    <PilihKodeOrang
      name="x_kode_orang"
      value={v}
      accessToken="tok"
      onChange={(k) => {
        setV(k);
        onNilai(k);
      }}
    />
  );
}

describe("PilihKodeOrang", () => {
  it("merender opsi 'kode — keterangan' dan mengirim nilai kode", async () => {
    get.mockResolvedValue(
      page([kode("a", "O-0001", "Wakasek Kurikulum"), kode("b", "O-0002", "Guru BK")]),
    );
    const onNilai = vi.fn();
    render(<Pembungkus onNilai={onNilai} />);
    const opsi = await screen.findByRole("option", { name: "O-0001 — Wakasek Kurikulum" });
    expect(opsi).toHaveValue("O-0001");
    expect(screen.getByRole("option", { name: "O-0002 — Guru BK" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "O-0001" } });
    expect(onNilai).toHaveBeenCalledWith("O-0001");
  });

  it("tidak menampilkan nama orang", async () => {
    get.mockResolvedValue(page([kode("a", "O-0001", "Wakasek", "p1")]));
    render(<Pembungkus onNilai={() => {}} />);
    await screen.findByRole("option", { name: "O-0001 — Wakasek" });
    expect(get).toHaveBeenCalledWith("/api/v1/redesain/kode-orang", expect.anything());
    expect(screen.queryByText(/Budi/)).toBeNull();
  });

  it("403 → notifyGagal dan state gagal, bukan pilihan kosong", async () => {
    get.mockResolvedValue(resp(null, 403));
    render(<Pembungkus onNilai={() => {}} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Gagal memuat daftar kode orang");
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(notifyGagal).toHaveBeenCalledTimes(1);
  });
});

describe("halaman kode orang", () => {
  it("menampilkan nama partisipan untuk record ber-partisipan_id", async () => {
    get.mockImplementation(async (path: string) => {
      if (path === "/api/v1/redesain/kode-orang")
        return page([kode("a", "O-0001", "Wakasek", "p1"), kode("b", "O-0002", "Narsum", null)]);
      return page([{ id: "p1", nama: "Budi Santoso" }]);
    });
    render(await KodeOrangPage());
    expect(screen.getByRole("cell", { name: "Budi Santoso" })).toBeInTheDocument();
    expect(screen.getByText("O-0002")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /hapus/i })).toBeNull();
  });

  it("403 melempar ApiError (bukan tabel kosong)", async () => {
    get.mockResolvedValue(resp(null, 403));
    await expect(KodeOrangPage()).rejects.toMatchObject({ name: "ApiError", status: 403 });
  });
});

describe("tambah kode orang", () => {
  it("409 → pesan konflik, tanpa toast sukses", async () => {
    post.mockResolvedValue(resp(null, 409));
    render(
      <TambahKodeOrang partisipan={[{ id: "p1", nama: "Budi" } as never]} accessToken="tok" />,
    );
    fireEvent.change(screen.getByLabelText(/Keterangan peran/), { target: { value: "Narsum" } });
    fireEvent.change(screen.getByLabelText(/Partisipan/), { target: { value: "p1" } });
    fireEvent.click(screen.getByRole("button", { name: "Tambah" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Partisipan ini sudah punya kode"),
    );
    expect(notifySukses).not.toHaveBeenCalled();
    expect(post).toHaveBeenCalledWith(
      "/api/v1/redesain/kode-orang",
      expect.objectContaining({ body: { keterangan_peran: "Narsum", partisipan_id: "p1" } }),
    );
  });

  it("sukses tanpa partisipan → toast sukses dan refresh", async () => {
    post.mockResolvedValue(resp(kode("n", "O-0009", "Narsum"), 201));
    render(<TambahKodeOrang partisipan={[]} accessToken="tok" />);
    fireEvent.change(screen.getByLabelText(/Keterangan peran/), { target: { value: "Narsum" } });
    fireEvent.click(screen.getByRole("button", { name: "Tambah" }));
    await waitFor(() => expect(notifySukses).toHaveBeenCalled());
    expect(refresh).toHaveBeenCalled();
  });
});
