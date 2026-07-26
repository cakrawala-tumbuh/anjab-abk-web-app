import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PetunjukTahap3 } from "@/app/(auth)/task-inventory/tahap3/[responden_id]/petunjuk-tahap3";

describe("PetunjukTahap3", () => {
  it("defaultOpen=true → dialog + frasa kunci CalHR", () => {
    render(<PetunjukTahap3 defaultOpen={true} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText(/CalHR/).length).toBeGreaterThan(0);
  });

  it("defaultOpen=true → penjelasan keempat isian (label Bahasa Indonesia) dan contoh pengisian", () => {
    render(<PetunjukTahap3 defaultOpen={true} />);
    expect(screen.getByText("Arti Keempat Isian")).toBeInTheDocument();
    expect(screen.getByText("Contoh Pengisian (ilustrasi)")).toBeInTheDocument();
    expect(screen.getAllByText(/Formal \(tertulis di jobdesk\/regulasi\)/).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText(/Rutin \(hari biasa\)/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Puncak \(masa sibuk tertentu\)/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Insidental \(sewaktu-waktu/)).toBeInTheDocument();
  });

  it("field yang sudah dicabut/dijadikan kondisional (Jam/minggu, Jam peak, VA Type) TIDAK dijelaskan di sini (issue #41)", () => {
    render(<PetunjukTahap3 defaultOpen={true} />);
    expect(screen.queryByText(/Jam\/minggu/)).toBeNull();
    expect(screen.queryByText(/Jam peak/)).toBeNull();
    expect(screen.queryByText(/VA Type/)).toBeNull();
    expect(screen.queryByText(/Jenis Nilai Tambah/)).toBeNull();
    expect(screen.queryByText("Context-Dependent")).toBeNull();
    expect(screen.queryByText("Needs Validation")).toBeNull();
  });

  it("defaultOpen=false → dialog tidak ter-render", () => {
    render(<PetunjukTahap3 defaultOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
