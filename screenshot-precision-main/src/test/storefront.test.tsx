import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { Storefront } from "@/components/shop/storefront";
import { ShopProvider } from "@/lib/shop-store";

function renderStorefront() {
  return render(
    <ShopProvider>
      <Storefront />
    </ShopProvider>,
  );
}

describe("Storefront", () => {
  beforeEach(() => localStorage.clear());

  it("filters the catalog and persists the selected variant and quantity", () => {
    const { unmount } = renderStorefront();

    fireEvent.click(screen.getByRole("button", { name: "Межкомнатные двери" }));
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Fjord 01" },
    });
    expect(screen.getByRole("status")).toHaveTextContent("Найдено товаров: 1");
    fireEvent.click(
      screen.getByRole("button", { name: "Fjord 01 эмаль белая" }),
    );

    const product = screen.getByRole("dialog");
    fireEvent.click(within(product).getByRole("radio", { name: "Кремовый" }));
    fireEvent.change(
      within(product).getByRole("combobox", { name: "Размер, мм" }),
      {
        target: { value: "800x2000" },
      },
    );
    fireEvent.click(within(product).getByRole("button", { name: "В корзину" }));

    fireEvent.click(screen.getByRole("button", { name: "Корзина" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Увеличить количество" }),
    );
    unmount();

    renderStorefront();
    fireEvent.click(screen.getByRole("button", { name: "Корзина" }));
    const cart = screen.getByRole("dialog", { name: "Корзина" });
    expect(cart).toHaveTextContent("Кремовый · 800 × 2000");
    expect(within(cart).getByRole("status")).toHaveTextContent("2");
    expect(cart).toHaveTextContent("Бесплатно");
    expect(cart).toHaveTextContent(/Итого\s*5\s780 TMT/);
  });

  it("opens a saved product and adds it to comparison", () => {
    renderStorefront();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Fjord 01" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Избранное: Fjord 01 эмаль белая" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Избранное" }));

    const favorites = screen.getByRole("dialog", { name: "Избранное" });
    fireEvent.click(
      within(favorites).getByRole("button", { name: "Fjord 01 эмаль белая" }),
    );
    const product = screen.getByRole("dialog", {
      name: "Fjord 01 эмаль белая",
    });
    fireEvent.click(
      within(product).getByRole("button", { name: "Добавить к сравнению" }),
    );
    fireEvent.keyDown(product, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: "Сравнение" }));
    const compare = screen.getByRole("dialog", { name: "Сравнение товаров" });
    expect(within(compare).getByRole("table")).toHaveTextContent(
      "Fjord 01 эмаль белая",
    );
    expect(
      within(compare).getByRole("rowheader", { name: "Материал" }),
    ).toBeInTheDocument();
  });
});
