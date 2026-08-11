import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // h-11: 36px was below the 44px touch minimum, and auth/checkout were
          // overriding it per page, so field height changed between screens.
          "flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground",
          // A 1px ring with no offset was near-invisible against the field border.
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Lets a field render its own error state instead of relying on a toast.
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-destructive",
          "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
