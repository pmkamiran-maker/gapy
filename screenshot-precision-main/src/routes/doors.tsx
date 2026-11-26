import { createFileRoute } from "@tanstack/react-router";

import { Storefront } from "@/components/shop/storefront";
import {
  DoorCatalog,
  DOOR_CATALOG_TITLE,
} from "@/components/shop/door-catalog";
import { ShopProvider } from "@/lib/shop-store";
import { STORE } from "@/lib/store-config";

export const Route = createFileRoute("/doors")({
  head: () => ({ meta: [{ title: `${DOOR_CATALOG_TITLE} — ${STORE.name}` }] }),
  component: Doors,
});

function Doors() {
  return (
    <ShopProvider>
      <Storefront
        catalog={(openProduct) => <DoorCatalog onProduct={openProduct} />}
      />
    </ShopProvider>
  );
}
