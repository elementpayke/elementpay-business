export type CopilotMeResponse = {
  user?: {
    id?: number;
    email?: string;
    email_verified?: boolean;
    kyc_verified?: boolean;
  } | null;
  business?: {
    id?: number;
    name?: string | null;
    legal_name?: string | null;
    country?: string | null;
    status?: string | null;
    kyb_verified?: boolean;
    registration_number?: string | null;
  } | null;
  role?: string | null;
  kyb_summary?: Record<string, unknown> | null;
  wallet_address?: string | null;
};

type ApiEnvelope<T> = {
  status?: "success" | "error";
  data?: T | null;
  message?: string;
};

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function isApiEnvelope(
  value: unknown,
): value is ApiEnvelope<CopilotMeResponse> {
  const record = asRecord(value);
  return Boolean(
    record &&
      ("data" in record || "status" in record || "message" in record),
  );
}

function yesNo(value: boolean | null | undefined): string | null {
  if (value === true) return "yes";
  if (value === false) return "no";
  return null;
}

function formatRegisteredAddress(
  kybSummary: Record<string, unknown> | null | undefined,
): string | null {
  const address = asRecord(kybSummary?.registered_address);
  if (!address) return null;

  const parts = [
    cleanText(address.street),
    cleanText(address.street2),
    cleanText(address.city),
    cleanText(address.state),
    cleanText(address.post_code),
    cleanText(address.country),
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(", ") : null;
}

export function formatAccountContext(me: CopilotMeResponse | null): string | null {
  if (!me) return null;

  const lines = ["Authenticated ElementPay account context:"];
  const userEmail = cleanText(me.user?.email);
  const role = cleanText(me.role);
  const businessName = cleanText(me.business?.name);
  const legalName = cleanText(me.business?.legal_name);
  const country = cleanText(me.business?.country);
  const status = cleanText(me.business?.status);
  const kybVerified = yesNo(me.business?.kyb_verified);
  const kybStatus = cleanText(me.kyb_summary?.kyb_status);
  const registeredAddress = formatRegisteredAddress(me.kyb_summary);
  const walletStatus =
    typeof me.wallet_address === "string" && me.wallet_address.trim()
      ? "available"
      : "not available";

  if (userEmail) lines.push(`- User email: ${userEmail}`);
  if (role) lines.push(`- User role: ${role}`);
  if (businessName) lines.push(`- Business: ${businessName}`);
  if (legalName) lines.push(`- Legal name: ${legalName}`);
  if (country) lines.push(`- Business country: ${country}`);
  if (status) lines.push(`- Business status: ${status}`);
  if (kybVerified) lines.push(`- KYB verified: ${kybVerified}`);
  if (kybStatus) lines.push(`- KYB status: ${kybStatus}`);
  if (registeredAddress) {
    lines.push(`- Registered business address: ${registeredAddress}`);
  }
  lines.push(`- Treasury wallet: ${walletStatus}`);

  return lines.length > 1 ? lines.join("\n") : null;
}

export async function fetchAccountContext(
  authHeader: string,
  apiBase: string,
): Promise<string | null> {
  const base = apiBase.replace(/\/$/, "");
  if (!base || !authHeader.startsWith("Bearer ")) return null;

  try {
    const res = await fetch(`${base}/api/auth/me`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const body = (await res.json().catch(() => null)) as unknown;
    if (!body) return null;
    if (isApiEnvelope(body) && body.status === "error") return null;

    const me: CopilotMeResponse | null = isApiEnvelope(body)
      ? body.data ?? null
      : (body as CopilotMeResponse);
    return formatAccountContext(me);
  } catch {
    return null;
  }
}
