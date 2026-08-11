/**
 * Boot-time environment check.
 *
 * The storefront talks to the FastAPI service for everything — catalogue, auth,
 * orders. If that base URL is wrong, every page renders but nothing loads, and
 * the only clue is a wall of failed requests in the browser. Say so at startup.
 */

const DEFAULT_API_BASE = "http://localhost:8000/api/v1";
const BANNER = "─".repeat(72);

export function verifyServerEnv(): void {
  const apiBase = process.env.VITE_API_BASE_URL;

  if (!apiBase) {
    console.warn(
      `\n${BANNER}\n[env] VITE_API_BASE_URL is not set — falling back to:\n\n  ${DEFAULT_API_BASE}\n\n` +
        `That is correct for local development with the API running on port 8000.\n` +
        `Set it explicitly for any deployed environment (see .env.example).\n${BANNER}\n`,
    );
    return;
  }

  try {
    new URL(apiBase);
  } catch {
    throw new Error(
      `[env] VITE_API_BASE_URL is not a valid URL: ${JSON.stringify(apiBase)}. ` +
        `Expected something like ${DEFAULT_API_BASE}`,
    );
  }
}
