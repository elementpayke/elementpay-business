"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import { cardClassName, mergeClasses } from "@/components/dashboard/DashboardPrimitives";
import VerificationLimitsCard from "@/components/verification/VerificationLimitsCard";
import VerificationPageSkeleton from "@/components/verification/VerificationSkeleton";
import VerificationRequirementsCard from "@/components/verification/VerificationRequirementsCard";
import VerificationTabs from "@/components/verification/VerificationTabs";
import VerificationTierSummaryCard from "@/components/verification/VerificationTierSummaryCard";
import {
  getVerificationDashboardData,
  startVerificationTier,
} from "@/lib/verification/service";
import type {
  VerificationDashboardData,
  VerificationTabKey,
  VerificationTier,
} from "@/lib/verification/types";

function extractErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong while loading verification data.";
}

function HistoryButton({
  disabled = false,
  children,
  onClick,
}: {
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E7EAF3] bg-white text-[#6B7287] transition hover:-translate-y-0.5 hover:border-[#D9DEEC] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}

function InlineRetryState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className={cardClassName("p-6")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF3F3] text-[#D95252]">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#1D243C]">Unable to load verification</h2>
            <p className="mt-1 text-sm text-[#7E8498]">{message}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#D5DAE7] bg-white px-4 text-sm font-semibold text-[#202742] transition hover:border-primary-300 hover:text-primary-600"
        >
          <RefreshCcw className="h-4 w-4" />
          Retry
        </button>
      </div>
    </div>
  );
}

export default function VerificationStatusPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<VerificationDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingTierId, setStartingTierId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  const urlTab = useMemo<VerificationTabKey>(() => {
    const tab = searchParams.get("tab");
    if (tab === "tier-1" || tab === "tier-2" || tab === "tier-3") {
      return tab;
    }
    return "overview";
  }, [searchParams]);

  const activeTab = urlTab;

  useEffect(() => {
    let cancelled = false;

    async function loadVerificationData() {
      setIsLoading(true);
      setError(null);

      try {
        const nextData = await getVerificationDashboardData();
        if (cancelled) return;
        setData(nextData);
      } catch (nextError) {
        if (cancelled) return;
        setError(extractErrorMessage(nextError));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadVerificationData();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function updateTab(nextTab: VerificationTabKey) {
    setActionError(null);

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextTab === "overview") {
        params.delete("tab");
      } else {
        params.set("tab", nextTab);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  async function handleStartTier(tier: VerificationTier) {
    if (tier.actionState !== "available") return;

    setActionError(null);
    setStartingTierId(tier.id);

    try {
      const response = await startVerificationTier(tier.id as 2 | 3);
      updateTab(response.nextTab);
    } catch (nextError) {
      setActionError(extractErrorMessage(nextError));
    } finally {
      setStartingTierId(null);
    }
  }

  const currentTier = useMemo(() => {
    if (!data) return null;
    return data.tiers.find((tier) => tier.current) ?? data.tiers[0] ?? null;
  }, [data]);

  const visibleTiers = useMemo(() => {
    if (!data) return [];
    return activeTab === "overview"
      ? data.tiers
      : data.tiers.filter((tier) => tier.key === activeTab);
  }, [activeTab, data]);

  const selectedTier = useMemo(() => {
    if (!data) return null;
    if (activeTab === "overview") return currentTier;
    return data.tiers.find((tier) => tier.key === activeTab) ?? currentTier;
  }, [activeTab, currentTier, data]);

  const selectedLimitProfile = useMemo(() => {
    if (!data || !selectedTier) return null;
    return data.limits.find((profile) => profile.tierId === selectedTier.id) ?? null;
  }, [data, selectedTier]);

  if (isLoading && !data) {
    return <VerificationPageSkeleton />;
  }

  if (!data || !selectedLimitProfile || !currentTier) {
    return (
      <section className="space-y-6">
        <div className="border-b border-[#E8EBF3] pb-5">
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-2">
              <HistoryButton onClick={() => router.back()}>
                <ChevronLeft className="h-4 w-4" />
              </HistoryButton>
              <HistoryButton disabled>
                <ChevronRight className="h-4 w-4" />
              </HistoryButton>
            </div>
            <div className="pt-0.5">
              <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-[#171D32]">
                Verification
              </h1>
              <p className="mt-1 text-sm text-[#7E8498]">
                Manage your identity and compliance levels
              </p>
            </div>
          </div>
        </div>

        <InlineRetryState
          message={error ?? "Verification data is currently unavailable."}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="border-b border-[#E8EBF3] pb-5">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2">
            <HistoryButton onClick={() => router.back()}>
              <ChevronLeft className="h-4 w-4" />
            </HistoryButton>
            <HistoryButton disabled>
              <ChevronRight className="h-4 w-4" />
            </HistoryButton>
          </div>

          <div className="pt-0.5">
            <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-[#171D32]">
              Verification
            </h1>
            <p className="mt-1 text-sm text-[#7E8498]">{data.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <VerificationTierSummaryCard
          tiers={data.tiers}
          startingTierId={startingTierId}
          onStartTier={handleStartTier}
        />

        <VerificationTabs
          activeTab={activeTab}
          tabs={data.tabs}
          tiers={data.tiers}
          onChange={updateTab}
        />

        {actionError ? (
          <div className="flex items-start gap-3 rounded-xl border border-[#FFD8D8] bg-[#FFF7F7] px-4 py-3 text-sm text-[#C15757]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        ) : null}

        {error ? (
          <div
            className={mergeClasses(
              "flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm",
              "border-[#FFE1C0] bg-[#FFF8F0] text-[#B07828]",
            )}
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="font-semibold text-[#94621E] transition hover:text-[#734A0F]"
            >
              Retry
            </button>
          </div>
        ) : null}

        <div
          id={`verification-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`verification-tab-${activeTab}`}
          className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]"
        >
          <VerificationRequirementsCard tiers={visibleTiers} onSelectTab={updateTab} />
          <VerificationLimitsCard profile={selectedLimitProfile} />
        </div>
      </div>
    </section>
  );
}
