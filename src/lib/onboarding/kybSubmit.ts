import {
  createKybProfile,
  getKybSummary,
  initiateKyb,
  kybSummaryHasProfile,
  setKybAddress,
  updateKybProfile,
  type Address,
  type Associate,
  type AssociateRelationship,
  type Identity,
  type KybProfilePayload,
  type KybProfileResponse,
  type BusinessType as KybBusinessType,
} from "@/lib/kyb";
import type {
  AssociateRelationshipType,
  BasicInfoProfile,
  BusinessDetails,
  BusinessType,
  DateOfBirth,
} from "@/lib/onboarding/types";

// Defaults for KYB fields the Tier-1 form does not yet collect.
// Values match the enum buckets in app/models/enums.py + the documented
// free-text bands. Noah's hosted session lets the user correct them later.
const KYB_DEFAULTS = {
  industry: "Fintech",
  estimated_employees: "1-10",
  annual_revenue_range: "LessThan100k",
  source_of_funds: "Revenue",
  ownership_type: "Private",
  estimated_monthly_turnover: "UpTo100k",
  estimated_transaction_value: "UpTo50k",
  monthly_transaction_frequency: "UpTo20",
  ubo_ownership_percentage: 100,
} as const;

function dobToIso(dob: DateOfBirth): string | null {
  if (!dob.day || !dob.month || !dob.year) return null;
  const d = dob.day.padStart(2, "0");
  const m = dob.month.padStart(2, "0");
  return `${dob.year}-${m}-${d}`;
}

function trimOrUndefined(value: string): string | undefined {
  const v = value.trim();
  return v.length > 0 ? v : undefined;
}

// The backend BusinessType enum (SoleTrader|LimitedCompany|Partnership|NonProfit|Other)
// is identical to the form's union, so a direct cast is correct. The backend
// handles the translation to Noah's EntityType internally inside /kyb/initiate.
function toKybBusinessType(v: BusinessType): KybBusinessType {
  return v as KybBusinessType;
}

// Form's relationship roles map 1:1 to kyb.ts's AssociateRelationship.
function toAssociateRelationships(
  roles: AssociateRelationshipType[],
): AssociateRelationship[] {
  return roles as AssociateRelationship[];
}

export function buildKybProfilePayload(
  business: BusinessDetails,
  profile: BasicInfoProfile | null,
  userEmail: string,
): KybProfilePayload {
  const incorporation = dobToIso(business.incorporationDate);
  const registeredAddress = buildRegisteredAddress(business);

  const ownerPhone = profile?.phoneNumber.trim() ?? "";
  // BasicInfoStep currently stores the dial code (e.g. "+254") in
  // profile.countryCode, but KYB needs ISO-2 here. The registration country
  // is always ISO-2, so use it as the authoritative source for both the
  // associate's tax residence and identity issuing country.
  const ownerCountry = business.registrationCountryCode;

  // Identity is required by Noah at prefill time (the API itself accepts an
  // empty list, but /kyb/initiate calls Noah which rejects placeholder data).
  // Stub a NationalIDCard entry sourced from the registration number so the
  // POST/PATCH succeeds; the user replaces it inside the hosted Noah session.
  const placeholderIdentity: Identity = {
    issuing_country: ownerCountry,
    id_type: "NationalIDCard",
    id_number: business.registrationNumber.trim() || "PENDING",
  };

  const associates: Associate[] = business.stakeholders
    .map((s, idx) => {
      const dob = dobToIso(s.dateOfBirth);
      if (!dob) return null;
      const isOwner = idx === 0;
      const associate: Associate = {
        id: s.id,
        relationship_types: toAssociateRelationships(s.relationshipTypes),
        full_name: {
          first_name: s.firstName.trim(),
          last_name: s.lastName.trim(),
        },
        date_of_birth: dob,
        // Owner inherits credentials from the signed-in user; additional
        // stakeholders use the same email/phone as a placeholder and the
        // hosted session prompts the user to correct them.
        email: isOwner ? userEmail : userEmail,
        phone_number: isOwner ? ownerPhone : ownerPhone,
        tax_residence_country: ownerCountry,
        residential_address: registeredAddress,
        identities: [placeholderIdentity],
        ubo: s.relationshipTypes.includes("UBO")
          ? { ownership_percentage: KYB_DEFAULTS.ubo_ownership_percentage }
          : null,
      };
      return associate;
    })
    .filter((a): a is Associate => a !== null);

  const payload: KybProfilePayload = {
    legal_name: business.legalName.trim(),
    registration_number: business.registrationNumber.trim(),
    country: business.registrationCountryCode,
    tax_id: trimOrUndefined(business.taxId),
    registered_address: registeredAddress,
    business_type: business.entityType ? toKybBusinessType(business.entityType) : undefined,
    industry: KYB_DEFAULTS.industry,
    website: trimOrUndefined(business.websiteUrl),
    estimated_employees: KYB_DEFAULTS.estimated_employees,
    annual_revenue_range: KYB_DEFAULTS.annual_revenue_range,
    source_of_funds: KYB_DEFAULTS.source_of_funds,
    incorporation_date: incorporation ?? undefined,
    ownership_type: KYB_DEFAULTS.ownership_type,
    estimated_monthly_turnover: KYB_DEFAULTS.estimated_monthly_turnover,
    estimated_transaction_value: KYB_DEFAULTS.estimated_transaction_value,
    monthly_transaction_frequency: KYB_DEFAULTS.monthly_transaction_frequency,
    associates: associates.length > 0 ? associates : undefined,
  };

  return payload;
}

