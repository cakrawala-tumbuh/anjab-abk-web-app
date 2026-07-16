import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PetunjukTs } from "@/app/(auth)/time-study/isi/[penugasan_id]/petunjuk-ts";

describe("PetunjukTs", () => {
  it("defaultOpen=true → dialog + frasa kunci Kategori Hari", () => {
    render(<PetunjukTs defaultOpen={true} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText(/Kategori Hari/).length).toBeGreaterThan(0);
  });

  it("defaultOpen=false → dialog tidak ter-render", () => {
    render(<PetunjukTs defaultOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
