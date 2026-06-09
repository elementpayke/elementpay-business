import type { MeBusiness } from "@/lib/auth";
import type {
  Address as KybAddress,
  Associate as KybAssociate,
  KybProfileResponse,
} from "@/lib/kyb";
import {
  emptyAddress,
  emptyBusinessDetails,
  emptyStakeholder,
  normalizeBusinessType,
  type AnnualRevenueRange,
  type AssociateRelationshipType,
  type BasicInfoProfile,
  type BusinessAddress,
  type BusinessDetails,
  type EstimatedEmployees,
  type EstimatedMonthlyTurnover,
  type EstimatedTransactionValue,
  type IdType,
  type MonthlyTransactionFrequency,
  type OnboardingState,
  type OwnershipType,
  type SourceOfFunds,
  type Stakeholder,
  type StakeholderIdentity,
} from "@/lib/onboarding/types";

function normalizeIso(value: string | null | undefined): string {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

function mapAddress(
  source: KybAddress | undefined | null,
  fallbackCountry: string,
): BusinessAddress {
  if (!source) {
    return { ...emptyAddress(), countryCode: fallbackCountry };
  }
  return {
    line1: source.street ?? "",
    city: source.city ?? "",
    state: source.state ?? "",
    postalCode: source.post_code ?? "",
    countryCode: source.country ?? fallbackCountry,
  };
}

const VALID_ROLES: ReadonlyArray<AssociateRelationshipType> = [
  "UBO",
  "Representative",
  "Director",
  "Shareholder",
];

function mapRelationships(
  roles: string[] | undefined,
): AssociateRelationshipType[] {
  if (!roles || roles.length === 0) return ["Director"];
  const filtered = roles.filter((r): r is AssociateRelationshipType =>
    (VALID_ROLES as readonly string[]).includes(r),
  );
  return filtered.length > 0 ? filtered : ["Director"];
}

const VALID_ID_TYPES: ReadonlyArray<IdType> = [
  "Passport",
  "NationalIDCard",
  "DrivingLicense",
  "ResidencePermit",
];

function mapIdentity(
  identities: KybAssociate["identities"] | undefined,
  fallbackCountry: string,
): StakeholderIdentity {
  const first = identities?.[0];
  if (!first) {
    return {
      idType: "NationalIDCard",
      idNumber: "",
      issuingCountryCode: fallbackCountry,
    };
  }
  return {
    idType: (VALID_ID_TYPES as readonly string[]).includes(first.id_type)
      ? (first.id_type as IdType)
      : "NationalIDCard",
    idNumber: first.id_number ?? "",
    issuingCountryCode: first.issuing_country ?? fallbackCountry,
  };
}

function mapStakeholder(a: KybAssociate, fallbackCountry: string): Stakeholder {
  const base = emptyStakeholder();
  const taxCountry = a.tax_residence_country ?? fallbackCountry;
  return {
    id: a.id ?? base.id,
    firstName: a.full_name?.first_name ?? "",
    lastName: a.full_name?.last_name ?? "",
    relationshipTypes: mapRelationships(a.relationship_types),
    dateOfBirth: normalizeIso(a.date_of_birth),
    email: a.email ?? "",
    phoneNumber: a.phone_number ?? "",
    taxResidenceCountryCode: taxCountry,
    residentialAddress: mapAddress(a.residential_address, taxCountry),
    identity: mapIdentity(a.identities, taxCountry),
  };
}

function asEnum<T extends string>(
  value: unknown,
  allowed: ReadonlyArray<T>,
): T | "" {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : "";
}

const EMPLOYEE_OPTS: ReadonlyArray<EstimatedEmployees> = [
  "1-10", "11-50", "51-200", "201-1000", "1000+",
];
const REVENUE_OPTS: ReadonlyArray<AnnualRevenueRange> = [
  "LessThan100k", "100kTo1M", "1MTo10M", "MoreThan10M",
];
const FUNDS_OPTS: ReadonlyArray<SourceOfFunds> = [
  "Revenue", "Investment", "Loans", "Grants", "Other",
];
const OWNERSHIP_OPTS: ReadonlyArray<OwnershipType> = [
  "Private", "Public", "Government", "NonProfit",
];
const TURNOVER_OPTS: ReadonlyArray<EstimatedMonthlyTurnover> = [
  "UpTo10k", "UpTo50k", "UpTo100k", "UpTo500k", "Over500k",
];
const TXN_VALUE_OPTS: ReadonlyArray<EstimatedTransactionValue> = [
  "UpTo10k", "UpTo50k", "UpTo100k", "UpTo500k", "Over500k",
];
const TXN_FREQ_OPTS: ReadonlyArray<MonthlyTransactionFrequency> = [
  "UpTo5", "UpTo20", "UpTo50", "UpTo200", "Over200",
];

// Build the form-shaped BusinessDetails from a server KybProfileResponse,
// using the MeBusiness record (which carries trade name) as a fallback when
// kyb_summary fields are missing. The form's "Company name" prefers
// business.name from /auth/me over kyb_summary.legal_name.
export function profileToBusinessDetails(
  profile: KybProfileResponse,
  business?: MeBusiness | null,
): BusinessDetails {
  const defaults = emptyBusinessDetails();
  const country =
    profile.country ?? business?.country ?? defaults.registrationCountryCode;
  const address = mapAddress(profile.registered_address, country);
  const stakeholders =
    profile.associates && profile.associates.length > 0
      ? profile.associates.map((a) => mapStakeholder(a, country))
      : defaults.stakeholders;

  const tradeName = business?.name?.trim();
  const legalName = tradeName || profile.legal_name?.trim() || "";

  return {
    legalName,
    entityType: normalizeBusinessType(profile.business_type ?? ""),
    registrationCountryCode: country,
    incorporationDate: normalizeIso(profile.incorporation_date),
    websiteUrl: profile.website ?? "",
    industry: profile.industry ?? "",
    estimatedEmployees: asEnum(profile.estimated_employees, EMPLOYEE_OPTS),
    annualRevenueRange: asEnum(profile.annual_revenue_range, REVENUE_OPTS),
    sourceOfFunds: asEnum(profile.source_of_funds, FUNDS_OPTS),
    ownershipType: asEnum(profile.ownership_type, OWNERSHIP_OPTS),
    estimatedMonthlyTurnover: asEnum(
      profile.estimated_monthly_turnover,
      TURNOVER_OPTS,
    ),
    estimatedTransactionValue: asEnum(
      profile.estimated_transaction_value,
      TXN_VALUE_OPTS,
    ),
    monthlyTransactionFrequency: asEnum(
      profile.monthly_transaction_frequency,
      TXN_FREQ_OPTS,
    ),
    address,
    stakeholders,
  };
}

// The KYB profile doesn't store the signed-in user's personal info directly,
// but the first associate (owner) carries name/DOB/phone we can lift back into
// BasicInfoProfile when the local draft is missing it.
export function profileToBasicInfo(
  profile: KybProfileResponse,
): BasicInfoProfile | null {
  const owner = profile.associates?.[0];
  if (!owner) return null;
  return {
    firstName: owner.full_name?.first_name ?? "",
    lastName: owner.full_name?.last_name ?? "",
    // The form stores the country *name*; we only have ISO-2 here. Leave
    // blank so the form falls back to its default rather than mis-displaying.
    country: "",
    countryCode: owner.tax_residence_country ?? "",
    phoneNumber: owner.phone_number ?? "",
    dateOfBirth: normalizeIso(owner.date_of_birth),
  };
}

// Field-level merge: server value wins when non-empty, otherwise local value.
function pickNonEmpty<T extends string>(server: T, local: T): T {
  return server && server.trim() !== "" ? server : local;
}

function mergeAddress(
  server: BusinessAddress,
  local: BusinessAddress,
): BusinessAddress {
  return {
    line1: pickNonEmpty(server.line1, local.line1),
    city: pickNonEmpty(server.city, local.city),
    state: pickNonEmpty(server.state, local.state),
    postalCode: pickNonEmpty(server.postalCode, local.postalCode),
    countryCode: pickNonEmpty(server.countryCode, local.countryCode),
  };
}

export function mergeBusinessDetails(
  server: BusinessDetails,
  local: BusinessDetails | null,
): BusinessDetails {
  if (!local) return server;
  return {
    legalName: pickNonEmpty(server.legalName, local.legalName),
    entityType: server.entityType || local.entityType,
    registrationCountryCode: pickNonEmpty(
      server.registrationCountryCode,
      local.registrationCountryCode,
    ),
    incorporationDate: pickNonEmpty(server.incorporationDate, local.incorporationDate),
    websiteUrl: pickNonEmpty(server.websiteUrl, local.websiteUrl),
    industry: pickNonEmpty(server.industry, local.industry),
    estimatedEmployees: server.estimatedEmployees || local.estimatedEmployees,
    annualRevenueRange: server.annualRevenueRange || local.annualRevenueRange,
    sourceOfFunds: server.sourceOfFunds || local.sourceOfFunds,
    ownershipType: server.ownershipType || local.ownershipType,
    estimatedMonthlyTurnover:
      server.estimatedMonthlyTurnover || local.estimatedMonthlyTurnover,
    estimatedTransactionValue:
      server.estimatedTransactionValue || local.estimatedTransactionValue,
    monthlyTransactionFrequency:
      server.monthlyTransactionFrequency || local.monthlyTransactionFrequency,
    address: mergeAddress(server.address, local.address),
    stakeholders:
      server.stakeholders.length > 0 ? server.stakeholders : local.stakeholders,
  };
}

export function mergeBasicInfo(
  server: BasicInfoProfile | null,
  local: BasicInfoProfile | null,
): BasicInfoProfile | null {
  if (!server) return local;
  if (!local) return server;
  return {
    firstName: pickNonEmpty(server.firstName, local.firstName),
    lastName: pickNonEmpty(server.lastName, local.lastName),
    country: local.country || server.country,
    countryCode: pickNonEmpty(local.countryCode, server.countryCode),
    phoneNumber: pickNonEmpty(local.phoneNumber, server.phoneNumber),
    dateOfBirth: pickNonEmpty(local.dateOfBirth, server.dateOfBirth),
  };
}

export function mergeOnboardingState(
  server: OnboardingState,
  local: OnboardingState,
): OnboardingState {
  return {
    profile: mergeBasicInfo(server.profile, local.profile),
    business: server.business
      ? mergeBusinessDetails(server.business, local.business)
      : local.business,
  };
}
