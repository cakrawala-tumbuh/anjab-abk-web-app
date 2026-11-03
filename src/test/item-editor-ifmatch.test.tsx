import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WcpItemRead } from "@/lib/api/schema";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const patch = vi.fn();
vi.mock("@/lib/api/client", () => ({ withServerAuth: () => ({ PATCH: patch }) }));

import { WcpItemEditor } from "@/app/(auth)/master-data/wcp/[kode]/wcp-item-editor";

const item = {
  id: "witm_SC1a",
  item_id: "SC1a",
  dimensi_kode: "SC",
  indikator_kode: "1",
  indikator_label: "Indikator",
  pernyataan: "Pernyataan pertama.",
  reverse_type: "NONE",
  urutan: 1,
} as WcpItemRead;

beforeEach(() => {
  patch.mockReset();
  patch.mockResolvedValue({
    data: item,
    error: undefined,
    response: { status: 200, headers: { get: () => null } },
  });
});

describe("WcpItemEditor — If-Match", () => {
  it("PATCH membawa If-Match sesuai prop etags", async () => {
    render(<WcpItemEditor items={[item]} accessToken="tok" etags={{ SC1a: '"tag1"' }} />);
    fireEvent.click(screen.getByRole("button", { name: "Ubah" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    });
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith(
      "/api/v1/wcp/dimensi/items/{item_id}",
      expect.objectContaining({ headers: { "If-Match": '"tag1"' } }),
    );
  });
});
