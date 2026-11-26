import { createFileRoute } from "@tanstack/react-router";

import { LoginPage, REGISTER_TITLE } from "@/components/shop/login-page";
import { STORE } from "@/lib/store-config";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: `${REGISTER_TITLE} — ${STORE.name}` }] }),
  component: Registration,
});

function Registration() {
  return <LoginPage registration />;
}
