"use client";

import { Building2, Check, Smartphone, UserRound } from "lucide-react";

export type OnboardingStep = "basic-info" | "business-details" | "phone";

interface StepDef {
  key: OnboardingStep;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepDef[] = [
  { key: "basic-info", label: "Basic Info", icon: UserRound },
  { key: "business-details", label: "Business Details", icon: Building2 },
  { key: "phone", label: "Phone Verification", icon: Smartphone },
];

type StepState = "done" | "active" | "upcoming";

function iconClass(state: StepState) {
  if (state === "done") {
    return "bg-primary-500 text-white dark:bg-primary-500";
  }
  if (state === "active") {
    return "bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300";
  }
  return "bg-white text-gray-400 dark:bg-gray-800 dark:text-gray-500";
}

function labelClass(state: StepState) {
  return state === "upcoming"
    ? "text-gray-400 dark:text-gray-500"
    : "text-gray-600 dark:text-gray-300";
}

export default function OnboardingStepper({
  current,
  basicInfoDone,
  businessDetailsDone,
}: {
  current: OnboardingStep;
  basicInfoDone: boolean;
  businessDetailsDone: boolean;
}) {
  const order: OnboardingStep[] = ["basic-info", "business-details", "phone"];
  const currentIdx = order.indexOf(current);

  const getState = (key: OnboardingStep): StepState => {
    if (key === current) return "active";
    const idx = order.indexOf(key);
    if (idx < currentIdx) {
      if (key === "basic-info") return basicInfoDone ? "done" : "upcoming";
      if (key === "business-details") return businessDetailsDone ? "done" : "upcoming";
      return "done";
    }
    return "upcoming";
  };

  return (
    <ol
      className="flex w-full items-center gap-4 rounded-2xl bg-gray-100/90 px-5 py-4 sm:gap-6 sm:px-6 dark:bg-gray-900/70"
      aria-label="Verification progress"
    >
      {STEPS.map((step, idx) => {
        const state = getState(step.key);
        const Icon = step.icon;
        const isLast = idx === STEPS.length - 1;
        const nextState = !isLast ? getState(STEPS[idx + 1].key) : "upcoming";
        const connectorDone = state === "done" || (state === "active" && nextState !== "upcoming");

        return (
          <li
            key={step.key}
            className={`flex min-w-0 items-center gap-3 ${isLast ? "" : "flex-1"}`}
          >
            <div className="flex min-w-0 flex-col items-center gap-2">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${iconClass(state)}`}
                aria-current={state === "active" ? "step" : undefined}
              >
                {state === "done" ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </span>

              <p
                className={`truncate text-xs font-medium sm:text-sm ${labelClass(state)}`}
              >
                {step.label}
              </p>
            </div>

            {!isLast ? (
              <span
                className={`mb-6 h-0.5 flex-1 rounded-full ${
                  connectorDone
                    ? "bg-primary-400 dark:bg-primary-700"
                    : "bg-gray-300 dark:bg-gray-700"
                }`}
                aria-hidden="true"
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
