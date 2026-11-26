import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { Storefront } from "@/components/shop/storefront";
import { ShopLocaleProvider } from "@/lib/shop-locale";
import { ShopProvider } from "@/lib/shop-store";

function renderStorefront() {
  return render(
    <ShopLocaleProvider>
      <ShopProvider>
        <Storefront />
      </ShopProvider>
    </ShopLocaleProvider>,
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

  it("switches all three languages and keeps the same cart variant", () => {
    const { unmount } = renderStorefront();
    fireEvent.change(screen.getByRole("combobox", { name: "Язык" }), {
      target: { value: "en" },
    });
    expect(document.documentElement.lang).toBe("en");

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "white enamel" },
    });
    expect(screen.getByRole("status")).toHaveTextContent("Products found: 1");
    fireEvent.click(
      screen.getByRole("button", { name: "Fjord 01 white enamel" }),
    );
    const product = screen.getByRole("dialog", {
      name: "Fjord 01 white enamel",
    });
    fireEvent.click(within(product).getByRole("radio", { name: "Cream" }));
    fireEvent.click(
      within(product).getByRole("button", { name: "Add to cart" }),
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Language" }), {
      target: { value: "tk" },
    });
    expect(document.documentElement.lang).toBe("tk");
    expect(
      screen.getByRole("heading", { name: "Öýüňiz üçin gapylar" }),
    ).toBeInTheDocument();
    unmount();

    renderStorefront();
    expect(screen.getByRole("combobox", { name: "Til" })).toHaveValue("tk");
    fireEvent.click(screen.getByRole("button", { name: "Sebet" }));
    const cart = screen.getByRole("dialog", { name: "Sebet" });
    expect(cart).toHaveTextContent("Fjord 01 ak emal");
    expect(cart).toHaveTextContent("Krem reňk");
    fireEvent.click(within(cart).getByRole("button", { name: "Ýap" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Til" }), {
      target: { value: "ru" },
    });
    expect(document.documentElement.lang).toBe("ru");
    fireEvent.click(screen.getByRole("button", { name: "Корзина" }));
    expect(screen.getByRole("dialog", { name: "Корзина" })).toHaveTextContent(
      "Кремовый",
    );
  });
});
