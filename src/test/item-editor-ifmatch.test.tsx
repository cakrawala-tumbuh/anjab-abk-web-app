import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DcsItemBerEtagRead, WcpItemBerEtagRead } from "@/lib/api/schema";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const patch = vi.fn();
const get = vi.fn();
vi.mock("@/lib/api/client", () => ({ withServerAuth: () => ({ PATCH: patch, GET: get }) }));
vi.mock("@/lib/notify", () => ({
  notifySukses: vi.fn(),
  notifyGagal: vi.fn(),
  pesanGagal: (e: unknown) => (e instanceof Error ? e.message : String(e)),
}));

import { WcpItemEditor } from "@/app/(auth)/master-data/wcp/[kode]/wcp-item-editor";
import { DcsItemEditor } from "@/app/(auth)/master-data/dcs/[kode]/dcs-item-editor";
import { PESAN_DATA_BERUBAH } from "@/lib/konkurensi";

const itemWcp = {
  id: "witm_SC1a",
  item_id: "SC1a",
  dimensi_kode: "SC",
  indikator_kode: "1",
  indikator_label: "Indikator",
  pernyataan: "Pernyataan pertama.",
  reverse_type: "NONE",
  urutan: 1,
  etag: '"tag1"',
} as WcpItemBerEtagRead;

const itemDcs = {
  id: "ditm_D1",
  item_id: "D1",
  pernyataan: "Pernyataan DCS.",
  arah: "F",
  urutan: 1,
  etag: '"dtag1"',
} as unknown as DcsItemBerEtagRead;

function resp(etag: string | null) {
  return {
    data: itemWcp,
    error: undefined,
    response: {
      status: 200,
      headers: { get: (n: string) => (n.toLowerCase() === "etag" ? etag : null) },
    },
  };
}

async function simpan() {
  fireEvent.click(screen.getByRole("button", { name: "Ubah" }));
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  });
}

beforeEach(() => {
  patch.mockReset();
  get.mockReset();
  refresh.mockReset();
  patch.mockResolvedValue(resp(null));
});

describe("WcpItemEditor — If-Match dari item.etag", () => {
  it("PATCH membawa If-Match dari item.etag tanpa GET per item", async () => {
    render(<WcpItemEditor items={[itemWcp]} accessToken="tok" />);
    await simpan();
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith(
      "/api/v1/wcp/dimensi/items/{item_id}",
      expect.objectContaining({ headers: { "If-Match": '"tag1"' } }),
    );
    expect(get).not.toHaveBeenCalled();
  });

  it("PATCH berikutnya memakai ETag dari respons PATCH sebelumnya", async () => {
    patch.mockResolvedValueOnce(resp('"tag2"'));
    render(<WcpItemEditor items={[itemWcp]} accessToken="tok" />);
    await simpan();
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    await simpan();
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(2));
    expect(patch.mock.calls[1][1]).toEqual(
      expect.objectContaining({ headers: { "If-Match": '"tag2"' } }),
    );
  });

  it("412 → pesan baku data berubah", async () => {
    patch.mockResolvedValueOnce({
      data: undefined,
      error: { error: { code: "precondition_failed", message: "x" } },
      response: { status: 412, headers: { get: () => null } },
    });
    render(<WcpItemEditor items={[itemWcp]} accessToken="tok" />);
    await simpan();
    expect(await screen.findByRole("alert")).toHaveTextContent(PESAN_DATA_BERUBAH);
  });
});

describe("DcsItemEditor — If-Match dari item.etag", () => {
  it("PATCH membawa If-Match dari item.etag tanpa GET per item", async () => {
    render(<DcsItemEditor items={[itemDcs]} accessToken="tok" />);
    await simpan();
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith(
      "/api/v1/dcs/sub-skala/items/{item_id}",
      expect.objectContaining({ headers: { "If-Match": '"dtag1"' } }),
    );
    expect(get).not.toHaveBeenCalled();
  });
});
