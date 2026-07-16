import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PetunjukTahap1 } from "@/app/(auth)/task-inventory/tahap1/[responden_id]/petunjuk-tahap1";

describe("PetunjukTahap1", () => {
  it("defaultOpen=true → dialog + frasa kunci Uraian Tugas", () => {
    render(<PetunjukTahap1 defaultOpen={true} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText(/Uraian Tugas/).length).toBeGreaterThan(0);
  });

  it("defaultOpen=false → dialog tidak ter-render", () => {
    render(<PetunjukTahap1 defaultOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
