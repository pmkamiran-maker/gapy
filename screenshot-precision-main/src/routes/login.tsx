import { createFileRoute } from "@tanstack/react-router";

import { LOGIN_TITLE, LoginPage } from "@/components/shop/login-page";
import { STORE } from "@/lib/store-config";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: `${LOGIN_TITLE} — ${STORE.name}` }] }),
  component: LoginPage,
});
