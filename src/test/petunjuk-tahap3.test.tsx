import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PetunjukTahap3 } from "@/app/(auth)/task-inventory/tahap3/[responden_id]/petunjuk-tahap3";

describe("PetunjukTahap3", () => {
  it("defaultOpen=true → dialog + frasa kunci CalHR", () => {
    render(<PetunjukTahap3 defaultOpen={true} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText(/CalHR/).length).toBeGreaterThan(0);
  });

  it("defaultOpen=true → makna nilai VA_TYPE, KONDISI, dan contoh pengisian", () => {
    render(<PetunjukTahap3 defaultOpen={true} />);
    expect(screen.getByText("Contoh Pengisian (ilustrasi)")).toBeInTheDocument();
    expect(screen.getAllByText("VA-Core").length).toBeGreaterThan(0);
    expect(screen.getAllByText("NVA-Residual").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Needs Validation").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Baseline").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/4 pekan periode puncak/).length).toBeGreaterThan(0);
  });

  it("defaultOpen=false → dialog tidak ter-render", () => {
    render(<PetunjukTahap3 defaultOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
