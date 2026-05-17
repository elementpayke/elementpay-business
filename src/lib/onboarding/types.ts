export interface DateOfBirth {
  day: string;
  month: string;
  year: string;
}

export interface BasicInfoProfile {
  firstName: string;
  lastName: string;
  country: string;
  countryCode: string;
  phoneNumber: string;
  dateOfBirth: DateOfBirth;
}
// KYB profile business_type enum.
export type BusinessType =
  | ""
  | "LimitedLiabilityCompany"
  | "PublicCompany"
  | "SoleProprietorship"
  | "Partnership"
  | "Corporation"
  | "Trust"
  | "PrivateFoundation"
  | "Charity"
  | "NonProfitOrganization"
  | "PublicAgency";

// Associate.relationship_types values accepted by the KYB profile endpoint.
export type AssociateRelationshipType =
  | "UBO"
  | "Representative"
  | "Director"
  | "Shareholder";

// Map legacy Noah EntityType values (still in localStorage from prior sessions)
// onto the new business_type enum so saved drafts keep working.
const LEGACY_ENTITY_TO_BUSINESS_TYPE: Record<string, BusinessType> = {
  LimitedLiabilityCompany: "LimitedLiabilityCompany",
  PublicCompany: "PublicCompany",
  Corporation: "Corporation",
  SoleProprietorship: "SoleProprietorship",
  Partnership: "Partnership",
  Trust: "Trust",
  PrivateFoundation: "PrivateFoundation",
  Charity: "Charity",
  NonProfitOrganization: "NonProfitOrganization",
  PublicAgency: "PublicAgency",
};

export function normalizeBusinessType(value: string): BusinessType | "" {
  if (!value) return "";
  if (value in LEGACY_ENTITY_TO_BUSINESS_TYPE) {
    return LEGACY_ENTITY_TO_BUSINESS_TYPE[value];
  }
  const allowed: BusinessType[] = [
    "",
    "LimitedLiabilityCompany",
    "PublicCompany",
    "SoleProprietorship",
    "Partnership",
    "Corporation",
    "Trust",
    "PrivateFoundation",
    "Charity",
    "NonProfitOrganization",
    "PublicAgency",
  ];
  return (allowed as string[]).includes(value) ? (value as BusinessType) : "";
}

export interface BusinessAddress {
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string; // ISO-2
}

export interface Stakeholder {
  id: string; // UUID, sent as Associate.ID
  firstName: string;
  lastName: string;
  relationshipTypes: AssociateRelationshipType[];
  dateOfBirth: DateOfBirth;
}

export interface BusinessDetails {
  legalName: string;
  registrationNumber: string;
  taxId: string;
  entityType: BusinessType | "";
  registrationCountryCode: string; // ISO-2
  incorporationDate: DateOfBirth;
  websiteUrl: string;
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

export function emptyStakeholder(): Stakeholder {
  return {
    id: generateId(),
    firstName: "",
    lastName: "",
    relationshipTypes: ["Director"],
    dateOfBirth: { day: "", month: "", year: "" },
  };
}

// Kenya is our primary customer base, so default country fields to KE.
const DEFAULT_COUNTRY_CODE = "KE";

export function emptyBusinessDetails(): BusinessDetails {
  return {
    legalName: "",
    registrationNumber: "",
    taxId: "",
    entityType: "",
    registrationCountryCode: DEFAULT_COUNTRY_CODE,
    incorporationDate: { day: "", month: "", year: "" },
    websiteUrl: "",
    address: {
      line1: "",
      city: "",
      state: "",
      postalCode: "",
      countryCode: DEFAULT_COUNTRY_CODE,
    },
    stakeholders: [emptyStakeholder()],
  };
}

function isCompleteDate(dob: DateOfBirth): boolean {
  return Boolean(dob.day && dob.month && dob.year);
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

export function isBusinessDetailsComplete(business: BusinessDetails | null): boolean {
  if (!business) return false;
  if (!business.legalName.trim()) return false;
  if (!business.registrationNumber.trim()) return false;
  if (!business.entityType) return false;
  if (!business.registrationCountryCode) return false;
  if (!isCompleteDate(business.incorporationDate)) return false;
  const a = business.address;
  if (!a.line1.trim() || !a.city.trim() || !a.countryCode) return false;
  if (!a.postalCode.trim()) return false;
  if (business.stakeholders.length === 0) return false;
  return business.stakeholders.every(
    (s) =>
      s.firstName.trim() &&
      s.lastName.trim() &&
      s.relationshipTypes.length > 0 &&
      isCompleteDate(s.dateOfBirth),
  );
}

export function isTier1Complete(state: OnboardingState): boolean {
  return (
    isBasicInfoComplete(state.profile) &&
    isBusinessDetailsComplete(state.business)
  );
}
