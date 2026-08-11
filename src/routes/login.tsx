import { createFileRoute, redirect } from "@tanstack/react-router";

/** OTP login was a prototype — email auth lives at /auth. */
export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    throw redirect({ to: "/auth", search: { mode: "signin" } });
  },
});
