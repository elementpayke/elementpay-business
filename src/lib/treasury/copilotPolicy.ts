/** Tools that move money or change Mboka records — require explicit user confirmation. */

export const MUTATING_TOOLS = new Set([
  "mboka_execute_bulk_payouts",
  "mboka_create_invoice_draft",
  "mboka_issue_invoice",
  "mboka_send_invoice",
  "mboka_mark_invoice_paid",
]);

export const READ_TOOLS = new Set([
  "mboka_get_treasury_summary",
  "mboka_get_exchange_rates",
  "mboka_list_transactions",
  "mboka_list_invoices",
  "mboka_list_invoice_drafts",
  "mboka_list_contacts",
  "mboka_preview_bulk_payouts",
]);

export type PendingConfirmation = {
  status: "pending_confirmation";
  action_id: string;
  tool: string;
  args: Record<string, unknown>;
  summary: string;
  message: string;
};

export function requiresConfirmation(toolName: string): boolean {
  return MUTATING_TOOLS.has(toolName);
}

export function summarizeAction(
  tool: string,
  args: Record<string, unknown>,
): string {
  switch (tool) {
    case "mboka_execute_bulk_payouts": {
      const items = (args.items as unknown[]) || [];
      return `Execute ${items.length} supplier payout(s) from USDT treasury`;
    }
    case "mboka_create_invoice_draft": {
      const client = (args.payload as { client_name?: string })?.client_name;
      return `Create invoice draft${client ? ` for ${client}` : ""}`;
    }
    case "mboka_issue_invoice":
      return `Issue invoice from draft #${args.draft_id}`;
    case "mboka_send_invoice":
      return `Send invoice #${args.invoice_id} via ${args.send_via ?? "email"}`;
    case "mboka_mark_invoice_paid":
      return `Mark invoice #${args.invoice_id} as paid`;
    default:
      return `Confirm: ${tool}`;
  }
}

export function buildPendingAction(
  tool: string,
  args: Record<string, unknown>,
): PendingConfirmation {
  return {
    status: "pending_confirmation",
    action_id: crypto.randomUUID(),
    tool,
    args,
    summary: summarizeAction(tool, args),
    message:
      "Review this action below. Nothing runs until you tap Confirm — money movement and record changes always need approval.",
  };
}

export function isPendingConfirmation(
  value: unknown,
): value is PendingConfirmation {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as PendingConfirmation).status === "pending_confirmation"
  );
}
