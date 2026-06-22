"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { fetchIbanAccounts, type IbanAccount } from "@/lib/iban/api";

export function useIbanAccounts() {
  const { authenticated, loading } = useAuth();
  return useQuery<IbanAccount[]>({
    queryKey: ["iban-accounts"],
    queryFn: fetchIbanAccounts,
    enabled: authenticated && !loading,
    // IBAN accounts are slow-moving — cache them generously for the session.
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}
