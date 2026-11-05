import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const post = vi.fn();
vi.mock("@/lib/api/client", () => ({ withServerAuth: () => ({ POST: post }) }));

import { SaklarPanel } from "@/app/(auth)/sistem/ai/saklar-panel";
import type { SaklarAiRead } from "@/lib/api/schema";

const saklar = (o: Partial<SaklarAiRead> = {}): SaklarAiRead => ({
  layanan: "AI_NARRATIVE_DRAFT",
  flag_aktif: true,
  dimatikan: false,
  boleh_jalan: true,
  alasan: null,
  aktor: null,
  pada: null,
  ...o,
});

function ok(data: unknown) {
  return { data, response: { status: 200, headers: { get: () => "r1" } } };
}
function gagal(status: number, code: string, message: string) {
  return {
    data: undefined,
    error: { error: code, message },
    response: { status, headers: { get: () => "r2" } },
  };
}

beforeEach(() => {
  post.mockReset();
  refresh.mockReset();
});

function isi(alasan: string) {
  fireEvent.change(screen.getByLabelText(/Alasan/), { target: { value: alasan } });
}

describe("SaklarPanel", () => {
  it("matikan mengirim alasan + Idempotency-Key", async () => {
    post.mockResolvedValue(ok(saklar({ dimatikan: true })));
    render(<SaklarPanel saklar={saklar()} accessToken="tok" />);
    isi("Insiden keluaran");
    fireEvent.click(screen.getByRole("button", { name: "Matikan" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [path, opsi] = post.mock.calls[0];
    expect(path).toBe("/api/v1/system/ai/saklar/matikan");
    expect(opsi.body).toEqual({ alasan: "Insiden keluaran" });
    expect(opsi.headers["Idempotency-Key"]).toMatch(/^[0-9a-f-]{36}$/);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("hidupkan mengirim alasan + Idempotency-Key ke rute hidupkan", async () => {
    post.mockResolvedValue(ok(saklar()));
    render(
      <SaklarPanel saklar={saklar({ dimatikan: true, boleh_jalan: false })} accessToken="t" />,
    );
    isi("Insiden selesai");
    fireEvent.click(screen.getByRole("button", { name: "Hidupkan" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][0]).toBe("/api/v1/system/ai/saklar/hidupkan");
    expect(post.mock.calls[0][1].body).toEqual({ alasan: "Insiden selesai" });
    expect(post.mock.calls[0][1].headers["Idempotency-Key"]).toBeTruthy();
  });

  it("alasan pendek tidak terkirim", () => {
    render(<SaklarPanel saklar={saklar()} accessToken="tok" />);
    isi("abc");
    fireEvent.click(screen.getByRole("button", { name: "Matikan" }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("minimal 5");
  });

  it("409 aksi berulang tampil sebagai pesan dan tidak refresh", async () => {
    post.mockResolvedValue(gagal(409, "layanan_sudah_dimatikan", "Layanan sudah dimatikan."));
    render(<SaklarPanel saklar={saklar({ dimatikan: true })} accessToken="tok" />);
    isi("Insiden lagi");
    fireEvent.click(screen.getByRole("button", { name: "Matikan" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Layanan sudah dimatikan."),
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it("flag_aktif=false menampilkan keterangan; hidupkan tidak disebut menyalakan AI", () => {
    render(
      <SaklarPanel saklar={saklar({ flag_aktif: false, boleh_jalan: false })} accessToken="t" />,
    );
    expect(screen.getByRole("note")).toHaveTextContent("AI tetap tidak berjalan");
    expect(screen.getByRole("button", { name: "Hidupkan" })).toBeInTheDocument();
    expect(screen.queryByText(/menyalakan AI/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /nyala/i })).not.toBeInTheDocument();
  });

  it("flag aktif: tidak ada keterangan flag mati", () => {
    render(<SaklarPanel saklar={saklar()} accessToken="t" />);
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });
});
