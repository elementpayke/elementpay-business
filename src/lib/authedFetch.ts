const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  const refresh = getRefreshToken();
  if (!refresh) return null;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) return null;
      const body = await res.json().catch(() => null);
      const tokens = body?.data ?? body;
      if (!tokens?.access_token || !tokens?.refresh_token) return null;
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
      return tokens.access_token as string;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function withAuth(headers: HeadersInit | undefined, token: string | null): HeadersInit {
  const base = new Headers(headers ?? {});
  if (!base.has("Content-Type")) {
    base.set("Content-Type", "application/json");
  }
  if (token) {
    base.set("Authorization", `Bearer ${token}`);
  } else {
    base.delete("Authorization");
  }
  return base;
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  clearTokens();
  const path = window.location.pathname + window.location.search;
  const isAuthRoute = window.location.pathname.startsWith("/auth/");
  if (isAuthRoute) return;
  const next = encodeURIComponent(path);
  window.location.replace(`/auth/login?next=${next}`);
}

function safeParseBody(body: BodyInit | null | undefined): unknown {
  if (!body || typeof body !== "string") return undefined;
  try {
    return JSON.parse(body);
  } catch {
    return body.length > 200 ? `${body.slice(0, 200)}…` : body;
  }
}

function logRequest(method: string, url: string, body?: BodyInit | null) {
  const parsed = safeParseBody(body);
  if (parsed !== undefined) {
    console.log(`[api] → ${method} ${url}`, parsed);
  } else {
    console.log(`[api] → ${method} ${url}`);
  }
}

function logResponse(method: string, url: string, status: number, retried = false) {
  const tag = retried ? "[api retry]" : "[api]";
  const fn = status >= 400 ? console.error : console.log;
  fn(`${tag} ← ${method} ${url} ${status}`);
}

export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const token = getAccessToken();
  logRequest(method, input, init.body);
  const firstRes = await fetch(input, { ...init, headers: withAuth(init.headers, token) });
  logResponse(method, input, firstRes.status);
  if (firstRes.status !== 401) return firstRes;

  console.warn(`[api] 401 on ${method} ${input} — attempting refresh`);
  const newToken = await refreshAccessToken();
  if (!newToken) {
    console.error(`[api] refresh failed — redirecting to login`);
    redirectToLogin();
    return firstRes;
  }

  logRequest(method, input, init.body);
  const retryRes = await fetch(input, { ...init, headers: withAuth(init.headers, newToken) });
  logResponse(method, input, retryRes.status, true);
  return retryRes;
}
