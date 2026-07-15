import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PetunjukDcs } from "@/app/(auth)/dcs/isi/[responden_id]/petunjuk-dcs";

describe("PetunjukDcs", () => {
  it("defaultOpen=false → modal tidak ter-render saat mount", () => {
    render(<PetunjukDcs defaultOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("defaultOpen=true → modal ter-render saat mount", () => {
    render(<PetunjukDcs defaultOpen={true} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("klik tombol Petunjuk Pengisian → modal muncul", () => {
    render(<PetunjukDcs defaultOpen={false} />);
    fireEvent.click(screen.getByRole("button", { name: /Petunjuk Pengisian/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("klik X → modal tertutup", () => {
    render(<PetunjukDcs defaultOpen={true} />);
    fireEvent.click(screen.getByRole("button", { name: "Tutup" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it('klik "Saya Mengerti, Mulai Mengisi" → modal tertutup', () => {
    render(<PetunjukDcs defaultOpen={true} />);
    fireEvent.click(screen.getByRole("button", { name: /Saya Mengerti, Mulai Mengisi/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("klik backdrop → modal tertutup", () => {
    render(<PetunjukDcs defaultOpen={true} />);
    const dialog = screen.getByRole("dialog");
    const backdrop = dialog.parentElement as HTMLElement;
    fireEvent.click(backdrop);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("memuat konten kunci: pengantar, skala, dan contoh", () => {
    render(<PetunjukDcs defaultOpen={true} />);
    expect(screen.getAllByText(/tidak ada jawaban benar atau salah/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Sangat Tidak Setuju/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Contoh/i).length).toBeGreaterThan(0);
  });
});
