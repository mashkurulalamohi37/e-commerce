import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, ShoppingBag, UserRound } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { BRAND_NAME } from "@/lib/catalog";
import { BrandLogo } from "@/components/storefront/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, RequiredLegend, fieldProps } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";

const MIN_PASSWORD_LENGTH = 8;

/** Only same-origin paths — `//evil.com` is a protocol-relative URL, not a path. */
function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string; mode?: string } => ({
    ...(typeof s.next === "string" ? { next: s.next } : {}),
    ...(s.mode === "signup" || s.mode === "signin" ? { mode: s.mode } : {}),
  }),
  head: () => ({
    meta: [
      { title: `Sign in or create an account — ${BRAND_NAME}` },
      {
        name: "description",
        content: `Sign in or create a ${BRAND_NAME} account to track orders, save your bag and checkout faster.`,
      },
      { property: "og:title", content: `Account — ${BRAND_NAME}` },
      { property: "og:description", content: "Access your orders, saved bag and account tools." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const redirectTo = safeNext(search.next);
  const { user, loading, isAdmin, signIn, signUp, signOut } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(
    search.mode === "signup" ? "signup" : "signin",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"email" | "password" | "confirm", string>>>(
    {},
  );

  if (loading) {
    return (
      <AuthShell>
        <p className="py-8 text-center text-sm text-muted-foreground">Checking your session…</p>
      </AuthShell>
    );
  }

  if (user) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-primary/15 text-link">
            <UserRound className="size-7" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">You're signed in</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          {isAdmin && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
              <ShieldCheck className="size-3.5 text-link" />
              Administrator
            </p>
          )}
        </div>
        <div className="mt-8 space-y-2">
          {redirectTo && (
            <Button className="w-full" size="lg" onClick={() => navigate({ to: redirectTo })}>
              Continue
            </Button>
          )}
          {isAdmin && (
            <Button
              className="w-full"
              size="lg"
              variant={redirectTo ? "secondary" : "default"}
              onClick={() => navigate({ to: "/admin" })}
            >
              Open admin dashboard
            </Button>
          )}
          <Button
            className="w-full"
            size="lg"
            variant="outline"
            onClick={() => navigate({ to: "/" })}
          >
            Continue shopping
          </Button>
          <Button variant="ghost" className="w-full" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </AuthShell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const found: typeof errors = {};
    if (!email.trim()) {
      found.email = "Enter your email address.";
    } else if (!email.includes("@")) {
      found.email = "That doesn't look like an email address.";
    }
    if (!password) {
      found.password = "Enter your password.";
    } else if (mode === "signup" && password.length < MIN_PASSWORD_LENGTH) {
      found.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (mode === "signup" && password !== confirm) {
      found.confirm = "The two passwords don't match.";
    }

    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.getElementById(`auth-${Object.keys(found)[0]}`)?.focus();
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp({ email, password, fullName: name, phone });
        toast.success("Account created. Welcome!");
        navigate({ to: redirectTo ?? "/" });
      } else {
        const authUser = await signIn(email, password);
        toast.success("Welcome back!");
        if (redirectTo) {
          navigate({ to: redirectTo });
        } else if (authUser?.role === "admin") {
          navigate({ to: "/admin" });
        } else {
          navigate({ to: "/" });
        }
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin"
            ? `Sign in to track orders and checkout faster at ${BRAND_NAME}.`
            : `Join ${BRAND_NAME} for deals, order tracking and a faster checkout.`}
        </p>
      </div>

      {/* These were role="tab" without aria-controls, a tabpanel or roving
          focus — a half-declared widget reads worse than two plain buttons.
          aria-pressed describes what they actually do. */}
      <div className="mt-6 grid grid-cols-2 rounded-full bg-muted p-1">
        {(["signin", "signup"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            className={cn(
              "min-h-10 rounded-full px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              mode === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => {
              setMode(value);
              setErrors({});
            }}
          >
            {value === "signin" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>

      <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
        {mode === "signup" && <RequiredLegend />}

        {mode === "signup" && (
          <>
            <FormField id="auth-name" label="Full name" icon={UserRound}>
              <Input
                id="auth-name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
              />
            </FormField>
            <FormField
              id="auth-phone"
              label="Mobile number"
              icon={Phone}
              hint="Optional — we use it for delivery updates."
            >
              <Input
                {...fieldProps(
                  "auth-phone",
                  undefined,
                  "Optional — we use it for delivery updates.",
                )}
                inputMode="tel"
                autoComplete="tel"
                placeholder="01712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
              />
            </FormField>
          </>
        )}

        <FormField id="auth-email" label="Email" required error={errors.email} icon={Mail}>
          <Input
            {...fieldProps("auth-email", errors.email)}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
          />
        </FormField>

        <FormField
          id="auth-password"
          label="Password"
          required
          error={errors.password}
          hint={mode === "signup" ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
          icon={Lock}
        >
          <Input
            {...fieldProps(
              "auth-password",
              errors.password,
              mode === "signup" ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined,
            )}
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
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

        {mode === "signup" && (
          <FormField
            id="auth-confirm"
            label="Confirm password"
            required
            error={errors.confirm}
            icon={Lock}
          >
            <Input
              {...fieldProps("auth-confirm", errors.confirm)}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="pl-10"
            />
          </FormField>
        )}

        {mode === "signin" && (
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-link underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
        )}

        <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={busy}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {mode === "signin" ? "New to " : "Already have an account? "}
        {mode === "signin" && `${BRAND_NAME}? `}
        <button
          type="button"
          className="font-semibold text-link underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>

      <div className="mt-6 flex items-start gap-2 rounded-xl bg-secondary/70 px-3 py-3 text-xs text-muted-foreground">
        <ShoppingBag className="mt-0.5 size-4 shrink-0 text-link" />
        <p>
          After signing in you can track orders, save your bag across devices, and check out more
          quickly.
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link to="/" className="underline-offset-4 hover:underline">
          Back to shopping
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[70vh] overflow-hidden px-4 py-10 sm:py-14">
      {/* Was two hardcoded light oklch values, which stayed pale in dark mode.
          Driven off theme tokens now so it follows both. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--accent),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_var(--secondary),_transparent_50%)]"
      />
      <div className="relative mx-auto w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <BrandLogo imgClassName="h-16 sm:h-20" />
        </div>
        <div className="rounded-2xl border border-border/80 bg-background/90 p-6 shadow-[0_12px_40px_oklch(0.32_0.07_270/0.08)] backdrop-blur sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
