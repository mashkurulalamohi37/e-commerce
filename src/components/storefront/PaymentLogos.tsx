import React from "react";

export function BkashLogo({ className = "h-6 w-auto object-contain" }: { className?: string }) {
  return (
    <img
      src="/bkash.png?v=2"
      alt="bKash"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}

export function NagadLogo({ className = "h-6 w-auto object-contain" }: { className?: string }) {
  return (
    <img
      src="/nagad.png?v=2"
      alt="Nagad"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}


