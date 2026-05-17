import type {
  Address as KybAddress,
  Associate as KybAssociate,
  KybProfileResponse,
} from "@/lib/kyb";
import {
  emptyBusinessDetails,
  emptyStakeholder,
  normalizeBusinessType,
  type AssociateRelationshipType,
  type BasicInfoProfile,
  type BusinessAddress,
  type BusinessDetails,
  type DateOfBirth,
  type OnboardingState,
  type Stakeholder,
} from "@/lib/onboarding/types";

// Reverse of dobToIso in kybSubmit.ts: "YYYY-MM-DD" -> DateOfBirth, with
// lossy/empty values falling back to "" so the form selects render blank.
function isoToDob(value: string | null | undefined): DateOfBirth {
  if (!value) return { day: "", month: "", year: "" };
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return { day: "", month: "", year: "" };
  return {
    year: m[1],
    month: String(Number(m[2])),
    day: String(Number(m[3])),
  };
}

function mapAddress(
  source: KybAddress | undefined,
  fallbackCountry: string,
): BusinessAddress {
  if (!source) {
    return {
      line1: "",
      city: "",
      state: "",
      postalCode: "",
      countryCode: fallbackCountry,
    };
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

function mapStakeholder(a: KybAssociate): Stakeholder {
  const base = emptyStakeholder();
  return {
    id: a.id ?? base.id,
    firstName: a.full_name?.first_name ?? "",
    lastName: a.full_name?.last_name ?? "",
    relationshipTypes: mapRelationships(a.relationship_types),
    dateOfBirth: isoToDob(a.date_of_birth),
  };
}

// Build the form-shaped BusinessDetails from a server KybProfileResponse.
// Missing fields fall back to the form's empty defaults so the UI stays valid.
export function profileToBusinessDetails(
  profile: KybProfileResponse,
): BusinessDetails {
  const defaults = emptyBusinessDetails();
  const country = profile.country ?? defaults.registrationCountryCode;
  const address = mapAddress(profile.registered_address, country);
  const stakeholders =
    profile.associates && profile.associates.length > 0
      ? profile.associates.map(mapStakeholder)
      : defaults.stakeholders;

  return {
    legalName: profile.legal_name ?? "",
    registrationNumber: profile.registration_number ?? "",
    taxId: profile.tax_id ?? "",
    entityType: normalizeBusinessType(profile.business_type ?? ""),
    registrationCountryCode: country,
    incorporationDate: isoToDob(profile.incorporation_date),
    websiteUrl: profile.website ?? "",
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
    dateOfBirth: isoToDob(owner.date_of_birth),
  };
}

// Field-level merge: server value wins when non-empty, otherwise local value.
// Applied per leaf field so a partially-completed local draft is never blown
// away by a sparse server response.
function pickNonEmpty<T extends string>(server: T, local: T): T {
  return server && server.trim() !== "" ? server : local;
}

function mergeDate(server: DateOfBirth, local: DateOfBirth): DateOfBirth {
  const hasServer = server.day && server.month && server.year;
  return hasServer ? server : local;
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
    registrationNumber: pickNonEmpty(
      server.registrationNumber,
      local.registrationNumber,
    ),
    taxId: pickNonEmpty(server.taxId, local.taxId),
    entityType: server.entityType || local.entityType,
    registrationCountryCode: pickNonEmpty(
      server.registrationCountryCode,
      local.registrationCountryCode,
    ),
    incorporationDate: mergeDate(server.incorporationDate, local.incorporationDate),
    websiteUrl: pickNonEmpty(server.websiteUrl, local.websiteUrl),
    address: mergeAddress(server.address, local.address),
    // Stakeholders are an array — if the server has any, prefer those (they're
    // the source of truth after a submit attempt); otherwise keep local edits.
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
    // Local 'country' (full name) is richer than what we can derive from
    // server's ISO-2, so prefer local here.
    country: local.country || server.country,
    countryCode: pickNonEmpty(local.countryCode, server.countryCode),
    phoneNumber: pickNonEmpty(local.phoneNumber, server.phoneNumber),
    dateOfBirth: mergeDate(local.dateOfBirth, server.dateOfBirth),
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
