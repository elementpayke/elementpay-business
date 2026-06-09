export interface BasicInfoProfile {
  firstName: string;
  lastName: string;
  country: string;
  countryCode: string;
  phoneNumber: string;
  // ISO date string ("YYYY-MM-DD") or "".
  dateOfBirth: string;
}

// KYB profile business_type enum — mirrors backend `app/models/enums.py`.
export type BusinessType =
  | ""
  | "SoleTrader"
  | "LimitedCompany"
  | "LimitedLiabilityCompany"
  | "Partnership"
  | "NonProfit"
  | "Other";

// Associate.relationship_types values accepted by the KYB profile endpoint.
export type AssociateRelationshipType =
  | "UBO"
  | "Representative"
  | "Director"
  | "Shareholder";

// Backend KYB enums (string unions used as form values).
export type EstimatedEmployees =
  | ""
  | "1-10"
  | "11-50"
  | "51-200"
  | "201-1000"
  | "1000+";

export type AnnualRevenueRange =
  | ""
  | "LessThan100k"
  | "100kTo1M"
  | "1MTo10M"
  | "MoreThan10M";

export type SourceOfFunds =
  | ""
  | "Revenue"
  | "Investment"
  | "Loans"
  | "Grants"
  | "Other";

export type OwnershipType =
  | ""
  | "Private"
  | "Public"
  | "Government"
  | "NonProfit";

export type EstimatedMonthlyTurnover =
  | ""
  | "UpTo10k"
  | "UpTo50k"
  | "UpTo100k"
  | "UpTo500k"
  | "Over500k";

export type EstimatedTransactionValue =
  | ""
  | "UpTo10k"
  | "UpTo50k"
  | "UpTo100k"
  | "UpTo500k"
  | "Over500k";

export type MonthlyTransactionFrequency =
  | ""
  | "UpTo5"
  | "UpTo20"
  | "UpTo50"
  | "UpTo200"
  | "Over200";

export type IdType =
  | ""
  | "Passport"
  | "NationalIDCard"
  | "DrivingLicense"
  | "ResidencePermit";

// Noah's EntityType values may still sit in localStorage drafts from earlier
// versions of this form. Map each to the closest backend business_type so old
// drafts don't silently lose their selection.
const LEGACY_ENTITY_TO_BUSINESS_TYPE: Record<string, BusinessType> = {
  SoleProprietorship: "SoleTrader",
  LimitedLiabilityCompany: "LimitedLiabilityCompany",
  PublicCompany: "LimitedCompany",
  Corporation: "LimitedCompany",
  Partnership: "Partnership",
  Trust: "Other",
  PrivateFoundation: "NonProfit",
  Charity: "NonProfit",
  NonProfitOrganization: "NonProfit",
  PublicAgency: "Other",
};

export function normalizeBusinessType(value: string): BusinessType | "" {
  if (!value) return "";
  const allowed: BusinessType[] = [
    "",
    "SoleTrader",
    "LimitedCompany",
    "LimitedLiabilityCompany",
    "Partnership",
    "NonProfit",
    "Other",
  ];
  if ((allowed as string[]).includes(value)) return value as BusinessType;
  if (value in LEGACY_ENTITY_TO_BUSINESS_TYPE) {
    return LEGACY_ENTITY_TO_BUSINESS_TYPE[value];
  }
  return "";
}

export interface BusinessAddress {
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string; // ISO-2
}

export interface StakeholderIdentity {
  idType: IdType;
  idNumber: string;
  issuingCountryCode: string; // ISO-2
}

export interface Stakeholder {
  id: string; // UUID, sent as Associate.ID
  firstName: string;
  lastName: string;
  relationshipTypes: AssociateRelationshipType[];
  // ISO date string or "".
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
  taxResidenceCountryCode: string; // ISO-2
  residentialAddress: BusinessAddress;
  identity: StakeholderIdentity;
}

