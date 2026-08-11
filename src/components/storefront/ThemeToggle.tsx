import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme, type Theme } from "@/lib/theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/**
 * Three-state so "follow my OS" stays available — a two-way toggle silently
 * opts the user out of their system setting the first time they touch it.
 */
export function ThemeToggle() {
  const { theme, resolved, setTheme } = useTheme();
  const Icon = resolved === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Theme: ${theme}. Change theme`}
        className="grid size-11 shrink-0 place-items-center rounded-md text-foreground/80 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Icon className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {OPTIONS.map(({ value, label, icon: OptionIcon }) => (
          <DropdownMenuItem
            key={value}
            onSelect={() => setTheme(value)}
            className={theme === value ? "font-semibold text-link" : undefined}
          >
            <OptionIcon className="mr-2 size-4" />
            {label}
            {theme === value && <span className="sr-only"> (selected)</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
