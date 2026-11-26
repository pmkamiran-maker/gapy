import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminCatalog } from "@/components/shop/admin-catalog";
import { DoorCatalog } from "@/components/shop/door-catalog";
import { ShopProvider } from "@/lib/shop-store";

const auth = vi.hoisted(() => ({
  canManage: false,
  from: vi.fn(),
}));

vi.mock("@/lib/use-shop-auth", () => ({
  useCatalogAdmin: () => auth.canManage,
  useShopAuth: () => [
    {
      status: "ready",
      session: { access_token: "test", user: { id: "test-user" } },
      client: { from: auth.from },
      config: {
        url: "https://project.supabase.co",
        key: "sb_publishable_test",
      },
    },
  ],
}));

afterEach(() => {
  auth.canManage = false;
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe("Catalog administration", () => {
  it("hides the editor from a signed-in user without catalog permission", () => {
    const network = vi.fn();
    vi.stubGlobal("fetch", network);
    render(<AdminCatalog />);
    expect(screen.getByRole("alert")).toHaveTextContent("нет доступа");
    expect(
      screen.queryByRole("button", { name: "Добавить позицию" }),
    ).not.toBeInTheDocument();
    expect(network).not.toHaveBeenCalled();
  });

  it("saves a new item and hides it without deleting the saved data", async () => {
    auth.canManage = true;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([])));
    const insert = vi.fn();
    const update = vi.fn();
    auth.from.mockReturnValue({ insert, update });
    let id = "";
    insert.mockImplementation((row: { id: string }) => {
      id = row.id;
      return {
        select: () => ({ single: async () => ({ data: { id }, error: null }) }),
      };
    });
    const mutation = {
      eq: vi.fn().mockImplementation(() => mutation),
      select: () => ({ single: async () => ({ data: { id }, error: null }) }),
    };
    update.mockReturnValue(mutation);
    render(<AdminCatalog />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Добавить позицию" }),
    );
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("Название"), {
      target: { value: "Новая дверь" },
    });
    fireEvent.change(dialog.getByLabelText("Цена, USD"), {
      target: { value: "99.50" },
    });
    fireEvent.change(dialog.getByLabelText("Наличие"), {
      target: { value: "order" },
    });
    fireEvent.change(dialog.getByLabelText("Срок поставки, дней"), {
      target: { value: "14" },
    });
    fireEvent.click(dialog.getByRole("button", { name: "Сохранить" }));
    expect(await screen.findByText("Позиция сохранена.")).toBeInTheDocument();
    expect(insert).toHaveBeenCalledWith({
      id: expect.stringMatching(/^item-/),
      hidden: false,
      patch: {
        name: "Новая дверь",
        detail: "",
        price: 99.5,
        kind: "wood",
        availability: "order",
        leadTimeDays: 14,
      },
    });

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Новая дверь" },
    });
    const row = within(screen.getByRole("row", { name: /Новая дверь/ }));
    fireEvent.click(row.getByRole("button", { name: "Убрать" }));
    expect(await row.findByText("Скрыта")).toBeInTheDocument();
    expect(update).toHaveBeenCalledWith({ hidden: true });
  });

  it("reflects saved edits and additions in the main catalog and omits hidden rows", async () => {
    const changes = [
      {
        id: "p1",
        hidden: false,
        patch: { name: "Обновлённый Fjord", price: 999 },
      },
      { id: "excel-11", hidden: true, patch: {} },
      {
        id: "item-7d0b82a5-7214-4cd2-888d-111111111111",
        hidden: false,
        patch: { name: "Новая дверь", price: 99.5, kind: "wood" },
      },
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(changes)));
    render(
      <ShopProvider liveCatalog>
        <DoorCatalog onProduct={() => {}} />
      </ShopProvider>,
    );
    expect(await screen.findByText("Найдено позиций: 131")).toBeInTheDocument();
    const query = screen.getByRole("searchbox");
    fireEvent.change(query, { target: { value: "Новая дверь" } });
    expect(
      screen.getByRole("heading", { name: "Новая дверь" }),
    ).toBeInTheDocument();
    fireEvent.change(query, { target: { value: "Обновлённый Fjord" } });
    expect(
      screen.getByRole("button", { name: "Обновлённый Fjord" }),
    ).toBeInTheDocument();
    expect(screen.getByText("999 TMT")).toBeInTheDocument();
    fireEvent.change(query, { target: { value: "2040×860×100" } });
    expect(
      screen.queryByRole("button", { name: /Строка Excel 11$/ }),
    ).not.toBeInTheDocument();
  });
  it("shows availability and lead time only on the matching Excel variant", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json([
            {
              id: "excel-175",
              hidden: false,
              patch: { availability: "order", leadTimeDays: 14 },
            },
          ]),
        ),
    );
    render(
      <ShopProvider liveCatalog>
        <DoorCatalog onProduct={() => {}} />
      </ShopProvider>,
    );
    expect(await screen.findByText("Найдено позиций: 131")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Y10" },
    });
    const right = screen.getByRole("button", { name: /Строка Excel 175$/ });
    const left = screen.getByRole("button", { name: /Строка Excel 173$/ });
    expect(
      within(right.closest("article")!).getByText("Под заказ"),
    ).toBeInTheDocument();
    expect(
      within(right.closest("article")!).getByText("Срок поставки: 14 дней"),
    ).toBeInTheDocument();
    expect(
      within(left.closest("article")!).getByText("Уточнить наличие"),
    ).toBeInTheDocument();
    expect(
      within(left.closest("article")!).queryByText(/Срок поставки/),
    ).not.toBeInTheDocument();

    fireEvent.click(right);
    expect(
      within(screen.getByRole("dialog")).getByText("Срок поставки: 14 дней"),
    ).toBeInTheDocument();
  });
});