export interface BusinessDetails {
  legalName: string;
  entityType: BusinessType | "";
  registrationCountryCode: string; // ISO-2
  // ISO date string or "".
  incorporationDate: string;
  websiteUrl: string;
  industry: string;
  estimatedEmployees: EstimatedEmployees;
  annualRevenueRange: AnnualRevenueRange;
  sourceOfFunds: SourceOfFunds;
  ownershipType: OwnershipType;
  estimatedMonthlyTurnover: EstimatedMonthlyTurnover;
  estimatedTransactionValue: EstimatedTransactionValue;
  monthlyTransactionFrequency: MonthlyTransactionFrequency;
  address: BusinessAddress;
  stakeholders: Stakeholder[];
}

export interface OnboardingState {
  profile: BasicInfoProfile | null;
  business: BusinessDetails | null;
}

export const EMPTY_ONBOARDING_STATE: OnboardingState = {
  profile: null,
  business: null,
};

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Kenya is our primary customer base, so default country fields to KE.
const DEFAULT_COUNTRY_CODE = "KE";

export function emptyAddress(): BusinessAddress {
  return {
    line1: "",
    city: "",
    state: "",
    postalCode: "",
    countryCode: DEFAULT_COUNTRY_CODE,
  };
}

export function emptyStakeholder(): Stakeholder {
  return {
    id: generateId(),
    firstName: "",
    lastName: "",
    relationshipTypes: ["Director"],
    dateOfBirth: "",
    email: "",
    phoneNumber: "",
    taxResidenceCountryCode: DEFAULT_COUNTRY_CODE,
    residentialAddress: emptyAddress(),
    identity: {
      idType: "NationalIDCard",
      idNumber: "",
      issuingCountryCode: DEFAULT_COUNTRY_CODE,
    },
  };
}

export function emptyBusinessDetails(): BusinessDetails {
  return {
    legalName: "",
    entityType: "",
    registrationCountryCode: DEFAULT_COUNTRY_CODE,
    incorporationDate: "",
    websiteUrl: "",
    industry: "",
    estimatedEmployees: "",
    annualRevenueRange: "",
    sourceOfFunds: "",
    ownershipType: "",
    estimatedMonthlyTurnover: "",
    estimatedTransactionValue: "",
    monthlyTransactionFrequency: "",
    address: emptyAddress(),
    stakeholders: [emptyStakeholder()],
  };
}

export function isBasicInfoComplete(profile: BasicInfoProfile | null): boolean {
  if (!profile) return false;
  return Boolean(
    profile.firstName &&
      profile.lastName &&
      profile.country &&
      profile.countryCode &&
      profile.phoneNumber,
  );
}

function isCompleteAddress(a: BusinessAddress): boolean {
  return Boolean(
    a.line1.trim() && a.city.trim() && a.postalCode.trim() && a.countryCode,
  );
}

export function isBusinessDetailsComplete(business: BusinessDetails | null): boolean {
  if (!business) return false;
  if (!business.legalName.trim()) return false;
  if (!business.entityType) return false;
  if (!business.registrationCountryCode) return false;
  if (!business.incorporationDate) return false;
  if (!business.industry.trim()) return false;
  if (!business.estimatedEmployees) return false;
  if (!business.annualRevenueRange) return false;
  if (!business.sourceOfFunds) return false;
  if (!business.ownershipType) return false;
  if (!business.estimatedMonthlyTurnover) return false;
  if (!business.estimatedTransactionValue) return false;
  if (!business.monthlyTransactionFrequency) return false;
  if (!isCompleteAddress(business.address)) return false;
  if (business.stakeholders.length === 0) return false;
  return business.stakeholders.every(
    (s) =>
      s.firstName.trim() &&
      s.lastName.trim() &&
      s.relationshipTypes.length > 0 &&
      s.dateOfBirth &&
      s.email.trim() &&
      s.phoneNumber.trim() &&
      s.taxResidenceCountryCode &&
      isCompleteAddress(s.residentialAddress) &&
      s.identity.idType &&
      s.identity.idNumber.trim() &&
      s.identity.issuingCountryCode,
  );
}

export function isTier1Complete(state: OnboardingState): boolean {
  return isBusinessDetailsComplete(state.business);
}
