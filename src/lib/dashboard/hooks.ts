"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import {
  fetchDashboardSummary,
  fetchExchangeRates,
  fetchInvoices,
  fetchTransaction,
  fetchTransactions,
  TransactionNotFoundError,
  type DashboardSummary,
  type ExchangeRates,
  type InvoiceListResponse,
  type Transaction,
  type TransactionList,
} from "@/lib/dashboard/api";

export function useExchangeRates() {
  return useQuery<ExchangeRates>({
    queryKey: ["exchange-rates"],
    queryFn: fetchExchangeRates,
    staleTime: 60_000,
  });
}

export function useDashboardSummary() {
  const { authenticated, loading } = useAuth();
  return useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: fetchDashboardSummary,
    enabled: authenticated && !loading,
    staleTime: 30_000,
  });
}

export function useTransactions() {
  const { authenticated, loading } = useAuth();
  return useQuery<TransactionList>({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
    enabled: authenticated && !loading,
    staleTime: 15_000,
  });
}

export function useTransaction(id: string | number | null | undefined) {
  const { authenticated, loading } = useAuth();
  return useQuery<Transaction>({
    queryKey: ["transaction", id],
    queryFn: () => fetchTransaction(id as string | number),
    enabled: authenticated && !loading && id != null && id !== "",
    staleTime: 15_000,
    retry: (failureCount, error) =>
      !(error instanceof TransactionNotFoundError) && failureCount < 2,
  });
}

export function useInvoices(params: {
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { authenticated, loading } = useAuth();
  return useQuery<InvoiceListResponse>({
    queryKey: ["invoices", params],
    queryFn: () => fetchInvoices(params),
    enabled: authenticated && !loading,
    staleTime: 15_000,
  });
}
