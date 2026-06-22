"use client";

import { useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownToLine, ChevronDown, Copy, Landmark, Wifi } from "lucide-react";
import { mergeClasses } from "@/components/dashboard/DashboardPrimitives";
import { shortAddress } from "@/lib/wallets/wallet-selection";
import { flattenBankAddress, type IbanAccount } from "@/lib/iban/api";

type CopyHandler = (value: string, message?: string) => void;

type IbanAccountCardProps = {
  account: IbanAccount;
  expanded: boolean;
  onToggle: () => void;
  copy: CopyHandler;
};

/** Per-currency look so each card reads as its own piece of plastic. */
type CurrencyTheme = {
  gradient: string;
  glow: string;
  flag: string;
};

const CURRENCY_THEMES: Record<string, CurrencyTheme> = {
  EUR: {
    gradient: "from-[#1f3a8a] via-[#2c4fd6] to-[#0b1d57]",
    glow: "bg-[#5b7bff]",
    flag: "🇪🇺",
  },
  USD: {
    gradient: "from-[#11493b] via-[#1c7a5f] to-[#06251d]",
    glow: "bg-[#36c997]",
    flag: "🇺🇸",
  },
  GBP: {
    gradient: "from-[#3a1c6e] via-[#5b2bb0] to-[#1c0d3a]",
    glow: "bg-[#a06bff]",
    flag: "🇬🇧",
  },
  NGN: {
    gradient: "from-[#0f4d2e] via-[#15803d] to-[#06261a]",
    glow: "bg-[#34d399]",
    flag: "🇳🇬",
  },
  KES: {
    gradient: "from-[#5a1d1d] via-[#9b2c2c] to-[#2a0c0c]",
    glow: "bg-[#f0735a]",
    flag: "🇰🇪",
  },
};

const DEFAULT_THEME: CurrencyTheme = {
  gradient: "from-[#1d2440] via-[#2a3566] to-[#0c1124]",
  glow: "bg-[#6d7dff]",
  flag: "🏦",
};

const SPRING = [0.21, 0.47, 0.32, 0.98] as const;

function themeFor(currency: string): CurrencyTheme {
  return CURRENCY_THEMES[currency?.toUpperCase()] ?? DEFAULT_THEME;
}

