const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export interface BusinessSignupSchema {
  business_name: string;
  email: string;
  password: string;
  country?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface LoginSchema {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface SignupBusinessResult {
  business_id: number;
  owner_user_id: number;
  verification_required: boolean;
}

// Derived from JWT claims since the new backend has no /auth/me yet.
export interface UserResponse {
  id: number;
  email: string;
  business_id?: number;
  role?: string;
}

interface ApiResponse<T> {
  status: "success" | "error";
  message: string;
  data?: T | null;
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson
    ? await res.json().catch(() => null)
    : null;

  if (!res.ok) {
    const message =
      (body && typeof body.message === "string" && body.message) ||
      (body && body.data?.errors?.[0]?.msg) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  if (!body) {
    throw new Error("Expected JSON response from " + (res.url || "server"));
  }

  // New backend wraps everything in { status, message, data }
  const envelope = body as ApiResponse<T>;
  if (envelope.status === "error") {
    throw new Error(envelope.message || "Request failed");
  }
  return (envelope.data ?? body) as T;
}

// ---- JWT decode (claims only — verification happens server-side) -------

interface JwtClaims {
  sub?: string | number;
  email?: string;
  biz?: number;
  role?: string;
  exp?: number;
  [key: string]: unknown;
}

function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = typeof window === "undefined"
      ? Buffer.from(padded, "base64").toString("utf-8")
      : atob(padded);
    return JSON.parse(decoded) as JwtClaims;
  } catch {
    return null;
  }
}

export function getCurrentUser(): UserResponse | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  const claims = decodeJwt(token);
  if (!claims?.sub) return null;
  return {
    id: typeof claims.sub === "string" ? parseInt(claims.sub, 10) : claims.sub,
    email: claims.email || "",
    business_id: claims.biz,
    role: claims.role,
  };
}

// ---- Auth endpoints ----------------------------------------------------

export async function registerBusiness(data: BusinessSignupSchema): Promise<SignupBusinessResult> {
  const res = await fetch(`${API_BASE}/api/auth/businesses/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<SignupBusinessResult>(res);
}

export async function login(data: LoginSchema): Promise<Token> {
  const res = await fetch(`${API_BASE}/api/auth/businesses/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<Token>(res);
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", result.access_token);
    localStorage.setItem("refresh_token", result.refresh_token);
  }
  return result;
}

export async function requestPasswordReset(email: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/api/auth/password/forgot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse<{ ok: boolean }>(res);
}

export async function confirmPasswordReset(
  email: string,
  token: string,
  new_password: string,
): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/api/auth/password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token, new_password }),
  });
  return handleResponse<{ ok: boolean }>(res);
}

export async function changePassword(
  current_password: string,
  new_password: string,
): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/api/auth/password/update`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ current_password, new_password }),
  });
  return handleResponse<{ ok: boolean }>(res);
}

export async function verifyEmail(email: string, verification_code: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, verification_code }),
  });
  return handleResponse<{ ok: boolean }>(res);
}

export async function resendVerification(email: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse<{ ok: boolean }>(res);
}

export async function refreshToken(): Promise<Token> {
  const refresh = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
  if (!refresh) throw new Error("No refresh token");
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  const result = await handleResponse<Token>(res);
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", result.access_token);
    localStorage.setItem("refresh_token", result.refresh_token);
  }
  return result;
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("access_token");
}
