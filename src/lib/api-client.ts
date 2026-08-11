const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const TOKEN_KEY = "access_token";

/** Broadcast so the auth context can react to a token changing or expiring. */
const AUTH_EVENT = "nillsmart:auth-changed";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function onAuthChange(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AUTH_EVENT, handler);
  // Keep tabs in sync when the token changes in another one.
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(AUTH_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/** JWTs are not encrypted; reading `exp` locally avoids a round-trip on every guard. */
export function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split(".");
    if (!payload) return true;
    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: number;
    };
    if (typeof claims.exp !== "number") return true;
    return claims.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function hasValidSession(): boolean {
  const token = getAuthToken();
  return Boolean(token) && !isTokenExpired(token!);
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | null;
  /** Send as application/x-www-form-urlencoded (the OAuth2 token endpoint wants this). */
  form?: Record<string, string>;
  /** Skip the Authorization header even when a token is present. */
  anonymous?: boolean;
};

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { form, anonymous, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = { ...(extraHeaders as Record<string, string>) };
  let body = rest.body;

  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(form).toString();
  } else if (body instanceof FormData) {
    // The browser must set multipart/form-data itself so it can add the
    // boundary; setting it by hand produces an unparseable request.
    delete headers["Content-Type"];
  } else if (body != null && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (!anonymous) {
    const token = getAuthToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, { ...rest, body, headers });
  } catch {
    // fetch only rejects on a transport failure — surface something a customer
    // can act on instead of "Failed to fetch".
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0);
  }

  if (response.status === 401 && !anonymous) {
    // The token is gone or expired; drop it so the UI stops claiming a session.
    setAuthToken(null);
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** FastAPI returns `detail` as a string, or as a list of objects for 422s. */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      detail?: unknown;
      message?: unknown;
    };
    const { detail } = data;

    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
      const parts = detail
        .map((entry) => {
          if (typeof entry !== "object" || entry === null) return null;
          const { loc, msg } = entry as { loc?: unknown[]; msg?: unknown };
          const field = Array.isArray(loc) ? loc.filter((l) => l !== "body").join(".") : "";
          return field ? `${field}: ${String(msg)}` : String(msg);
        })
        .filter(Boolean);
      if (parts.length) return parts.join("; ");
    }

    if (typeof data.message === "string") return data.message;
  } catch {
    /* fall through to the status-based message */
  }
  return `Request failed (${response.status})`;
}
