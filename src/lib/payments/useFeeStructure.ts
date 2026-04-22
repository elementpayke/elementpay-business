"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_FEE_BANDS,
  type FeeBand,
  fetchFeeStructureCached,
} from "@/lib/payments/feeStructure";

export type UseFeeStructureParams = {
  /** Token slug accepted by the backend, e.g. "usdc" or "usdt_lisk". */
  token: string;
  action: "OffRamp" | "OnRamp";
  enabled?: boolean;
};

export type UseFeeStructureResult = {
  feeBands: FeeBand[];
  baseRate: number | null;
  isLoading: boolean;
  error: Error | null;
  /** True once we have bands from the API or fallback. */
  isReady: boolean;
};

export function useFeeStructure({
  token,
  action,
  enabled = true,
}: UseFeeStructureParams): UseFeeStructureResult {
  const [feeBands, setFeeBands] = useState<FeeBand[]>([]);
  const [baseRate, setBaseRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !token) return;

    let cancelled = false;

    async function load() {
      try {
        if (!cancelled) setIsLoading(true);
        const response = await fetchFeeStructureCached({ token, action });
        if (cancelled) return;
        setError(null);
        setFeeBands(response.data.fee_bands);
        setBaseRate(response.data.base_rate || null);
      } catch (err) {
        if (cancelled) return;
        const e = err instanceof Error ? err : new Error("Failed to fetch fee structure");
        console.warn("[useFeeStructure] falling back to defaults:", e.message);
        setError(e);
        setFeeBands(DEFAULT_FEE_BANDS);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [token, action, enabled]);

  return {
    feeBands,
    baseRate,
    isLoading,
    error,
    isReady: feeBands.length > 0,
  };
}
