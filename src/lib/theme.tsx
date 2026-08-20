import { createContext, useContext, useEffect, type ReactNode } from "react";

export type Theme = "light";

const STORAGE_KEY = "nillsmart_theme";

/**
 * Runs before first paint, inlined in the document head.
 * Ensures the document element is always in light mode.
 */
export const themeInitScript = `
(function(){
  try {
    localStorage.removeItem("${STORAGE_KEY}");
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  } catch (e) {}
})();
`;

type ThemeCtx = {
  theme: "light";
  resolved: "light";
  setTheme: (t?: unknown) => void;
};

const Ctx = createContext<ThemeCtx>({
  theme: "light",
  resolved: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }, []);

  return (
    <Ctx.Provider value={{ theme: "light", resolved: "light", setTheme: () => {} }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  return useContext(Ctx);
}
