import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@/lib/auth/auth", () => ({ auth: () => authMock() }));
const get = vi.fn();
vi.mock("@/lib/api/client", () => ({ withServerAuth: vi.fn(() => ({ GET: get })) }));

import { withServerAuth } from "@/lib/api/client";
import { WajibGrup } from "@/components/wajib-grup";
import { BannerPrototipe } from "@/components/banner-prototipe";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";

beforeEach(() => {
  authMock.mockReset();
  vi.mocked(withServerAuth).mockClear();
});

describe("WajibGrup", () => {
  it("sesi tanpa grup → 'Tidak berhak', anak tidak dirender, backend tidak dipanggil", async () => {
    authMock.mockResolvedValue({ user: { groups: ["admin"] } });
    render(await WajibGrup({ grup: "tim-kajian", children: <p>RAHASIA</p> }));
    expect(screen.getByText(/Tidak berhak/)).toBeInTheDocument();
    expect(screen.queryByText("RAHASIA")).not.toBeInTheDocument();
    expect(withServerAuth).not.toHaveBeenCalled();
  });
  it("sesi dengan grup → anak dirender", async () => {
    authMock.mockResolvedValue({ user: { groups: ["tim-kajian"] } });
    render(await WajibGrup({ grup: "tim-kajian", children: <p>ISI</p> }));
    expect(screen.getByText("ISI")).toBeInTheDocument();
  });
});

describe("teks tetap", () => {
  it("BannerPrototipe & PeringatanPrivasi", () => {
    render(
      <>
        <BannerPrototipe />
        <PeringatanPrivasi />
      </>,
    );
    expect(
      screen.getByText(
        /^PROTOTIPE — metode Paket Validasi & Prioritas Redesain v1\.3 belum disahkan/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Jangan menulis nama orang, identitas atau kasus murid\/keluarga/),
    ).toBeInTheDocument();
  });
});
