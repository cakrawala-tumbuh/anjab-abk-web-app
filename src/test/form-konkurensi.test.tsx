import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import type {
  WcpDimensiWithItemsRead,
  WcpJawabanRead,
  DcsSubSkalaWithItemsRead,
  DcsJawabanRead,
} from "@/lib/api/schema";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

const put = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ PUT: put, POST: post }),
}));

import { WcpForm } from "@/app/(auth)/wcp/isi/[responden_id]/wcp-form";
import { DcsForm } from "@/app/(auth)/dcs/isi/[responden_id]/dcs-form";
import { PESAN_DATA_BERUBAH, PESAN_MASIH_DIPROSES } from "@/lib/konkurensi";

/** Respons openapi-fetch dengan header kustom. */
function resp(opts: { status?: number; etag?: string; error?: unknown } = {}) {
  return {
    data: opts.error ? undefined : [],
    error: opts.error,
    response: {
      status: opts.status ?? 200,
      headers: { get: (n: string) => (n === "etag" ? (opts.etag ?? null) : null) },
    },
  };
}

const wcpDimensi = [
  {
    kode: "SC",
    nama: "SC",
    urutan: 1,
    is_risk: false,
    items: [{ item_id: "w1", pernyataan: "P1", urutan: 1 }],
  },
] as unknown as WcpDimensiWithItemsRead[];
const dcsSub = [
  {
    kode: "D",
    nama: "D",
    urutan: 1,
    items: [{ item_id: "d1", pernyataan: "P1", urutan: 1 }],
  },
] as unknown as DcsSubSkalaWithItemsRead[];

function pilih(container: HTMLElement, itemId: string, nilai: number) {
  fireEvent.click(
    container.querySelector<HTMLInputElement>(`input[name="${itemId}"][value="${nilai}"]`)!,
  );
}

function renderWcp(etag: string | null = '"e0"') {
  const r = render(
    <WcpForm
      respondenId="r1"
      dimensi={wcpDimensi}
      jawabanAwal={[] as WcpJawabanRead[]}
      sudahSubmit={false}
      accessToken="tok"
      etag={etag}
    />,
  );
  pilih(r.container, "w1", 4);
  return r;
}

function headersDari(mock: ReturnType<typeof vi.fn>, n: number) {
  return (mock.mock.calls[n][1] as { headers: Record<string, string> }).headers;
}

beforeEach(() => {
  refresh.mockReset();
  put.mockReset();
  post.mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.success).mockReset();
});

describe("WcpForm — Idempotency-Key pada submit", () => {
  it("dua submit berturut-turut (POST lambat) membawa Idempotency-Key identik", async () => {
    put.mockResolvedValue(resp({ etag: '"e1"' }));
    post.mockImplementation(
      () => new Promise((res) => setTimeout(() => res(resp({ status: 201 })), 30)),
    );
    const { container } = renderWcp();
    const form = container.querySelector("form")!;
    await act(async () => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    const k1 = headersDari(post, 0)["Idempotency-Key"];
    expect(k1).toBeTruthy();
    expect(headersDari(post, 1)["Idempotency-Key"]).toBe(k1);
  });

  it("submit gagal lalu dikirim ulang → key dipertahankan (kirim ulang aman)", async () => {
    put.mockResolvedValue(resp({ etag: '"e1"' }));
    // submit pertama sukses tapi form tetap bisa dikirim lagi? setelah sukses panel diganti —
    // maka dipakai skenario gagal-lalu-sukses untuk membuktikan key ikut gagal, lalu berbeda.
    post.mockResolvedValueOnce(
      resp({ status: 500, error: { error: "internal", message: "gagal" } }),
    );
    post.mockResolvedValueOnce(resp({ status: 201 }));
    const { container } = renderWcp();
    const form = container.querySelector("form")!;
    await act(async () => {
      fireEvent.submit(form);
    });
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(post).toHaveBeenCalledTimes(2);
    // gagal → key dipertahankan (kirim ulang aman)
    expect(headersDari(post, 1)["Idempotency-Key"]).toBe(headersDari(post, 0)["Idempotency-Key"]);
  });

  it("409 conflict → toast 'masih diproses'", async () => {
    put.mockResolvedValue(resp({ etag: '"e1"' }));
    post.mockResolvedValue(
      resp({ status: 409, error: { error: "conflict", message: "sedang diproses" } }),
    );
    const { container } = renderWcp();
    await act(async () => {
      fireEvent.submit(container.querySelector("form")!);
    });
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(PESAN_MASIH_DIPROSES, expect.anything()),
    );
  });
});

describe("WcpForm — If-Match pada simpan draft", () => {
  it("412 → toast pesan tetap, isian tidak hilang", async () => {
    put.mockResolvedValue(
      resp({ status: 412, error: { error: "precondition_failed", message: "etag beda" } }),
    );
    const { container } = renderWcp();
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Simpan" })[0]);
    });
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(PESAN_DATA_BERUBAH, expect.anything()),
    );
    expect(headersDari(put, 0)["If-Match"]).toBe('"e0"');
    expect(container.querySelector<HTMLInputElement>('input[name="w1"][value="4"]')!.checked).toBe(
      true,
    );
  });
});

describe("DcsForm — If-Match pada simpan draft", () => {
  it("memakai ETag prop, lalu ETag baru dari respons sukses", async () => {
    put.mockResolvedValueOnce(resp({ etag: '"e1"' }));
    put.mockResolvedValueOnce(resp({ etag: '"e2"' }));
    const { container } = render(
      <DcsForm
        respondenId="r1"
        subskala={dcsSub}
        jawabanAwal={[] as DcsJawabanRead[]}
        sudahSubmit={false}
        accessToken="tok"
        etag={'"e0"'}
      />,
    );
    pilih(container, "d1", 3);
    const simpan = () =>
      act(async () => {
        fireEvent.click(screen.getAllByRole("button", { name: "Simpan" })[0]);
      });
    await simpan();
    await simpan();
    expect(headersDari(put, 0)["If-Match"]).toBe('"e0"');
    expect(headersDari(put, 1)["If-Match"]).toBe('"e1"');
  });
});
