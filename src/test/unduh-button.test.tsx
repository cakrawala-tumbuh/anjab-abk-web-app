import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnduhButton } from "@/app/(auth)/backup/unduh-button";

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("UnduhButton", () => {
  it("memanggil proxy /api/backup/unduh dan mengunci tombol selama proses berjalan", async () => {
    let resolveFetch: (value: Response) => void = () => {};
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchSpy = vi.fn().mockReturnValue(fetchPromise);
    vi.stubGlobal("fetch", fetchSpy);
    URL.createObjectURL = vi.fn().mockReturnValue("blob:mock");
    URL.revokeObjectURL = vi.fn();
    // jsdom mencoba navigasi sungguhan saat <a href="blob:..."> diklik — dicegah
    // agar test tidak bergantung pada implementasi navigasi jsdom yang tidak lengkap.
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<UnduhButton />);
    const button = screen.getByRole("button", { name: /Unduh Cadangan/ });

    fireEvent.click(button);

    // Selama request berjalan, tombol terkunci dan indikator proses tampil.
    await waitFor(() => expect(button).toBeDisabled());
    expect(screen.getByRole("button", { name: /Mengunduh…/ })).toBeInTheDocument();

    await act(async () => {
      resolveFetch(
        new Response(new Blob(["dump"]), {
          status: 200,
          headers: {
            "content-type": "application/octet-stream",
            "content-disposition": 'attachment; filename="backup.dump"',
          },
        }),
      );
      await fetchPromise;
    });

    expect(fetchSpy).toHaveBeenCalledWith("/api/backup/unduh", { method: "POST" });
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  it("menampilkan pesan error dari body JSON saat proxy membalas gagal", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "forbidden", message: "Bukan admin." }), {
        status: 403,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    render(<UnduhButton />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Unduh Cadangan/ }));
    });

    expect(await screen.findByText("Bukan admin.")).toBeInTheDocument();
  });
});
