"use client";

export type OnboardingStep =
  | "identity"
  | "activity"
  | "address"
  | "associates"
  | "review";

export interface OnboardingStepDefinition {
  key: OnboardingStep;
  label: string;
}

export const ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  { key: "identity", label: "Business" },
  { key: "activity", label: "Activity" },
  { key: "address", label: "Address" },
  { key: "associates", label: "People" },
  { key: "review", label: "Review" },
];

type StepState = "done" | "active" | "upcoming";

function segmentClass(state: StepState) {
  if (state === "done") {
    return "bg-primary-500 dark:bg-primary-500";
  }
  if (state === "active") {
    return "bg-primary-300 dark:bg-primary-700";
  }
  return "bg-gray-200 dark:bg-gray-800";
}

function labelClass(state: StepState) {
  if (state === "active") return "text-gray-900 dark:text-white";
  if (state === "done") return "text-gray-600 dark:text-gray-300";
  return "text-gray-400 dark:text-gray-600";
}

export default function OnboardingStepper({
  current,
  furthestStep,
  onStepChange,
}: {
  current: OnboardingStep;
  furthestStep?: OnboardingStep;
  onStepChange?: (step: OnboardingStep) => void;
}) {
  const stepIndex = ONBOARDING_STEPS.findIndex((s) => s.key === current);
  const furthestStepIndex = Math.max(
    stepIndex,
    furthestStep
      ? ONBOARDING_STEPS.findIndex((s) => s.key === furthestStep)
      : stepIndex,
  );
  const activeLabel = ONBOARDING_STEPS[stepIndex]?.label ?? "";

  const getState = (key: OnboardingStep): StepState => {
    if (key === current) return "active";
    const keyIndex = ONBOARDING_STEPS.findIndex((s) => s.key === key);
    if (keyIndex < stepIndex) return "done";
    return "upcoming";
  };

  return (
    <div
      className="rounded-xl border border-gray-100 bg-white px-3 py-3 shadow-sm dark:border-gray-900 dark:bg-gray-950"
      aria-label="Verification progress"
    >
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-gray-900 dark:text-white">
          Step {stepIndex + 1} of {ONBOARDING_STEPS.length}
        </span>
        <span className="font-medium text-gray-500 dark:text-gray-400">
          {activeLabel}
        </span>
      </div>

      <ol className="grid grid-cols-5 gap-1.5">
        {ONBOARDING_STEPS.map((step, idx) => {
          const state = getState(step.key);
          const canSelect = idx <= furthestStepIndex;

          return (
            <li key={step.key} className="min-w-0">
              <button
                type="button"
                disabled={!canSelect}
                onClick={() => onStepChange?.(step.key)}
                aria-current={state === "active" ? "step" : undefined}
                className="group block w-full min-w-0 text-left disabled:cursor-default"
              >
                <span
                  className={`block h-1.5 rounded-full transition-colors ${segmentClass(state)}`}
                  aria-hidden="true"
                />
                <span
                  className={`mt-1 hidden truncate text-[11px] font-medium sm:block ${labelClass(state)}`}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
