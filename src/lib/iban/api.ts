import { authedFetch } from "@/lib/authedFetch";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// ---- Raw IBAN account shape (mirrors GET /api/v1/iban/accounts) ----------

/**
 * A single virtual IBAN account provisioned for the business. Funds pushed to
 * the IBAN settle on-chain to `destination_wallet` as `destination_asset` on
 * `destination_network`. `bank_address` is a loosely-typed object on the API
 * (freeform key/value lines), so we keep it permissive here.
 */
export type IbanAccount = {
  currency: string;
  status: string;
  account_holder_name: string;
  iban: string;
  bic: string;
  bank_name: string;
  bank_address?: Record<string, unknown> | null;
  reference?: string | null;
  destination_wallet?: string | null;
  destination_asset?: string | null;
  destination_network?: string | null;
  instructions?: string | null;
  last_updated_at?: string | null;
};

type IbanAccountsEnvelope = {
  status: string;
  message: string;
  data: {
    accounts?: IbanAccount[];
  } | null;
};

export async function fetchIbanAccounts(): Promise<IbanAccount[]> {
  const res = await authedFetch(`${API_BASE}/api/v1/iban/accounts`);
  if (!res.ok) {
    throw new Error(`Failed to load IBAN accounts (${res.status})`);
  }
  const body = (await res.json().catch(() => null)) as IbanAccountsEnvelope | null;
  return body?.data?.accounts ?? [];
}

/**
 * Best-effort flatten of the freeform `bank_address` object into readable
 * "Label: value" lines. The API ships it as an open map, so we walk it
 * defensively and only surface primitive (string/number) leaves.
 */
export function flattenBankAddress(
  address: Record<string, unknown> | null | undefined,
): string[] {
  if (!address || typeof address !== "object") return [];
  const lines: string[] = [];
  for (const value of Object.values(address)) {
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      if (text) lines.push(text);
    } else if (value && typeof value === "object") {
      for (const nested of Object.values(value as Record<string, unknown>)) {
        if (typeof nested === "string" || typeof nested === "number") {
          const text = String(nested).trim();
          if (text) lines.push(text);
        }
      }
    }
  }
  return lines;
}
