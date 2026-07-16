import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PetunjukTahap2 } from "@/app/(auth)/task-inventory/tahap2/[sesi_id]/petunjuk-tahap2";

describe("PetunjukTahap2", () => {
  it("defaultOpen=true → dialog + frasa kunci unanimous/partial", () => {
    render(<PetunjukTahap2 defaultOpen={true} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText(/unanimous|partial/i).length).toBeGreaterThan(0);
  });

  it("defaultOpen=false → dialog tidak ter-render", () => {
    render(<PetunjukTahap2 defaultOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
