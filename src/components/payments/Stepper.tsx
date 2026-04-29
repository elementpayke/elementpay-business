"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Stepper – pixel-perfect replica of the Figma "Progress Indicator" component
//
// Layout  : Three steps arranged in a single row.
//           Each step = icon (above) + label (below).
//           A horizontal connector line runs between each pair of steps.
//
// States  :
//   • completed  – icon & label in teal  (#00B2A9 / or primary blue depending on step)
//   • active     – icon & label in brand blue (#4F68F0)
//   • pending    – icon & label in muted gray (#9EA3BF)
//
// Connector :
//   • The portion between two *completed* steps is brand blue.
//   • All other portions are light gray (#E2E8F2).
// ─────────────────────────────────────────────────────────────────────────────

interface StepperProps {
  currentStep: 1 | 2 | 3;
  allComplete?: boolean;
}

// ── Icon SVGs ──────────────────────────────────────────────────────────────
// Each icon is rendered as a plain SVG so we can swap stroke/fill via props.

function RecipientIcon({ color }: { color: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Head */}
      <circle cx="10" cy="6" r="3.25" stroke={color} strokeWidth="1.5" />
      {/* Shoulders */}
      <path
        d="M3.5 17c0-3.314 2.91-6 6.5-6s6.5 2.686 6.5 6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PaymentAmountIcon({ color }: { color: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle */}
      <circle cx="10" cy="10" r="7.25" stroke={color} strokeWidth="1.5" />
      {/* Dollar sign vertical bar */}
      <line x1="10" y1="5.5" x2="10" y2="14.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Top arc */}
      <path
        d="M7.5 7.5C7.5 6.672 8.672 6 10 6s2.5.672 2.5 1.5S11.328 9 10 9 7.5 8.328 7.5 7.5Z"
        stroke={color}
        strokeWidth="1.5"
      />
      {/* Bottom arc */}
      <path
        d="M12.5 12.5c0 .828-1.172 1.5-2.5 1.5s-2.5-.672-2.5-1.5S8.672 11 10 11s2.5.672 2.5 1.5Z"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ReviewIcon({ color }: { color: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Document body */}
      <rect
        x="3.75"
        y="2.75"
        width="12.5"
        height="14.5"
        rx="1.5"
        stroke={color}
        strokeWidth="1.5"
      />
      {/* Lines */}
      <line x1="7" y1="7" x2="13" y2="7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="10" x2="13" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="13" x2="10.5" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Colour helpers ─────────────────────────────────────────────────────────

const BLUE = "#3D63DD";          // active / completed icon + label (vivid indigo-blue)
const TEAL = "#00B5AD";          // completed step 1 accent (matches Figma teal)
const GRAY_ICON = "#B0B7D0";     // pending icon
const GRAY_LABEL = "#9EA3BF";    // pending label text
const LINE_ACTIVE = "#3D63DD";   // connector line – done/active segment
const LINE_PENDING = "#E2E8F2";  // connector line – pending segment

type StepState = "completed" | "active" | "pending";

function stepState(stepNum: number, current: number, allComplete: boolean): StepState {
  if (allComplete || stepNum < current) return "completed";
  if (stepNum === current) return "active";
  return "pending";
}

function iconColor(state: StepState, stepNum: number): string {
  if (state === "pending") return GRAY_ICON;
  // Step 1 uses teal when completed to match the Figma accent, active steps use blue
  if (state === "completed" && stepNum === 1) return TEAL;
  return BLUE;
}

function labelColor(state: StepState): string {
  if (state === "pending") return GRAY_LABEL;
  return BLUE;
}

// ── Connector line ─────────────────────────────────────────────────────────

function Connector({ active }: { active: boolean }) {
  return (
    <div
      className="flex-1 h-[1.5px] mb-[18px] transition-colors duration-300"
      style={{ backgroundColor: active ? LINE_ACTIVE : LINE_PENDING }}
    />
  );
}

// ── Single step node ───────────────────────────────────────────────────────

const STEP_ICONS = [RecipientIcon, PaymentAmountIcon, ReviewIcon];
const STEP_LABELS = ["Recipient details", "Payment amount", "Payment review"];

function StepNode({
  stepNum,
  state,
}: {
  stepNum: number;
  state: StepState;
}) {
  const Icon = STEP_ICONS[stepNum - 1];
  const label = STEP_LABELS[stepNum - 1];
  const iColor = iconColor(state, stepNum);
  const lColor = labelColor(state);

  return (
    <div className="flex flex-col items-center gap-[6px] min-w-0 w-[72px] sm:w-[88px]">
      {/* Icon wrapper – subtle circular background on active/completed */}
      <div
        className="flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-300"
        style={{
          backgroundColor:
            state === "pending"
              ? "#F3F4F8"
              : state === "completed" && stepNum === 1
              ? "#E6F9F8"
              : "#EEF1FD",
        }}
      >
        <Icon color={iColor} />
      </div>

      {/* Label */}
      <span
        className="text-[10px] sm:text-[11px] font-medium leading-tight text-center break-words transition-colors duration-300"
        style={{ color: lColor }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Main Stepper ───────────────────────────────────────────────────────────

export default function Stepper({
  currentStep,
  allComplete = false,
}: StepperProps) {
  const s1 = stepState(1, currentStep, allComplete);
  const s2 = stepState(2, currentStep, allComplete);
  const s3 = stepState(3, currentStep, allComplete);

  // Connector turns blue as soon as the left step is active or completed
  const c1Active = s1 === "active" || s1 === "completed" || allComplete;
  const c2Active = s2 === "active" || s2 === "completed" || allComplete;

  return (
    <div className="w-full rounded-2xl border border-[#E8EBF3] bg-white px-4 py-4 sm:px-8 sm:py-5">
      <div className="flex items-center">
        <StepNode stepNum={1} state={s1} />
        <Connector active={c1Active} />
        <StepNode stepNum={2} state={s2} />
        <Connector active={c2Active} />
        <StepNode stepNum={3} state={s3} />
      </div>
    </div>
  );
}
