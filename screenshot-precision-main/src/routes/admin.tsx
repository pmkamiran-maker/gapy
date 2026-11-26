import { createFileRoute } from "@tanstack/react-router";

import { AdminCatalog, ADMIN_TITLE } from "@/components/shop/admin-catalog";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: ADMIN_TITLE }, { name: "robots", content: "noindex" }],
  }),
  component: AdminCatalog,
});
