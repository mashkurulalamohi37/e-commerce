import { type ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Label + control + inline error, wired together.
 *
 * Every form on the site used to report errors through a transient toast: not
 * attached to the field, not announced, gone on a timer. This renders the error
 * under the control with `role="alert"`, and hands back the `aria-*` props the
 * control needs so screen readers get the same information sighted users do.
 *
 * Required fields are marked here rather than per-form, so the convention can't
 * drift between screens.
 */
export function FormField({
  id,
  label,
  error,
  hint,
  required,
  icon: Icon,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  /** Optional leading glyph; the control needs its own left padding. */
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="flex items-center gap-1">
        {label}
        {required && (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        )}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        {children}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Spread onto the control so the error is announced and the field is marked invalid. */
export function fieldProps(id: string, error?: string, hint?: string) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}

/** Legend for forms that mark required fields, so the asterisk is explained. */
export function RequiredLegend() {
  return (
    <p className="text-xs text-muted-foreground">
      Fields marked <span className="text-destructive">*</span> are required.
    </p>
  );
}
