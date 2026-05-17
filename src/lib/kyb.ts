import { authedFetch } from "@/lib/authedFetch";

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
  | "UpTo10k"
  | "UpTo50k"
  | "UpTo100k"
  | "UpTo500k"
  | "Over500k";

export type EstimatedTransactionValue =
  | "UpTo10k"
  | "UpTo50k"
  | "UpTo100k"
  | "UpTo500k"
  | "Over500k";

export type MonthlyTransactionFrequency =
  | "UpTo5"
  | "UpTo20"
  | "UpTo50"
  | "UpTo200"
  | "Over200";

export type AssociateRelationship =
  | "UBO"
  | "Director"
  | "Representative"
  | "Shareholder";

export type IdType =
  | "Passport"
  | "NationalIDCard"
  | "DrivingLicense"
  | "ResidencePermit";

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
  const res = await authedFetch(`${API_BASE}/api/businesses/${business_id}/kyb/profile`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return handleResponse<KybProfileResponse>(res);
}

export async function updateKybProfile(
  business_id: number,
  payload: KybProfilePayload,
): Promise<KybProfileResponse> {
  const res = await authedFetch(`${API_BASE}/api/businesses/${business_id}/kyb/profile`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return handleResponse<KybProfileResponse>(res);
}

// GET /businesses/{id}/kyb returns { profile: KybProfileOut | null }. There is
// no separate GET /kyb/profile route — this is the canonical read endpoint.
export interface KybSummary {
  profile: KybProfileResponse | null;
}

export async function getKybSummary(
  business_id: number,
): Promise<KybSummary> {
  const res = await authedFetch(`${API_BASE}/api/businesses/${business_id}/kyb`, {
    method: "GET",
  });
  return handleResponse<KybSummary>(res);
}

// True when the backend has a KYB profile on file. The summary shape is fixed:
// data.profile is null when no profile exists, otherwise the full KybProfileOut.
export function kybSummaryHasProfile(summary: KybSummary | null): boolean {
  return summary?.profile != null;
}

function isAlreadyExistsError(err: Error & { status?: number }): boolean {
  if (err.status === 409) return true;
  // Backend currently returns 400 with a message like
  // "A KYB profile already exists for this business. Use PATCH ... to update it."
  // instead of 409, so match on the message body as a fallback.
  const msg = err.message.toLowerCase();
  return msg.includes("already exists") && msg.includes("kyb profile");
}

// Convenience: create, falling back to PATCH if a profile already exists.
export async function upsertKybProfile(
  business_id: number,
  payload: KybProfilePayload,
): Promise<KybProfileResponse> {
  try {
    return await createKybProfile(business_id, payload);
  } catch (e) {
    const err = e as Error & { status?: number };
    if (isAlreadyExistsError(err)) {
      return updateKybProfile(business_id, payload);
    }
    throw err;
  }
}

export interface BusinessAddressOut extends Address {
  id: number;
  is_current: boolean;
}

export async function setKybAddress(
  business_id: number,
  address: Address,
): Promise<BusinessAddressOut> {
  const res = await authedFetch(`${API_BASE}/api/businesses/${business_id}/kyb/address`, {
    method: "PUT",
    body: JSON.stringify(address),
  });
  return handleResponse<BusinessAddressOut>(res);
}

export interface KybInitiateResponse {
  hosted_url: string;
  kyb_status: string;
}

export async function initiateKyb(business_id: number): Promise<KybInitiateResponse> {
  const res = await authedFetch(`${API_BASE}/api/businesses/${business_id}/kyb/initiate`, {
    method: "POST",
  });
  return handleResponse<KybInitiateResponse>(res);
}

// Source: app/models/enums.py::KybStatus. "pending" means no profile yet.
export type KybStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "rejected"
  | "expired";

export interface KybStatusResponse {
  kyb_status: KybStatus;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewer_notes?: string | null;
}

export async function getKybStatus(business_id: number): Promise<KybStatusResponse> {
  const res = await authedFetch(`${API_BASE}/api/businesses/${business_id}/kyb/status`, {
    method: "GET",
  });
  return handleResponse<KybStatusResponse>(res);
}
