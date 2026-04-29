import type {
  BusinessDetails,
  DateOfBirth,
  NoahEntityType,
  NoahRelationshipType,
} from "@/lib/onboarding/types";

export interface NoahLegalAddress {
  Street: string;
  City: string;
  PostCode: string;
  State?: string;
  Country: string;
}

export interface NoahFullName {
  FirstName: string;
  LastName: string;
}

export interface NoahAssociate {
  ID: string;
  RelationshipTypes: NoahRelationshipType[];
  FullName: NoahFullName;
  DateOfBirth: string;
}

export interface NoahBusinessCustomerPrefill {
  RegistrationCountry: string;
  CompanyName: string;
  RegistrationNumber: string;
  LegalAddress: NoahLegalAddress;
  IncorporationDate: string;
  EntityType: NoahEntityType;
  TaxID?: string;
  PrimaryWebsite?: string;
  Associates: NoahAssociate[];
}

export interface NoahPrefillEnrollmentRequest {
  subject_id: string;
  rail_key: "noah";
  noah_customer_id: string;
  noah: NoahBusinessCustomerPrefill;
}

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

export function buildNoahPrefillPayload(
  business: BusinessDetails,
  subjectId: string,
  noahCustomerId: string,
): NoahPrefillEnrollmentRequest {
  if (!business.entityType) {
    throw new Error("EntityType is required");
  }
  const trimmedSubjectId = subjectId.trim();
  if (!trimmedSubjectId) {
    throw new Error("subject_id is required");
  }
  const trimmedNoahCustomerId = noahCustomerId.trim();
  if (!trimmedNoahCustomerId) {
    throw new Error("noah_customer_id is required");
  }
  const incorporation = dobToIso(business.incorporationDate);
  if (!incorporation) {
    throw new Error("IncorporationDate is required");
  }
  const postCode = business.address.postalCode.trim();
  if (!postCode) {
    throw new Error("Postcode is required");
  }

  return {
    subject_id: trimmedSubjectId,
    rail_key: "noah",
    noah_customer_id: trimmedNoahCustomerId,
    noah: {
      RegistrationCountry: business.registrationCountryCode,
      CompanyName: business.legalName.trim(),
      RegistrationNumber: business.registrationNumber.trim(),
      LegalAddress: {
        Street: business.address.line1.trim(),
        City: business.address.city.trim(),
        PostCode: postCode,
        State: trimOrUndefined(business.address.state),
        Country: business.address.countryCode,
      },
      IncorporationDate: incorporation,
      EntityType: business.entityType,
      TaxID: trimOrUndefined(business.taxId),
      PrimaryWebsite: trimOrUndefined(business.websiteUrl),
      Associates: business.stakeholders.map((s) => ({
        ID: s.id,
        RelationshipTypes: s.relationshipTypes,
        FullName: {
          FirstName: s.firstName.trim(),
          LastName: s.lastName.trim(),
        },
        DateOfBirth: dobToIso(s.dateOfBirth) ?? "",
      })),
    },
  };
}
