import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WcpInstrumenRead } from "@/lib/api/schema";

// ── Mock router & API client ────────────────────────────────────────────────
const refresh = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push }),
}));

const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ POST: post }),
}));

import { AksiInstrumen } from "@/app/(auth)/wcp/aksi-instrumen";

const instrumenClosed: WcpInstrumenRead = {
  id: "wcp",
  status: "CLOSED",
  min_responden: 3,
  catatan: null,
} as unknown as WcpInstrumenRead;

beforeEach(() => {
  refresh.mockReset();
  push.mockReset();
  post.mockReset();
  post.mockResolvedValue({ error: null, response: { headers: { get: () => "req-1" } } });
  vi.spyOn(window, "confirm");
});

describe("AksiInstrumen (WCP) — konfirmasi sebelum Jalankan Analisis", () => {
  it("Cancel tidak memanggil POST maupun push sama sekali", () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    render(<AksiInstrumen instrumen={instrumenClosed} jumlahSubmit={3} accessToken="tok" />);

    fireEvent.click(screen.getByRole("button", { name: /Jalankan Analisis/ }));

    expect(post).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("OK melanjutkan alur: POST ke endpoint analisis lalu push ke halaman hasil", async () => {
    vi.mocked(window.confirm).mockReturnValue(true);
    render(<AksiInstrumen instrumen={instrumenClosed} jumlahSubmit={3} accessToken="tok" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Jalankan Analisis/ }));
    });

    await waitFor(() => expect(post).toHaveBeenCalledWith("/api/v1/wcp/analisis", {}));
    expect(push).toHaveBeenCalledWith("/wcp/hasil");
  });
});
