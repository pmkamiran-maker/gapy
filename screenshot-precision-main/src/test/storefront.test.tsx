import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DoorCatalog } from "@/components/shop/door-catalog";
import { Storefront } from "@/components/shop/storefront";
import { ShopLocaleProvider } from "@/lib/shop-locale";
import { ShopProvider } from "@/lib/shop-store";

function renderStorefront() {
  return render(
    <ShopLocaleProvider>
      <ShopProvider>
        <Storefront
          catalog={(openProduct) => <DoorCatalog onProduct={openProduct} />}
        />
      </ShopProvider>
    </ShopLocaleProvider>,
  );
}

describe("Storefront", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it("filters the catalog and persists the selected variant and quantity", () => {
    const { unmount } = renderStorefront();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Найдено позиций: 131",
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Источник товаров" }),
      {
        target: { value: "demo" },
      },
    );
    expect(screen.getByRole("status")).toHaveTextContent("Найдено позиций: 31");
    fireEvent.change(
      screen.getByRole("combobox", { name: "Категории каталога" }),
      {
        target: { value: "interior" },
      },
    );
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Fjord 01" },
    });
    expect(screen.getByRole("status")).toHaveTextContent("Найдено позиций: 1");
    expect(screen.getByText(/Демо · Nordwood/)).toBeInTheDocument();
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
    expect(screen.getByRole("status")).toHaveTextContent("Items found: 1");
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
      screen.getByRole("heading", { name: "Gapy we furnitura katalogy" }),
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

  it.each([
    {
      locale: "ru",
      cart: "Корзина",
      checkout: "Оформить заявку",
      name: "Имя",
      phone: "Телефон",
      fulfillment: "Получение",
      address: "Адрес доставки",
      measure: "Нужен замер",
      submit: "Отправить заявку",
      result: "Тестовая заявка проверена",
    },
    {
      locale: "tk",
      cart: "Sebet",
      checkout: "Sargyt haýyşyny doldur",
      name: "Ady",
      phone: "Telefon belgisi",
      fulfillment: "Almagyň usuly",
      address: "Eltip beriljek salgy",
      measure: "Ölçeg almak gerek",
      submit: "Haýyşy iber",
      result: "Synag haýyşy barlandy",
    },
    {
      locale: "en",
      cart: "Cart",
      checkout: "Request an order",
      name: "Name",
      phone: "Phone",
      fulfillment: "Fulfillment",
      address: "Delivery address",
      measure: "I need a measurement",
      submit: "Send request",
      result: "Test request validated",
    },
  ])("completes a demo pickup request in $locale", async (labels) => {
    localStorage.setItem("portal-language", labels.locale);
    localStorage.setItem(
      "portal-shop-v1",
      JSON.stringify({
        cart: [
          {
            key: "p1|Кремовый|800x2000",
            id: "p1",
            color: "Кремовый",
            size: "800x2000",
            qty: 2,
          },
        ],
      }),
    );
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_input, options) => {
        if (options?.method !== "POST")
          return Response.json({ available: true, demo: true });
        const body = JSON.parse(String(options.body));
        return Response.json({ id: body.id, demo: true });
      });
    vi.stubGlobal("fetch", fetchMock);

    renderStorefront();
    fireEvent.click(screen.getByRole("button", { name: labels.cart }));
    const dialog = within(screen.getByRole("dialog", { name: labels.cart }));
    fireEvent.click(dialog.getByRole("button", { name: labels.checkout }));
    expect(
      dialog.getByRole("textbox", { name: labels.address }),
    ).toBeRequired();
    fireEvent.change(
      dialog.getByRole("combobox", { name: labels.fulfillment }),
      { target: { value: "pickup" } },
    );
    expect(dialog.queryByRole("textbox", { name: labels.address })).toBeNull();
    fireEvent.change(dialog.getByRole("textbox", { name: labels.name }), {
      target: { value: "Test Customer" },
    });
    fireEvent.change(dialog.getByRole("textbox", { name: labels.phone }), {
      target: { value: "+993 00 000000" },
    });
    fireEvent.click(dialog.getByRole("checkbox", { name: labels.measure }));
    const submit = dialog.getByRole("button", { name: labels.submit });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);
    expect(await dialog.findByText(labels.result)).toBeInTheDocument();
    const [, options] = fetchMock.mock.calls[1] ?? [];
    expect(JSON.parse(String(options?.body))).toMatchObject({
      locale: labels.locale,
      contact: { fulfillment: "pickup", measure: true },
      items: [{ id: "p1", qty: 2, color: "Кремовый", size: "800x2000" }],
    });
  });
});
