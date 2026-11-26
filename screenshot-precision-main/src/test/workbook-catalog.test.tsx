import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkbookCatalog } from "@/components/shop/workbook-catalog";
import { workbookDoors } from "@/data/workbook-doors";

describe("Workbook door catalog", () => {
  it("keeps all source positions once and retains both conflicting widths", () => {
    const variants = workbookDoors.flatMap((door) => door.variants);
    expect(workbookDoors).toHaveLength(42);
    expect(variants).toHaveLength(100);
    expect(new Set(variants.map(({ row }) => row)).size).toBe(100);
    const conflicts = variants
      .filter(
        ({ namedWidth, width }) =>
          namedWidth !== undefined && namedWidth !== width,
      )
      .map(({ row, namedWidth, width }) => [row, namedWidth, width]);
    expect(conflicts).toEqual([
      [175, 1200, 860],
      [187, 1200, 960],
    ]);
  });

  it("filters the catalog and shows both USD columns for each variant", () => {
    render(<WorkbookCatalog />);
    fireEvent.change(
      screen.getByRole("combobox", { name: "Категории каталога" }),
      {
        target: { value: "steel" },
      },
    );
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Y10" },
    });
    expect(screen.getByRole("status")).toHaveTextContent("Найдено товаров: 2");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Размеры и цены для Y10 · Полуторная (в тон)",
      }),
    );
    const table = within(screen.getByRole("table"));
    expect(
      table.getByRole("columnheader", { name: "45% · USD" }),
    ).toBeInTheDocument();
    expect(
      table.getByRole("columnheader", { name: "50% · USD" }),
    ).toBeInTheDocument();
    const mismatched = within(
      table.getByRole("rowheader", { name: "175" }).closest("tr")!,
    );
    expect(mismatched.getByText("860 × 2050")).toBeInTheDocument();
    expect(mismatched.getByText("Ширина расходится")).toBeInTheDocument();
    expect(mismatched.getByText("239,42")).toBeInTheDocument();
    expect(mismatched.getByText("247,68")).toBeInTheDocument();
  });
});
