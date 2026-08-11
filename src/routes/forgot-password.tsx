import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { BRAND_NAME } from "@/lib/catalog";
import { AuthShell } from "@/routes/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, fieldProps } from "@/components/ui/form-field";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: `Reset your password — ${BRAND_NAME}` },
      {
        name: "description",
        content: `Request a password reset link for your ${BRAND_NAME} account.`,
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes("@")) {
      setError("Enter the email address you signed up with.");
      document.getElementById("forgot-email")?.focus();
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        anonymous: true,
        body: JSON.stringify({ email: email.trim() }),
      });
      // The API deliberately answers the same way for unknown addresses, so the
      // confirmation here must not imply the account exists either.
      setSent(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-primary/15 text-link">
            <MailCheck className="size-7" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Check your inbox</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            If <span className="font-medium text-foreground">{email.trim()}</span> is registered
            with us, a reset link is on its way. It expires in 30 minutes.
          </p>
        </div>
        <div className="mt-8 space-y-2">
          <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
            Use a different email
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link to="/auth" search={{ mode: "signin" }}>
              Back to sign in
            </Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the email you signed up with and we'll send you a link to set a new password.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
        <FormField id="forgot-email" label="Email" required error={error} icon={Mail}>
          <Input
            {...fieldProps("forgot-email", error)}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
          />
        </FormField>
        <Button type="submit" size="lg" className="w-full text-base" disabled={busy}>
          {busy ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          to="/auth"
          search={{ mode: "signin" }}
          className="font-semibold text-link underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