/** "DE89370400440532013000" -> "DE89 3704 0044 0532 0130 00" */
function groupIban(iban: string): string {
  return iban
    .replace(/\s+/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

/** Last-4 style preview for the collapsed row, e.g. "•••• 3000". */
function ibanPreview(iban: string): string {
  const clean = iban.replace(/\s+/g, "");
  if (clean.length <= 4) return clean;
  return `•••• ${clean.slice(-4)}`;
}

function StatusBadge({ status, tone = "dark" }: { status: string; tone?: "dark" | "light" }) {
  const isActive = status?.toLowerCase() === "active";
  if (tone === "light") {
    return (
      <span
        className={mergeClasses(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]",
          isActive
            ? "bg-[#E7F7EF] text-[#1A8F5E]"
            : "bg-[#F4F5F9] text-[#5F667D]",
        )}
      >
        <span
          className={mergeClasses(
            "h-1.5 w-1.5 rounded-full",
            isActive ? "bg-[#1FB877]" : "bg-[#A9AEC0]",
          )}
        />
        {status || "—"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm ring-1 ring-white/20">
      <span
        className={mergeClasses(
          "h-1.5 w-1.5 rounded-full",
          isActive ? "bg-[#5dffb0] shadow-[0_0_6px_#5dffb0]" : "bg-white/60",
        )}
      />
      {status || "—"}
    </span>
  );
}

/** Gold EMV chip, drawn with nested rounded rects + contact lines. */
function Chip() {
  return (
    <span className="relative block h-7 w-9 overflow-hidden rounded-[6px] bg-[linear-gradient(135deg,#f6e3a1_0%,#d8b35a_45%,#f3dd97_100%)] shadow-inner ring-1 ring-black/10">
      <span className="absolute inset-x-1 top-1/2 h-px -translate-y-[5px] bg-black/25" />
      <span className="absolute inset-x-1 top-1/2 h-px translate-y-[4px] bg-black/25" />
      <span className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-black/25" />
      <span className="absolute left-1/2 top-1/2 h-3.5 w-4 -translate-x-1/2 -translate-y-1/2 rounded-[3px] ring-1 ring-black/25" />
    </span>
  );
}

function CardCopyButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/80 ring-1 ring-white/15 transition hover:bg-white/20 hover:text-white"
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}

function MetaRow({
  label,
  value,
  onCopy,
  mono,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-[#FAFBFE] px-3.5 py-2.5">
      <span className="text-xs text-[#7E8498]">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={mergeClasses(
            "text-right text-[13px] font-medium text-[#1A2138]",
            mono && "font-mono tracking-tight",
          )}
        >
          {value}
        </span>
        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            aria-label={`Copy ${label.toLowerCase()}`}
            className="shrink-0 text-[#9CA3B6] transition hover:text-primary-500"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function IbanAccountCard({
  account,
  expanded,
  onToggle,
  copy,
}: IbanAccountCardProps) {
  const theme = themeFor(account.currency);
  const grouped = groupIban(account.iban);
  const addressLines = flattenBankAddress(account.bank_address);
  const settleAsset = account.destination_asset?.toUpperCase();
  const settleNetwork = account.destination_network;
  const regionId = useId();

  const settlementRows: { label: string; value: string; copy?: string; mono?: boolean }[] = [];
  if (account.reference) {
    settlementRows.push({ label: "Reference", value: account.reference, copy: account.reference });
  }
  if (account.destination_wallet) {
    settlementRows.push({
      label: "Settles to wallet",
      value: shortAddress(account.destination_wallet),
      copy: account.destination_wallet,
      mono: true,
    });
  }

  return (
    <div
      className={mergeClasses(
        "overflow-hidden rounded-xl border bg-white transition",
        expanded ? "border-[#D9DEEC] shadow-[0_8px_24px_rgba(23,29,50,0.08)]" : "border-[#ECEEF5] hover:border-[#D9DEEC]",
      )}
    >
      {/* Collapsed summary row — deliberately slim and unlike the wallet card. */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={regionId}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
      >
        <span
          className={mergeClasses(
            "flex h-9 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-[15px] shadow-sm ring-1 ring-black/5",
            theme.gradient,
          )}
        >
          <span aria-hidden>{theme.flag}</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-[#1A2138]">
              {account.bank_name || "IBAN account"}
            </p>
            <span className="rounded bg-[#F4F5F9] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5F667D]">
              {account.currency || "IBAN"}
            </span>
          </div>
          <p className="mt-0.5 truncate font-mono text-[11px] text-[#8E93A7]">
            {ibanPreview(account.iban)}
          </p>
        </div>
        <StatusBadge status={account.status} tone="light" />
        <ChevronDown
          className={mergeClasses(
            "h-4 w-4 shrink-0 text-[#9CA3B6] transition-transform duration-300",
            expanded && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.section
            id={regionId}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.34, ease: SPRING }}
            className="overflow-hidden"
            style={{ perspective: 1100 }}
          >
            <div className="space-y-3 px-3.5 pb-4 pt-1">
              {/* The card itself — flips/scales in like a piece of plastic. */}
              <motion.div
                initial={{ rotateX: -16, y: -12, scale: 0.95, opacity: 0 }}
                animate={{ rotateX: 0, y: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 0.45, delay: 0.04, ease: SPRING }}
                style={{ transformStyle: "preserve-3d" }}
                className={mergeClasses(
                  "group relative aspect-[1.586/1] w-full overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-[0_18px_40px_-12px_rgba(13,18,40,0.55)] ring-1 ring-white/10",
                  theme.gradient,
                )}
              >
                {/* Ambient glows + sheen */}
                <span
                  className={mergeClasses(
                    "pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full opacity-40 blur-2xl",
                    theme.glow,
                  )}
                />
                <span className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,255,255,0.18),transparent_45%)]" />
                <span className="pointer-events-none absolute -inset-x-4 -top-2 h-24 -rotate-12 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                {/* Top row: bank + status + contactless */}
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-white/85" />
                    <span className="max-w-[150px] truncate text-[13px] font-semibold tracking-tight text-white/95">
                      {account.bank_name || "Virtual IBAN"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={account.status} />
                    <Wifi className="h-4 w-4 rotate-90 text-white/70" />
                  </div>
                </div>

                {/* Chip */}
                <div className="relative mt-3">
                  <Chip />
                </div>

                {/* IBAN as the card number */}
                <div className="relative mt-2 flex items-end justify-between gap-2">
                  <p className="font-mono text-[clamp(12px,3.6vw,16px)] font-semibold leading-tight tracking-[0.06em] text-white drop-shadow-sm [word-spacing:2px]">
                    {grouped}
                  </p>
                  <CardCopyButton
                    onClick={() => copy(account.iban.replace(/\s+/g, ""), "IBAN copied")}
                    label="Copy IBAN"
                  />
                </div>

                {/* Bottom row: holder + bic + currency */}
                <div className="relative mt-3 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/55">
                      Account holder
                    </p>
                    <p className="truncate text-[12px] font-semibold uppercase tracking-wide text-white/95">
                      {account.account_holder_name || "—"}
                    </p>
                  </div>
                  <div className="flex items-end gap-3">
                    {account.bic ? (
                      <div className="text-right">
                        <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/55">
                          BIC
                        </p>
                        <p className="font-mono text-[12px] font-semibold tracking-wide text-white/95">
                          {account.bic}
                        </p>
                      </div>
                    ) : null}
                    <span className="rounded-md bg-white/15 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white ring-1 ring-white/20">
                      {account.currency || "—"}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Settlement + bank metadata, below the plastic */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.16, ease: SPRING }}
                className="space-y-2"
              >
                {settleAsset || settleNetwork ? (
                  <div className="flex items-center gap-2 rounded-lg bg-primary-100/40 px-3.5 py-2.5 text-[12px] text-primary-700">
                    <ArrowDownToLine className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Deposits settle on-chain as{" "}
                      <span className="font-semibold">{settleAsset || "crypto"}</span>
                      {settleNetwork ? (
                        <>
                          {" "}on <span className="font-semibold">{settleNetwork}</span>
                        </>
                      ) : null}
                      .
                    </span>
                  </div>
                ) : null}

                {settlementRows.map((row) => (
                  <MetaRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    mono={row.mono}
                    onCopy={row.copy ? () => copy(row.copy as string, `${row.label} copied`) : undefined}
                  />
                ))}

                {account.bic ? (
                  <MetaRow
                    label="BIC / SWIFT"
                    value={account.bic}
                    mono
                    onCopy={() => copy(account.bic, "BIC copied")}
                  />
                ) : null}

                {addressLines.length > 0 ? (
                  <div className="rounded-lg bg-[#FAFBFE] px-3.5 py-2.5">
                    <p className="text-xs text-[#7E8498]">Bank address</p>
                    <p className="mt-0.5 text-[13px] font-medium leading-snug text-[#1A2138]">
                      {addressLines.join(", ")}
                    </p>
                  </div>
                ) : null}

                {account.instructions ? (
                  <p className="px-1 text-[11px] leading-relaxed text-[#8E93A7]">
                    {account.instructions}
                  </p>
                ) : null}

                {account.last_updated_at ? (
                  <p className="px-1 text-[10px] text-[#A9AEC0]">
                    Updated {formatUpdatedAt(account.last_updated_at)}
                  </p>
                ) : null}
              </motion.div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function formatUpdatedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
