import type { ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";

function mergeClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export { mergeClasses };

export function cardClassName(className?: string) {
  return mergeClasses(
    "rounded-2xl border border-[#ECEEF5] bg-white",
    className,
  );
}

export function SearchInput() {
  return (
    <label className="relative hidden md:block">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A4A8B7]" />
      <input
        type="search"
        placeholder="Search"
        className="h-10 w-[260px] rounded-full border border-transparent bg-[#F4F5F9] pl-11 pr-4 text-sm text-[#20243A] outline-none transition focus:border-[#DBDDF0] focus:bg-white"
      />
    </label>
  );
}

export function DropdownTrigger({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <button
      type="button"
      className={mergeClasses(
        "inline-flex items-center gap-1.5 rounded-lg border border-[#E7E8F1] bg-white text-[#5C637A] transition hover:border-[#D5D8E7] hover:text-[#2A3150]",
        compact ? "px-2.5 py-1.5 text-xs font-medium" : "px-3 py-1.5 text-xs font-medium",
      )}
    >
      <span>{label}</span>
      <ChevronDown className="h-3.5 w-3.5" />
    </button>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-[#1C2238]">{title}</h2>
        {description ? <p className="mt-1 text-xs text-[#8D92A6]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function TableWrapper({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={mergeClasses("space-y-4", className)}>{children}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: "bg-[#FFF4DE] text-[#E89A1F] border border-[#FCE3B0]",
    Defaulting: "bg-[#FFE5E5] text-[#E25555] border border-[#FBC9C9]",
    Failed: "bg-[#FFE5E5] text-[#E25555] border border-[#FBC9C9]",
    Successful: "bg-[#E8F8EF] text-[#1E9F72] border border-[#BFE9D2]",
  };

  return (
    <span
      className={mergeClasses(
        "inline-flex rounded-md px-2 py-1 text-[11px] font-medium leading-none",
        styles[status] ?? "bg-[#F1F3F9] text-[#5D647A] border border-[#E2E5EE]",
      )}
    >
      {status}
    </span>
  );
}

export function FilterChip({
  label,
  active = false,
  onRemove,
}: {
  label: string;
  active?: boolean;
  onRemove?: () => void;
}) {
  return (
    <span
      className={mergeClasses(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-primary-200 bg-primary-100/60 text-primary-700"
          : "border-[#E8EAF2] bg-white text-[#7D8398]",
      )}
    >
      {label}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label} filter`}
          className="text-[#A0A6BA] transition hover:text-[#2A3150]"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

export function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const palette = [
    "bg-[#FBE7E0] text-[#C24F2A]",
    "bg-[#E5F2EE] text-[#2C7A6B]",
    "bg-[#EAE6FB] text-[#4F46B8]",
    "bg-[#FFE9F0] text-[#C95479]",
    "bg-[#FFF1D6] text-[#A6741A]",
  ];
  const tone = palette[(initials.charCodeAt(0) || 0) % palette.length];

  return (
    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ${tone}`}>
      {initials}
    </div>
  );
}

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#E8EBF3] pb-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Back"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E7EAF3] bg-white text-[#7D8398] transition hover:border-[#CDD2E0] hover:text-[#2A3150]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Forward"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E7EAF3] bg-white text-[#7D8398] transition hover:border-[#CDD2E0] hover:text-[#2A3150]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#171D32]">{title}</h1>
      </div>
      {actions}
    </div>
  );
}
