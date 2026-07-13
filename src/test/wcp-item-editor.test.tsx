import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WcpItemRead } from "@/lib/api/schema";

// ── Mock router & API client ────────────────────────────────────────────────
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const patch = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ PATCH: patch }),
}));

import { WcpItemEditor } from "@/app/(auth)/master-data/wcp/[kode]/wcp-item-editor";

// ── Fixtures ────────────────────────────────────────────────────────────────
function item(itemId: string, pernyataan: string, urutan: number): WcpItemRead {
  return {
    id: `witm_${itemId}`,
    item_id: itemId,
    dimensi_kode: "SC",
    indikator_kode: "1",
    indikator_label: "Frekuensi perubahan kebijakan",
    pernyataan,
    reverse_type: "NONE",
    urutan,
  } as WcpItemRead;
}

const items = [item("SC1a", "Pernyataan pertama.", 1), item("SC1b", "Pernyataan kedua.", 2)];

beforeEach(() => {
  refresh.mockReset();
  patch.mockReset();
  patch.mockResolvedValue({
    data: item("SC1b", "Pernyataan kedua diubah.", 2),
    error: undefined,
    response: { headers: { get: () => "req_1" } },
  });
});

describe("WcpItemEditor — simpan sukses", () => {
  it("PATCH dipanggil dengan item_id benar, refresh dipanggil tepat 1x, baris edit tertutup", async () => {
    render(<WcpItemEditor items={items} accessToken="tok" />);

    fireEvent.click(screen.getAllByRole("button", { name: "Ubah" })[1]);
    fireEvent.change(screen.getByLabelText("Pernyataan"), {
      target: { value: "Pernyataan kedua diubah." },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    });

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith(
      "/api/v1/wcp/dimensi/items/{item_id}",
      expect.objectContaining({
        params: { path: { item_id: "SC1b" } },
        body: { pernyataan: "Pernyataan kedua diubah.", reverse_type: "NONE", urutan: 2 },
      }),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText("Pernyataan")).toBeNull();
  });
});

describe("WcpItemEditor — simpan gagal", () => {
  it("refresh TIDAK dipanggil, baris edit tetap terbuka, pesan error tampil", async () => {
    patch.mockResolvedValue({
      data: undefined,
      error: { detail: "Gagal menyimpan item." },
      response: { headers: { get: () => "req_2" } },
    });

    render(<WcpItemEditor items={items} accessToken="tok" />);
    fireEvent.click(screen.getAllByRole("button", { name: "Ubah" })[0]);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    });

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Pernyataan")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("WcpItemEditor — tabel mengikuti prop items", () => {
  it("rerender dengan urutan items baru mengubah urutan baris di DOM", () => {
    const { rerender } = render(<WcpItemEditor items={items} accessToken="tok" />);
    let rows = screen.getAllByRole("row").slice(1); // skip header
    expect(rows[0]).toHaveTextContent("SC1a");
    expect(rows[1]).toHaveTextContent("SC1b");

    const reordered = [
      { ...items[1], urutan: 1 },
      { ...items[0], urutan: 2 },
    ];
    rerender(<WcpItemEditor items={reordered} accessToken="tok" />);

    rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("SC1b");
    expect(rows[1]).toHaveTextContent("SC1a");
  });
});

describe("WcpItemEditor — batal", () => {
  it("klik Ubah lalu Batal tidak memanggil patch atau refresh", () => {
    render(<WcpItemEditor items={items} accessToken="tok" />);
    fireEvent.click(screen.getAllByRole("button", { name: "Ubah" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Batal" }));

    expect(patch).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Pernyataan")).toBeNull();
  });
});
