import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PetunjukWcp } from "@/app/(auth)/wcp/isi/[responden_id]/petunjuk-wcp";

describe("PetunjukWcp", () => {
  it("defaultOpen=true → dialog + frasa kunci Workplace Climate Profile", () => {
    render(<PetunjukWcp defaultOpen={true} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText(/Workplace Climate Profile/).length).toBeGreaterThan(0);
  });

  it("defaultOpen=false → dialog tidak ter-render", () => {
    render(<PetunjukWcp defaultOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
