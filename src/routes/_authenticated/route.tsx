import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { hasValidSession } from "@/lib/api-client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: ({ location }) => {
    // Checks the token the sign-in flow actually issues, and that it hasn't
    // expired. This is a UI convenience only — every protected endpoint
    // re-verifies the token and the admin role server-side.
    if (!hasValidSession()) {
      throw redirect({ to: "/auth", search: { mode: "signin", next: location.href } });
    }
  },
  component: () => <Outlet />,
});
