import type { ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";

function mergeClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export { mergeClasses };

export function cardClassName(className?: string) {
  return mergeClasses(
    "rounded-2xl border border-border bg-surface",
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
        className="h-10 w-[260px] rounded-full border border-transparent bg-[#F4F5F9] pl-11 pr-4 text-sm text-[#20243A] outline-none transition focus:border-[#DBDDF0] focus:bg-white dark:bg-[#1e2235] dark:text-white dark:focus:bg-[#252a3d]"
      />
    </label>
  );
}

export function DropdownTrigger({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <button
      type="button"
      className={mergeClasses(
        "inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface text-foreground-muted transition hover:text-foreground",
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
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-xs text-foreground-muted">{description}</p> : null}
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
    Pending: "bg-[#FFF4DE] text-[#E89A1F] border border-[#FCE3B0] dark:bg-[#2e2008] dark:border-[#5a3e10]",
    Defaulting: "bg-[#FFE5E5] text-[#E25555] border border-[#FBC9C9] dark:bg-[#2e0808] dark:border-[#5a1010]",
    Failed: "bg-[#FFE5E5] text-[#E25555] border border-[#FBC9C9] dark:bg-[#2e0808] dark:border-[#5a1010]",
    Successful: "bg-[#E8F8EF] text-[#1E9F72] border border-[#BFE9D2] dark:bg-[#0d2b20] dark:border-[#1a4d35]",
  };

  return (
    <span
      className={mergeClasses(
        "inline-flex rounded-md px-2 py-1 text-[11px] font-medium leading-none",
        styles[status] ?? "bg-[#F1F3F9] text-[#5D647A] border border-[#E2E5EE] dark:bg-[#1e2235] dark:text-foreground-muted dark:border-border",
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
          : "border-border bg-surface text-foreground-muted",
      )}
    >
      {label}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label} filter`}
          className="text-foreground-muted transition hover:text-foreground"
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
    <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Back"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-foreground-muted transition hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Forward"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-foreground-muted transition hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">{title}</h1>
      </div>
      {actions}
    </div>
  );
}