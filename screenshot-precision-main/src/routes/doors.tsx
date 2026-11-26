import { createFileRoute } from "@tanstack/react-router";

import {
  WorkbookCatalog,
  WORKBOOK_TITLE,
} from "@/components/shop/workbook-catalog";
import { STORE } from "@/lib/store-config";

export const Route = createFileRoute("/doors")({
  head: () => ({ meta: [{ title: `${WORKBOOK_TITLE} — ${STORE.name}` }] }),
  component: WorkbookCatalog,
});
