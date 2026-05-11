const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// ---- Enums (string literal unions) -----------------------------------

export type BusinessType =
  | "SoleTrader"
  | "LimitedCompany"
  | "Partnership"
  | "NonProfit"
  | "Other";

export type EstimatedEmployees =
  | "1-10"
  | "11-50"
  | "51-200"
  | "201-1000"
  | "1000+";

export type AnnualRevenueRange =
  | "LessThan100k"
  | "100kTo1M"
  | "1MTo10M"
  | "MoreThan10M";

export type SourceOfFunds =
  | "Revenue"
  | "Investment"
  | "Loans"
  | "Grants"
  | "Other";

export type EstimatedMonthlyTurnover =
  | "UpTo100k"
  | "100kTo1M"
  | "1MTo10M"
  | "MoreThan10M";

export type EstimatedTransactionValue =
  | "UpTo50k"
  | "50kTo500k"
  | "500kTo5M"
  | "MoreThan5M";

export type MonthlyTransactionFrequency =
  | "UpTo20"
  | "20To100"
  | "100To500"
  | "MoreThan500";

export type AssociateRelationship =
  | "UBO"
  | "Director"
  | "Representative"
  | "Shareholder"
  | "Other";

export type IdType =
  | "Passport"
  | "NationalId"
  | "DriversLicense"
  | "ResidencePermit"
  | "Other";

// ---- Payload types ---------------------------------------------------

export interface Address {
  street: string;
  street2?: string | null;
  city: string;
  post_code: string;
  state?: string | null;
  country: string;
}

export interface FullName {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
}

export interface Identity {
  issuing_country: string;
  id_type: IdType;
  id_number: string;
  issued_date?: string | null;
  expiry_date?: string | null;
}

export interface UboInfo {
  ownership_percentage: number;
}

export interface Associate {
  id?: string;
  relationship_types: AssociateRelationship[];
  full_name: FullName;
  date_of_birth: string;
  email: string;
  phone_number: string;
  tax_residence_country: string;
  residential_address: Address;
  identities: Identity[];
  ubo?: UboInfo | null;
}

export interface KybProfilePayload {
  legal_name?: string;
  registration_number?: string;
  country?: string;
  tax_id?: string;
  registered_address?: Address;
  business_type?: BusinessType;
  industry?: string;
  website?: string;
  estimated_employees?: EstimatedEmployees;
  annual_revenue_range?: AnnualRevenueRange;
  source_of_funds?: SourceOfFunds;
  incorporation_date?: string;
  ownership_type?: string;
  estimated_monthly_turnover?: EstimatedMonthlyTurnover;
  estimated_transaction_value?: EstimatedTransactionValue;
  monthly_transaction_frequency?: MonthlyTransactionFrequency;
  associates?: Associate[];
}

export interface KybProfileResponse extends KybProfilePayload {
  business_id: number;
  created_at?: string;
  updated_at?: string;
}

// ---- Shared envelope handling (mirrors src/lib/auth.ts) --------------

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
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (body && typeof body.message === "string" && body.message) ||
      (body && body.data?.errors?.[0]?.msg) ||
      `Request failed (${res.status})`;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  if (!body) {
    throw new Error("Expected JSON response from " + (res.url || "server"));
  }

  const envelope = body as ApiResponse<T>;
  if (envelope.status === "error") {
    throw new Error(envelope.message || "Request failed");
  }
  return (envelope.data ?? body) as T;
}

// ---- Endpoints -------------------------------------------------------

export async function createKybProfile(
  business_id: number,
  payload: KybProfilePayload,
): Promise<KybProfileResponse> {
  const res = await fetch(`${API_BASE}/api/businesses/${business_id}/kyb/profile`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<KybProfileResponse>(res);
}

export async function updateKybProfile(
  business_id: number,
  payload: KybProfilePayload,
): Promise<KybProfileResponse> {
  const res = await fetch(`${API_BASE}/api/businesses/${business_id}/kyb/profile`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<KybProfileResponse>(res);
}

export async function getKybProfile(business_id: number): Promise<KybProfileResponse> {
  const res = await fetch(`${API_BASE}/api/businesses/${business_id}/kyb/profile`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<KybProfileResponse>(res);
}

// Convenience: create, falling back to PATCH if a profile already exists (409).
export async function upsertKybProfile(
  business_id: number,
  payload: KybProfilePayload,
): Promise<KybProfileResponse> {
  try {
    return await createKybProfile(business_id, payload);
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 409) {
      return updateKybProfile(business_id, payload);
    }
    throw err;
  }
}
