import { describe, expect, it } from "vitest";
import {
  buildPendingAction,
  isPendingConfirmation,
  MUTATING_TOOLS,
  READ_TOOLS,
  requiresConfirmation,
  summarizeAction,
} from "@/lib/treasury/copilotPolicy";

describe("copilotPolicy", () => {
  it("classifies read vs mutating tools", () => {
    for (const name of READ_TOOLS) {
      expect(requiresConfirmation(name)).toBe(false);
    }
    for (const name of MUTATING_TOOLS) {
      expect(requiresConfirmation(name)).toBe(true);
    }
  });

  it("summarizes bulk payout actions", () => {
    const summary = summarizeAction("mboka_execute_bulk_payouts", {
      items: [{}, {}],
    });
    expect(summary).toContain("2");
  });

  it("builds pending confirmation cards", () => {
    const pending = buildPendingAction("mboka_issue_invoice", { draft_id: 4 });
    expect(pending.status).toBe("pending_confirmation");
    expect(pending.summary).toContain("4");
    expect(isPendingConfirmation(pending)).toBe(true);
    expect(isPendingConfirmation({ status: "ok" })).toBe(false);
  });
});
