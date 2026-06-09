import {
  createKybProfile,
  getKybSummary,
  initiateKyb,
  kybSummaryHasProfile,
  setKybAddress,
  updateKybProfile,
  type Address,
  type AnnualRevenueRange as KybAnnualRevenue,
  type Associate,
  type AssociateRelationship,
  type EstimatedEmployees as KybEstimatedEmployees,
  type EstimatedMonthlyTurnover as KybMonthlyTurnover,
  type EstimatedTransactionValue as KybTxnValue,
  type Identity,
  type IdType as KybIdType,
  type KybProfilePayload,
  type KybProfileResponse,
  type MonthlyTransactionFrequency as KybTxnFreq,
  type OwnershipType as KybOwnershipType,
  type SourceOfFunds as KybSourceOfFunds,
  type BusinessType as KybBusinessType,
} from "@/lib/kyb";
import type {
  AssociateRelationshipType,
  BasicInfoProfile,
  BusinessAddress,
  BusinessDetails,
  BusinessType,
  Stakeholder,
} from "@/lib/onboarding/types";

function trimOrUndefined(value: string): string | undefined {
  const v = value.trim();
  return v.length > 0 ? v : undefined;
}

function toKybBusinessType(v: BusinessType): KybBusinessType {
  return v as KybBusinessType;
}

function toAssociateRelationships(
  roles: AssociateRelationshipType[],
): AssociateRelationship[] {
  return roles as AssociateRelationship[];
}

function buildAddress(addr: BusinessAddress): Address {
  return {
    street: addr.line1.trim(),
    city: addr.city.trim(),
    post_code: addr.postalCode.trim(),
    state: trimOrUndefined(addr.state) ?? null,
    country: addr.countryCode,
  };
}

function buildAssociate(s: Stakeholder): Associate | null {
  if (!s.dateOfBirth) return null;
  const identity: Identity = {
    issuing_country: s.identity.issuingCountryCode,
    id_type: s.identity.idType as KybIdType,
    id_number: s.identity.idNumber.trim(),
  };
  return {
    id: s.id,
    relationship_types: toAssociateRelationships(s.relationshipTypes),
    full_name: {
      first_name: s.firstName.trim(),
      last_name: s.lastName.trim(),
    },
    date_of_birth: s.dateOfBirth,
    email: s.email.trim(),
    phone_number: s.phoneNumber.trim(),
    tax_residence_country: s.taxResidenceCountryCode,
    residential_address: buildAddress(s.residentialAddress),
    identities: [identity],
    ubo: s.relationshipTypes.includes("UBO")
      ? { ownership_percentage: 100 }
      : null,
  };
}

export function buildKybProfilePayload(
  business: BusinessDetails,
  _profile: BasicInfoProfile | null,
  _userEmail: string,
): KybProfilePayload {
  void _profile;
  void _userEmail;
  const registeredAddress = buildAddress(business.address);

  const associates: Associate[] = business.stakeholders
    .map(buildAssociate)
    .filter((a): a is Associate => a !== null);

  const payload: KybProfilePayload = {
    legal_name: business.legalName.trim(),
    country: business.registrationCountryCode,
    registered_address: registeredAddress,
    business_type: business.entityType ? toKybBusinessType(business.entityType) : undefined,
    industry: trimOrUndefined(business.industry),
    website: trimOrUndefined(business.websiteUrl),
    estimated_employees: (business.estimatedEmployees || undefined) as KybEstimatedEmployees | undefined,
    annual_revenue_range: (business.annualRevenueRange || undefined) as KybAnnualRevenue | undefined,
    source_of_funds: (business.sourceOfFunds || undefined) as KybSourceOfFunds | undefined,
    incorporation_date: business.incorporationDate || undefined,
    ownership_type: (business.ownershipType || undefined) as KybOwnershipType | undefined,
    estimated_monthly_turnover: (business.estimatedMonthlyTurnover || undefined) as KybMonthlyTurnover | undefined,
    estimated_transaction_value: (business.estimatedTransactionValue || undefined) as KybTxnValue | undefined,
    monthly_transaction_frequency: (business.monthlyTransactionFrequency || undefined) as KybTxnFreq | undefined,
    associates: associates.length > 0 ? associates : undefined,
  };

  return payload;
}

export interface SubmitKybResult {
  hostedUrl: string;
  kybStatus: string;
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

  const payload = buildKybProfilePayload(business, profile, userEmail);
  await saveKybProfile(businessId, payload);

  console.log(`[kyb] saving registered address`);
  try {
    await setKybAddress(businessId, buildAddress(business.address));
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
