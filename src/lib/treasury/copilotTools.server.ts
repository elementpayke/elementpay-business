/**
 * Server-only Mboka tool dispatch for treasury BFF (when copilot API is not deployed).
 */

import type { AccountBlock } from "@/lib/orders";
import {
  buildPendingAction,
  requiresConfirmation,
  type PendingConfirmation,
} from "@/lib/treasury/copilotPolicy";

const MBOKA_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const OFFRAMP_TOKEN = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";
const PROBE_CRYPTO = "10";

export type TreasuryPayoutItem = {
  external_order_id: string;
  country: string;
  currency: string;
  fiat_amount?: string;
  crypto_amount?: string;
  destination: AccountBlock;
};

async function mbokaFetch<T>(
  path: string,
  authHeader: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${MBOKA_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
      ...(init?.headers as Record<string, string>),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (body as { message?: string }).message ||
      (body as { detail?: string }).detail ||
      res.statusText;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return ((body as { data?: T }).data ?? body) as T;
}

export async function resolveRefundAddress(authHeader: string): Promise<string> {
  const summary = await mbokaFetch<{
    totals?: { wallet_address?: string | null };
  }>("/api/v1/dashboard/summary", authHeader);

  const fromSummary = summary?.totals?.wallet_address;
  if (fromSummary) return fromSummary;

  const txns = await mbokaFetch<{
    items?: Array<{ wallet_address?: string | null }>;
  }>("/api/v1/transactions", authHeader);
  const fromTxn = txns.items?.find((row) => row.wallet_address)?.wallet_address;
  if (fromTxn) return fromTxn;

  throw new Error(
    "Treasury wallet is not ready for this account. Open the dashboard once, then retry.",
  );
}

async function fiatToCrypto(
  authHeader: string,
  refundAddress: string,
  item: TreasuryPayoutItem,
): Promise<string> {
  if (item.crypto_amount) return item.crypto_amount;
  if (!item.fiat_amount) throw new Error("fiat_amount or crypto_amount required");

  const fx = await mbokaFetch<{ rates?: Record<string, number> }>(
    "/api/v1/exchange-rates",
    authHeader,
    { method: "GET" },
  );
  let rate = fx?.rates?.[item.currency];
  const fiatTarget = Number(item.fiat_amount);

  if (typeof rate !== "number" || rate <= 0) {
    const probe = await createQuote(authHeader, refundAddress, {
      ...item,
      crypto_amount: PROBE_CRYPTO,
    });
    const achieved = Number(probe.amounts?.user_receives?.amount || 0);
    rate =
      achieved > 0
        ? achieved / Number(PROBE_CRYPTO)
        : Number(probe.amounts?.rate || 0);
  }
  if (!rate || rate <= 0) throw new Error(`No FX rate for ${item.currency}`);
  return (fiatTarget / rate).toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

async function createQuote(
  authHeader: string,
  refundAddress: string,
  item: TreasuryPayoutItem & { crypto_amount: string },
) {
  return mbokaFetch<{
    quote_id: string;
    amounts: {
      user_receives: { amount: string };
      rate: string | null;
    };
  }>("/api/v1/orders/quote", authHeader, {
    method: "POST",
    body: JSON.stringify({
      order_type: "OffRamp",
      token: OFFRAMP_TOKEN,
      currency: item.currency,
      country: item.country,
      crypto_amount: item.crypto_amount,
      refund_address: refundAddress,
      destination: item.destination,
      external_order_id: item.external_order_id,
    }),
  });
}

const PAYOUT_TOOLS = new Set([
  "mboka_preview_bulk_payouts",
  "mboka_execute_bulk_payouts",
]);

export type CopilotToolContext = {
  authHeader: string;
  refundAddress?: string;
};

async function ensureRefundAddress(ctx: CopilotToolContext): Promise<string> {
  if (ctx.refundAddress) return ctx.refundAddress;
  ctx.refundAddress = await resolveRefundAddress(ctx.authHeader);
  return ctx.refundAddress;
}

export async function dispatchCopilotTool(
  name: string,
  args: Record<string, unknown>,
  ctx: CopilotToolContext,
): Promise<unknown> {
  if (requiresConfirmation(name) && !args.user_confirmed) {
    return buildPendingAction(name, args);
  }

  const needsWallet = PAYOUT_TOOLS.has(name);
  const refundAddress = needsWallet ? await ensureRefundAddress(ctx) : ctx.refundAddress ?? "";

  switch (name) {
    case "mboka_get_treasury_summary":
      return mbokaFetch("/api/v1/dashboard/summary", ctx.authHeader);
    case "mboka_get_exchange_rates":
      return mbokaFetch("/api/v1/exchange-rates", ctx.authHeader, { method: "GET" });
    case "mboka_list_transactions":
      return mbokaFetch("/api/v1/transactions", ctx.authHeader);
    case "mboka_list_invoices":
      return mbokaFetch(
        `/api/v1/invoices${args.status ? `?status=${encodeURIComponent(String(args.status))}` : ""}`,
        ctx.authHeader,
      );
    case "mboka_list_invoice_drafts":
      return mbokaFetch("/api/v1/invoices/drafts", ctx.authHeader);
    case "mboka_list_contacts": {
      const [invoices, drafts] = await Promise.all([
        mbokaFetch<{ items?: Array<{ payload?: Record<string, unknown> }> }>(
          "/api/v1/invoices",
          ctx.authHeader,
        ),
        mbokaFetch<{ items?: Array<{ payload?: Record<string, unknown> }> }>(
          "/api/v1/invoices/drafts",
          ctx.authHeader,
        ),
      ]);
      const seen = new Map<string, { name: string; email: string; phone: string }>();
      for (const row of [...(invoices.items || []), ...(drafts.items || [])]) {
        const payload = row.payload || {};
        const contactName = String(payload.client_name || "").trim();
        if (!contactName) continue;
        const key = contactName.toLowerCase();
        if (!seen.has(key)) {
          seen.set(key, {
            name: contactName,
            email: String(payload.client_email || ""),
            phone: String(payload.client_phone || ""),
          });
        }
      }
      return { contacts: [...seen.values()], source: "invoices_and_drafts" };
    }
    case "mboka_preview_bulk_payouts": {
      const items = (args.items as TreasuryPayoutItem[]) || [];
      const previews = [];
      for (const raw of items) {
        const crypto = await fiatToCrypto(ctx.authHeader, ctx.refundAddress, raw);
        const quote = await createQuote(ctx.authHeader, ctx.refundAddress, {
          ...raw,
          crypto_amount: crypto,
        });
        previews.push({
          external_order_id: raw.external_order_id,
          quote_id: quote.quote_id,
          crypto_amount: crypto,
          fiat_amount: quote.amounts?.user_receives?.amount,
          rate: quote.amounts?.rate,
        });
      }
      return previews;
    }
    case "mboka_execute_bulk_payouts": {
      const items = (args.items as TreasuryPayoutItem[]) || [];
      const results = [];
      for (const raw of items) {
        try {
          const crypto = await fiatToCrypto(ctx.authHeader, ctx.refundAddress, raw);
          const quote = await createQuote(ctx.authHeader, ctx.refundAddress, {
            ...raw,
            crypto_amount: crypto,
          });
          const accepted = await mbokaFetch<{
            merchant_order_id: number;
            order?: { psp_transaction_id?: string | null };
          }>(
            `/api/v1/orders/${encodeURIComponent(quote.quote_id)}/accept`,
            ctx.authHeader,
            { method: "POST", body: JSON.stringify({}) },
          );
          results.push({
            external_order_id: raw.external_order_id,
            merchant_order_id: accepted.merchant_order_id,
            tx_hash: accepted.order?.psp_transaction_id,
          });
        } catch (err) {
          results.push({
            external_order_id: raw.external_order_id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
      return { status: "executed", results };
    }
    case "mboka_create_invoice_draft":
      return mbokaFetch("/api/v1/invoices/drafts", ctx.authHeader, {
        method: "POST",
        body: JSON.stringify({
          title: args.title ?? null,
          due_date: args.due_date ?? null,
          payload: args.payload,
        }),
      });
    case "mboka_issue_invoice":
      return mbokaFetch("/api/v1/invoices", ctx.authHeader, {
        method: "POST",
        body: JSON.stringify({
          draft_id: args.draft_id,
          send_via: args.send_via ?? "none",
        }),
      });
    case "mboka_send_invoice":
      return mbokaFetch(
        `/api/v1/invoices/${encodeURIComponent(String(args.invoice_id))}/send`,
        ctx.authHeader,
        {
          method: "POST",
          body: JSON.stringify({
            send_via: args.send_via,
            to_email: args.to_email ?? null,
            to_phone_e164: args.to_phone_e164 ?? null,
          }),
        },
      );
    case "mboka_mark_invoice_paid":
      return mbokaFetch(
        `/api/v1/invoices/${encodeURIComponent(String(args.invoice_id))}/mark-paid`,
        ctx.authHeader,
        {
          method: "POST",
          body: JSON.stringify({
            reference: args.reference ?? null,
            payment_method: args.payment_method ?? "other",
          }),
        },
      );
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export function isPendingConfirmation(value: unknown): value is PendingConfirmation {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as PendingConfirmation).status === "pending_confirmation"
  );
}

export const COPILOT_TOOLS = [
  { name: "mboka_get_treasury_summary", description: "Wallet balance, 30d in/out.", parameters: { type: "object", properties: {} } },
  { name: "mboka_get_exchange_rates", description: "FX rates.", parameters: { type: "object", properties: {} } },
  { name: "mboka_list_transactions", description: "Recent orders.", parameters: { type: "object", properties: { limit: { type: "number" } } } },
  { name: "mboka_list_invoices", description: "Issued invoices.", parameters: { type: "object", properties: { status: { type: "string" } } } },
  { name: "mboka_list_invoice_drafts", description: "Invoice drafts.", parameters: { type: "object", properties: {} } },
  { name: "mboka_list_contacts", description: "Invoice contacts.", parameters: { type: "object", properties: {} } },
  { name: "mboka_preview_bulk_payouts", description: "Quote payouts.", parameters: { type: "object", properties: { items: { type: "array" } }, required: ["items"] } },
  { name: "mboka_execute_bulk_payouts", description: "Execute payouts after confirm.", parameters: { type: "object", properties: { items: { type: "array" }, user_confirmed: { type: "boolean" } }, required: ["items", "user_confirmed"] } },
  { name: "mboka_create_invoice_draft", description: "Create invoice draft.", parameters: { type: "object", properties: { payload: { type: "object" }, user_confirmed: { type: "boolean" } }, required: ["payload", "user_confirmed"] } },
  { name: "mboka_issue_invoice", description: "Issue draft.", parameters: { type: "object", properties: { draft_id: { type: "number" }, user_confirmed: { type: "boolean" } }, required: ["draft_id", "user_confirmed"] } },
  { name: "mboka_send_invoice", description: "Send invoice.", parameters: { type: "object", properties: { invoice_id: { type: "number" }, send_via: { type: "string" }, user_confirmed: { type: "boolean" } }, required: ["invoice_id", "send_via", "user_confirmed"] } },
  { name: "mboka_mark_invoice_paid", description: "Mark paid.", parameters: { type: "object", properties: { invoice_id: { type: "number" }, user_confirmed: { type: "boolean" } }, required: ["invoice_id", "user_confirmed"] } },
];

export function toolsForQvac() {
  return COPILOT_TOOLS.map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

export const COPILOT_SYSTEM_PROMPT = `You are ElementPay Financial Assistant for B2B treasury operations.
Never set user_confirmed true — the user taps Confirm in the UI.
Be concise; preview payouts before execute.`;

export function buildDocumentUserMessage(
  userText: string,
  document?: { name: string; text: string } | null,
): string {
  if (!document?.text?.trim()) return userText;
  return `${userText}\n\n--- Attached document: ${document.name} ---\n${document.text.slice(0, 24_000)}\n--- End document ---`;
}
