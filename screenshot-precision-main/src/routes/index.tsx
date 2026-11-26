import { shopMetadata } from "@/lib/shop-locale";
import { createFileRoute } from "@tanstack/react-router";

import { Storefront } from "@/components/shop/storefront";
import { ShopProvider } from "@/lib/shop-store";

const title = "Портал — двери и фурнитура в Ашхабаде";
const description =
  "Межкомнатные и входные двери, ручки и комплектующие. Подберите модель, сравните варианты и рассчитайте стоимость комплекта.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ShopProvider>
      <Storefront />
    </ShopProvider>
  );
}
