import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "nillsmart_theme";

/**
 * Runs before first paint, inlined in the document head.
 *
 * Without this the server renders light, then the client corrects to dark after
 * hydration — a white flash on every navigation for dark-mode users. Kept as a
 * string so it can be injected as-is; it must stay dependency-free and small.
 */
export const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem("${STORAGE_KEY}");
    var dark = stored === "dark" ||
      ((!stored || stored === "system") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

type ThemeCtx = {
  /** What the user chose — "system" means follow the OS. */
  theme: Theme;
  /** What is actually on screen once "system" is resolved. */
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

function systemPrefersDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readStored(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
  } catch {
    return "system";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start on "system" so server and client render the same markup; the real
  // preference is read after mount. The init script has already applied the
  // class, so nothing flashes while this settles.
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = readStored();
    setThemeState(stored);
  }, []);

  useEffect(() => {
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && systemPrefersDark());
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
      setResolved(dark ? "dark" : "light");
    };
    apply();

    // Follow the OS live while the user is on "system".
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* private mode — the choice just won't persist */
    }
  };

  return <Ctx.Provider value={{ theme, resolved, setTheme }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
