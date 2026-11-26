import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DoorCatalog } from "@/components/shop/door-catalog";
import { ShopProvider } from "@/lib/shop-store";
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

  it("filters the catalog and shows only the 50% USD price for each variant", () => {
    render(
      <ShopProvider>
        <DoorCatalog onProduct={() => {}} />
      </ShopProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Найдено позиций: 131",
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Источник товаров" }),
      {
        target: { value: "priceList" },
      },
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Найдено позиций: 100",
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Категории каталога" }),
      {
        target: { value: "steel" },
      },
    );
    expect(screen.getByRole("status")).toHaveTextContent("Найдено позиций: 78");
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Y10" },
    });
    expect(screen.getByRole("status")).toHaveTextContent("Найдено позиций: 4");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Размеры и цены для Y10 · Полуторная (в тон) · Строка Excel 175",
      }),
    );
    const table = within(screen.getByRole("table"));
    expect(
      table.queryByRole("rowheader", { name: "173" }),
    ).not.toBeInTheDocument();
    expect(
      table.queryByRole("columnheader", { name: "45% · USD" }),
    ).not.toBeInTheDocument();
    expect(
      table.getByRole("columnheader", { name: "50% · USD" }),
    ).toBeInTheDocument();
    const mismatched = within(
      table.getByRole("rowheader", { name: "175" }).closest("tr")!,
    );
    expect(mismatched.getByText("860 × 2050")).toBeInTheDocument();
    expect(mismatched.getByText("Ширина расходится")).toBeInTheDocument();
    expect(mismatched.queryByText("239,42")).not.toBeInTheDocument();
    expect(mismatched.getByText("247,68")).toBeInTheDocument();
  });
});
