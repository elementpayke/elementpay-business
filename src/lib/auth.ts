const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export interface UserCreate {
  email: string;
  password: string;
  role?: "user" | "admin";
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

export interface UserResponse {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  kyc_verified: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ConnectWalletSchema {
  address: string;
  chain?: string;
}

export interface WalletResponse {
  wallet_id: number;
  address: string;
  wallet_type: string;
  chain: string;
  is_primary: boolean;
  label: string | null;
  status: string;
  created_at: string;
}

export interface ApiError {
  detail: string | { msg: string; type: string }[];
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
  if (!res.ok) {
    const body = isJson
      ? await res.json().catch(() => ({ detail: "An unexpected error occurred" }))
      : { detail: `Request failed (${res.status})` };
    const message =
      typeof body.detail === "string"
        ? body.detail
        : Array.isArray(body.detail)
          ? body.detail.map((d: { msg: string }) => d.msg).join(", ")
          : body.message || "Request failed";
    throw new Error(message);
  }
  if (!isJson) {
    throw new Error("Expected JSON response but got " + (res.headers.get("content-type") || "unknown"));
  }
  return res.json();
}

export async function register(data: UserCreate): Promise<UserResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<UserResponse>(res);
}

export async function login(data: LoginSchema): Promise<Token> {
  const res = await fetch(`${API_BASE}/auth/login`, {
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

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/password/reset/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

export async function confirmPasswordReset(
  email: string,
  reset_code: string,
  new_password: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/password/reset/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, reset_code, new_password }),
  });
  return handleResponse(res);
}

export async function changePassword(
  current_password: string,
  new_password: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/password/change`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ current_password, new_password }),
  });
  return handleResponse(res);
}

export async function verifyEmail(email: string, verification_code: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, verification_code }),
  });
  return handleResponse(res);
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, verification_code: "" }),
  });
  return handleResponse(res);
}

export async function getMe(): Promise<UserResponse> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<UserResponse>(res);
}

export async function refreshToken(): Promise<Token> {
  const refresh = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
  if (!refresh) throw new Error("No refresh token");
  const res = await fetch(`${API_BASE}/auth/token/refresh`, {
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

export async function connectWallet(data: ConnectWalletSchema): Promise<WalletResponse> {
  const res = await fetch(`${API_BASE}/auth/connect-wallet`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<{ data: WalletResponse }>(res);
  return result.data;
}

export async function getWallets(): Promise<WalletResponse[]> {
  const res = await fetch(`${API_BASE}/auth/wallets`, {
    headers: getAuthHeaders(),
  });
  const result = await handleResponse<{ data: WalletResponse[] }>(res);
  return result.data;
}

export interface PrivyTokenResponse {
  token: string;
  token_type?: string;
}

// Privy requires RS256-signed JWTs (it verifies them via JWKS). Our normal
// session tokens are HS256, so we exchange them for an RS256 JWT here. The
// returned token is what `useSubscribeToJwtAuthWithFlag` feeds to Privy so
// the user is silently logged in without ever seeing the Privy modal.
export async function getPrivyToken(): Promise<PrivyTokenResponse> {
  const res = await fetch(`${API_BASE}/auth/privy/token`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  return handleResponse<PrivyTokenResponse>(res);
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
