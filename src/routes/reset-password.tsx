import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { BRAND_NAME } from "@/lib/catalog";
import { AuthShell } from "@/routes/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, RequiredLegend, fieldProps } from "@/components/ui/form-field";

const MIN_PASSWORD_LENGTH = 8;

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>): { token?: string } => ({
    ...(typeof s.token === "string" ? { token: s.token } : {}),
  }),
  head: () => ({
    meta: [
      { title: `Set a new password — ${BRAND_NAME}` },
      { name: "description", content: `Choose a new password for your ${BRAND_NAME} account.` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"password" | "confirm", string>>>({});

  if (!token) {
    return (
      <AuthShell>
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Link not valid</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This page needs a reset link from your email. The link may have been cut short when it
            was copied.
          </p>
        </div>
        <Button asChild className="mt-8 w-full" size="lg">
          <Link to="/forgot-password">Request a new link</Link>
        </Button>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-primary/15 text-link">
            <CheckCircle2 className="size-7" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Password updated</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You can now sign in with your new password.
          </p>
        </div>
        <Button asChild className="mt-8 w-full" size="lg">
          <Link to="/auth" search={{ mode: "signin" }}>
            Sign in
          </Link>
        </Button>
      </AuthShell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const found: typeof errors = {};
    if (password.length < MIN_PASSWORD_LENGTH) {
      found.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (password !== confirm) {
      found.confirm = "The two passwords don't match.";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.getElementById(`reset-${Object.keys(found)[0]}`)?.focus();
      return;
    }

    setBusy(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        anonymous: true,
        body: JSON.stringify({ token, new_password: password }),
      });
      setDone(true);
      // Drop the token from the address bar so it isn't left in history.
      void navigate({ to: "/reset-password", search: {}, replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a password you haven't used here before.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
        <RequiredLegend />

        <FormField
          id="reset-password"
          label="New password"
          required
          error={errors.password}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          icon={Lock}
        >
          <Input
            {...fieldProps(
              "reset-password",
              errors.password,
              `At least ${MIN_PASSWORD_LENGTH} characters.`,
            )}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-12"
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </FormField>

        <FormField
          id="reset-confirm"
          label="Confirm new password"
          required
          error={errors.confirm}
          icon={Lock}
        >
          <Input
            {...fieldProps("reset-confirm", errors.confirm)}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="pl-10"
          />
        </FormField>

        <Button type="submit" size="lg" className="w-full text-base" disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}