export interface SubmitKybResult {
  hostedUrl: string;
  kybStatus: string;
}

function buildRegisteredAddress(business: BusinessDetails): Address {
  return {
    street: business.address.line1.trim(),
    city: business.address.city.trim(),
    post_code: business.address.postalCode.trim(),
    state: trimOrUndefined(business.address.state) ?? null,
    country: business.address.countryCode,
  };
}

async function saveKybProfile(
  businessId: number,
  payload: KybProfilePayload,
): Promise<KybProfileResponse> {
  console.log(`[kyb] checking existing profile for business ${businessId}`);
  let exists = false;
  try {
    const summary = await getKybSummary(businessId);
    console.log(`[kyb] /kyb summary:`, summary);
    exists = kybSummaryHasProfile(summary);
  } catch (err) {
    console.warn(
      `[kyb] /kyb summary lookup failed, defaulting to PATCH:`,
      err instanceof Error ? err.message : err,
    );
    // Default to PATCH on lookup failure — PATCH on a missing profile returns
    // a recoverable 404, whereas POST on an existing one corrupts the request.
    exists = true;
  }

  console.log(`[kyb] profile exists=${exists} — using ${exists ? "PATCH" : "POST"}`);
  try {
    return exists
      ? await updateKybProfile(businessId, payload)
      : await createKybProfile(businessId, payload);
  } catch (err) {
    console.error(
      `[kyb] ${exists ? "PATCH" : "POST"} /kyb/profile failed:`,
      err instanceof Error ? err.message : err,
    );
    throw err;
  }
}

export async function submitKybAndInitiate(
  businessId: number,
  business: BusinessDetails,
  profile: BasicInfoProfile | null,
  userEmail: string,
): Promise<SubmitKybResult> {
  console.log(`[kyb] submit start business_id=${businessId}`);

  // Order matters: backend requires profile + address saved before initiate.
  const payload = buildKybProfilePayload(business, profile, userEmail);
  await saveKybProfile(businessId, payload);

  console.log(`[kyb] saving registered address`);
  try {
    await setKybAddress(businessId, buildRegisteredAddress(business));
  } catch (err) {
    console.error(
      `[kyb] PUT /kyb/address failed:`,
      err instanceof Error ? err.message : err,
    );
    throw err;
  }

  console.log(`[kyb] initiating hosted onboarding`);
  let initiated;
  try {
    initiated = await initiateKyb(businessId);
    console.log(`[kyb] /kyb/initiate response:`, initiated);
  } catch (err) {
    console.error(
      `[kyb] POST /kyb/initiate failed:`,
      err instanceof Error ? err.message : err,
    );
    throw err;
  }

  console.log(`[kyb] submit complete kyb_status=${initiated.kyb_status}`);
  return { hostedUrl: initiated.hosted_url, kybStatus: initiated.kyb_status };
}
