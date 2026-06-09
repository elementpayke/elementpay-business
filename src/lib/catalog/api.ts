import { authedFetch } from "@/lib/authedFetch";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// ---- Raw catalog shape (mirrors GET /api/v1/supported/catalog) ----------

/**
 * Receiving (collection) account details for a bank pay-in. The real values
 * now arrive on the accept-quote response (`payment_instructions`) and are
 * rendered on the deposit success step; this shape is the card's display model.
 */
export type ProviderAccountDetails = {
  account_name?: string;
  account_number?: string;
  bank_name?: string;
  branch?: string;
  swift?: string;
  reference?: string;
  instructions?: string;
};

/** A single bank / mobile-money provider inside a payment method. */
export type CatalogProvider = {
  code: string;
  name: string;
  enabled: boolean;
  id: string;
  /** Anticipated — populated by the backend in a future iteration. */
  account_details?: ProviderAccountDetails;
};

/** A payment method group (mobile_money / bank) for a country. */
export type CatalogPaymentMethod = {
  enabled: boolean;
  label: string;
  /** Quote type the backend expects, e.g. "mobile_money" | "bank". */
  quote_type: string;
  providers: CatalogProvider[];
};

/** Offramp-only settlement rails (SEPA/SWIFT/Pix/etc). */
export type CatalogRail = {
  type: string;
  label: string;
  enabled: boolean;
  providers: CatalogProvider[];
};

export type CatalogCountry = {
  country_code: string;
  country_name: string;
  currency: string;
  enabled: boolean;
  payment_methods: {
    mobile_money?: CatalogPaymentMethod;
    bank?: CatalogPaymentMethod;
  };
  /** Present only on offramp countries. */
  rails?: CatalogRail[];
};

export type CatalogDirection = {
  countries: Record<string, CatalogCountry>;
};

export type SupportedCatalog = {
  disclaimer: string;
  onramp: CatalogDirection;
  offramp: CatalogDirection;
};

type CatalogEnvelope = {
  status: string;
  message: string;
  data: SupportedCatalog;
};

export async function fetchSupportedCatalog(): Promise<SupportedCatalog> {
  const res = await authedFetch(`${API_BASE}/api/v1/supported/catalog`);
  if (!res.ok) {
    throw new Error(`Failed to load supported catalog (${res.status})`);
  }
  const body = (await res.json().catch(() => null)) as CatalogEnvelope | null;
  if (!body?.data) {
    throw new Error("Supported catalog response was empty");
  }
  return body.data;
}
