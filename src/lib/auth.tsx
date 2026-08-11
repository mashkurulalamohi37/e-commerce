import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  apiFetch,
  getAuthToken,
  isTokenExpired,
  onAuthChange,
  setAuthToken,
} from "@/lib/api-client";

export type AuthUser = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
};

type AuthCtx = {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (input: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
  }) => Promise<void>;
  signOut: () => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

type TokenResponse = { access_token: string; token_type: string; user: AuthUser };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token || isTokenExpired(token)) {
      // Don't send a token we already know is dead.
      if (token) setAuthToken(null);
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await apiFetch<AuthUser>("/auth/me"));
    } catch {
      // apiFetch clears the token on a 401; anything else means the API is down,
      // and either way we have no verified identity to show.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
    return onAuthChange(() => {
      void loadUser();
    });
  }, [loadUser]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    // The OAuth2 token endpoint takes form encoding, and names the field `username`.
    const result = await apiFetch<TokenResponse>("/auth/login", {
      method: "POST",
      anonymous: true,
      form: { username: email.trim(), password },
    });
    setAuthToken(result.access_token);
    setUser(result.user);
    return result.user;
  }, []);

  const signUp = useCallback(
    async (input: { email: string; password: string; fullName?: string; phone?: string }) => {
      const result = await apiFetch<TokenResponse>("/auth/register", {
        method: "POST",
        anonymous: true,
        body: JSON.stringify({
          email: input.email.trim(),
          password: input.password,
          full_name: input.fullName?.trim() || null,
          phone: input.phone?.trim() || null,
        }),
      });
      setAuthToken(result.access_token);
      setUser(result.user);
    },
    [],
  );

  const signOut = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        isAdmin: user?.role === "admin",
        loading,
        signIn,
        signUp,
        signOut,
        refresh: loadUser,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
