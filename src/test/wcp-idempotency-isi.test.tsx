import { render, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WcpDimensiWithItemsRead, WcpJawabanRead } from "@/lib/api/schema";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

const put = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ PUT: put, POST: post }),
}));

import { WcpForm } from "@/app/(auth)/wcp/isi/[responden_id]/wcp-form";

function resp(status = 200, error?: unknown) {
  return {
    data: error ? undefined : [],
    error,
    response: { status, headers: { get: () => null } },
  };
}

const dimensi = [
  {
    kode: "SC",
    nama: "SC",
    urutan: 1,
    is_risk: false,
    items: [{ item_id: "w1", pernyataan: "P1", urutan: 1 }],
  },
] as unknown as WcpDimensiWithItemsRead[];

function pilih(container: HTMLElement, nilai: number) {
  fireEvent.click(container.querySelector<HTMLInputElement>(`input[name="w1"][value="${nilai}"]`)!);
}

function keyKe(n: number) {
  return (post.mock.calls[n][1] as { headers: Record<string, string> }).headers["Idempotency-Key"];
}

beforeEach(() => {
  put.mockReset();
  post.mockReset();
  put.mockResolvedValue(resp());
  post.mockResolvedValue(resp(500, { error: "internal", message: "gagal" }));
});

describe("WcpForm — Idempotency-Key mengikuti isi jawaban", () => {
  it("jawaban diubah setelah gagal memakai key berbeda; isi sama tetap key sama", async () => {
    const { container } = render(
      <WcpForm
        respondenId="r1"
        dimensi={dimensi}
        jawabanAwal={[] as WcpJawabanRead[]}
        sudahSubmit={false}
        accessToken="tok"
        etag={null}
      />,
    );
    const form = container.querySelector("form")!;
    pilih(container, 4);
    await act(async () => {
      fireEvent.submit(form);
    });
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(keyKe(1)).toBe(keyKe(0));

    pilih(container, 2);
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(keyKe(2)).not.toBe(keyKe(0));
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(keyKe(3)).toBe(keyKe(2));

    pilih(container, 4);
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(new Set([keyKe(0), keyKe(2), keyKe(4)]).size).toBe(3);
  });
});
