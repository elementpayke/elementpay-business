"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { COUNTRIES } from "@/lib/countries";
import {
  fetchSupportedCatalog,
  type CatalogCountry,
  type CatalogPaymentMethod,
  type CatalogProvider,
  type CatalogRail,
  type SupportedCatalog,
} from "@/lib/catalog/api";

export type CatalogDirectionKey = "onramp" | "offramp";

/** A country option, normalized for dropdown rendering. */
export type CatalogCountryOption = {
  code: string;
  name: string;
  currency: string;
  /** Emoji flag from the shared COUNTRIES table, "" if unknown. */
  flag: string;
  /** Dial code incl. leading "+", e.g. "+254". null if unknown. */
  dialCode: string | null;
  raw: CatalogCountry;
};

/** A payment-method option (mobile money / bank / offramp rail), normalized. */
export type CatalogMethodOption = {
  /**
   * Cashout semantic the rest of the app keys on: "momo" pays a phone, "bank"
   * pays an account (used for CashoutType + the bankCode/phone field shape).
   * Offramp rails (SEPA/SWIFT/Pix/…) are account payouts, so they map to "bank".
   */
  key: "momo" | "bank";
  /**
   * Unique identifier for THIS option within a country. With offramp rails a
   * country can expose several "bank"-semantic options (the bank method plus
   * one per rail), so `key` is no longer unique — use this for select/find.
   */
  optionKey: string;
  /** Raw map key / rail type: "mobile_money" | "bank" | a rail type string. */
  groupKey: "mobile_money" | "bank" | "rail";
  label: string;
  quoteType: string;
  providers: CatalogProvider[];
  raw: CatalogPaymentMethod | CatalogRail;
};

const COUNTRY_META = new Map(
  COUNTRIES.map((c) => [c.code, { dialCode: c.dialCode, flag: c.flag }]),
);

export function useSupportedCatalog() {
  const { authenticated, loading } = useAuth();
  return useQuery<SupportedCatalog>({
    queryKey: ["supported-catalog"],
    queryFn: fetchSupportedCatalog,
    enabled: authenticated && !loading,
    // The catalog is slow-moving — cache it generously for the session.
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });
}

function toCountryOption(raw: CatalogCountry): CatalogCountryOption {
  const meta = COUNTRY_META.get(raw.country_code);
  return {
    code: raw.country_code,
    // Some offramp entries echo the ISO code as the name — prefer the
    // shared table's display when the catalog name looks like a bare code.
    name:
      raw.country_name && raw.country_name !== raw.country_code
        ? raw.country_name
        : COUNTRIES.find((c) => c.code === raw.country_code)?.name ?? raw.country_name,
    currency: raw.currency,
    flag: meta?.flag ?? "",
    dialCode: meta?.dialCode ?? null,
    raw,
  };
}

/**
 * Enabled countries for a direction, sorted by display name. A country is
 * included only when it has at least one enabled payment method with at
 * least one enabled provider (so we never offer a dead corridor).
 */
export function selectCountries(
  catalog: SupportedCatalog | undefined,
  direction: CatalogDirectionKey,
): CatalogCountryOption[] {
  if (!catalog) return [];
  const entries = Object.values(catalog[direction].countries);
  return entries
    .filter((c) => c.enabled && hasUsableMethod(c))
    .map(toCountryOption)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function hasUsableMethod(country: CatalogCountry): boolean {
  const hasMethod = (["mobile_money", "bank"] as const).some((g) => {
    const m = country.payment_methods[g];
    return Boolean(m?.enabled && m.providers.some((p) => p.enabled));
  });
  if (hasMethod) return true;
  // Offramp corridors may be served purely by rails (SEPA/SWIFT/Pix/…).
  return Boolean(
    country.rails?.some(
      (r) => r.enabled && r.providers.some((p) => p.enabled),
    ),
  );
}

/** Enabled, de-duped providers for a method. The catalog occasionally lists
 *  the same provider twice (e.g. Malawi TNM / TNM_MWI) — collapse by display
 *  name so the picker isn't confusing. */
function usableProviders(m: {
  providers: CatalogProvider[];
}): CatalogProvider[] {
  const seen = new Set<string>();
  const out: CatalogProvider[] = [];
  for (const p of m.providers) {
    if (!p.enabled) continue;
    const dedupeKey = p.name.trim().toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    out.push(p);
  }
  return out;
}

/**
 * Enabled payment methods for a specific country code in a direction.
 *
 * A method is returned only when it is enabled AND has at least one usable
 * provider. This is the single hide-rule: a corridor with an empty provider
 * list (e.g. Malawi `bank`) is a dead option and never surfaced, so we don't
 * misdirect the user toward a method we can't actually accept.
 */
export function selectMethods(
  catalog: SupportedCatalog | undefined,
  direction: CatalogDirectionKey,
  countryCode: string | null | undefined,
): CatalogMethodOption[] {
  if (!catalog || !countryCode) return [];
  const country = catalog[direction].countries[countryCode];
  if (!country) return [];

  const out: CatalogMethodOption[] = [];
  const groups: Array<{ groupKey: "mobile_money" | "bank"; key: "momo" | "bank" }> = [
    { groupKey: "mobile_money", key: "momo" },
    { groupKey: "bank", key: "bank" },
  ];
  for (const { groupKey, key } of groups) {
    const m = country.payment_methods[groupKey];
    if (!m?.enabled) continue;
    const providers = usableProviders(m);
    if (providers.length === 0) continue;
    out.push({
      key,
      optionKey: groupKey,
      groupKey,
      label: m.label,
      quoteType: m.quote_type,
      providers,
      raw: m,
    });
  }

  // Offramp rails (SEPA/SWIFT/Pix/…) are account payouts: surface each enabled
  // rail as its own "bank"-semantic option. The rail's `type` keeps optionKey
  // unique against the bank method and any sibling rails.
  for (const rail of country.rails ?? []) {
    if (!rail.enabled) continue;
    const providers = usableProviders(rail);
    if (providers.length === 0) continue;
    out.push({
      key: "bank",
      optionKey: `rail:${rail.type}`,
      groupKey: "rail",
      label: rail.label,
      quoteType: rail.type,
      providers,
      raw: rail,
    });
  }
  return out;
}

/** Convenience hook: countries + a per-country method selector for a direction. */
export function useCatalogDirection(direction: CatalogDirectionKey) {
  const query = useSupportedCatalog();
  const countries = useMemo(
    () => selectCountries(query.data, direction),
    [query.data, direction],
  );
  const getMethods = useMemo(
    () => (countryCode: string | null | undefined) =>
      selectMethods(query.data, direction, countryCode),
    [query.data, direction],
  );
  return {
    catalog: query.data,
    countries,
    getMethods,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
