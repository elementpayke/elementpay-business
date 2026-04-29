"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock3, ExternalLink } from "lucide-react";

type CallbackState = "success" | "pending" | "error";

function normalizeState(params: URLSearchParams): CallbackState {
  const status = (params.get("status") || params.get("result") || "").toLowerCase();
  const error = params.get("error") || params.get("error_description");
  if (error) return "error";
  if (["success", "approved", "completed", "ok"].includes(status)) return "success";
  if (["error", "failed", "declined", "canceled", "cancelled"].includes(status)) return "error";
  return "pending";
}

function StateBadge({ state }: { state: CallbackState }) {
  if (state === "success") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
        <CheckCircle2 className="h-4 w-4" />
        Onboarding Completed
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-900/20 dark:text-red-300">
        <AlertCircle className="h-4 w-4" />
        Onboarding Not Completed
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
      <Clock3 className="h-4 w-4" />
      Verification In Review
    </div>
  );
}

export default function NoahHostedOnboardingCallbackPage() {
  const searchParams = useSearchParams();

  const state = useMemo(() => normalizeState(searchParams), [searchParams]);
  const errorMessage =
    searchParams.get("error_description") || searchParams.get("error") || "";

  return (
    <section className="mx-auto max-w-2xl py-6 sm:py-10">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:p-8">
        <StateBadge state={state} />

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Noah Business Verification
        </h1>

        {state === "success" ? (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Your hosted onboarding session has been completed. Final status is set asynchronously
            by Noah webhooks, so verification may still appear as submitted for a short period.
          </p>
        ) : state === "error" ? (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            The onboarding session ended with an error or was cancelled. You can return to
            onboarding and try again.
          </p>
        ) : (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Your session returned without an explicit success/error flag. This usually means your
            case is under review. Check verification status in your dashboard.
          </p>
        )}

        {errorMessage ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/verification"
            className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
          >
            Open Verification Center
          </Link>

          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
          >
            Back to Onboarding
          </Link>

          <a
            href="https://docs.noah.com/api-concepts/webhooks/customer"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Noah webhook docs
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
