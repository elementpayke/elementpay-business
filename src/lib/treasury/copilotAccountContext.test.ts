import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchAccountContext,
  formatAccountContext,
  type CopilotMeResponse,
} from "@/lib/treasury/copilotAccountContext";
import { buildCopilotSystemPrompt } from "@/lib/treasury/copilotTools.server";

const me: CopilotMeResponse = {
  user: {
    id: 42,
    email: "owner@mrjt.example",
    email_verified: true,
    kyc_verified: false,
  },
  business: {
    id: 7,
    name: "MRJT Exports",
    legal_name: "MRJT Exports Limited",
    country: "KE",
    status: "active",
    kyb_verified: true,
    registration_number: "REG-123",
  },
  role: "owner",
  kyb_summary: {
    kyb_status: "approved",
    registered_address: {
      street: "14 River Road",
      city: "Nairobi",
      post_code: "00100",
      country: "KE",
    },
    hosted_url: "https://private.example/kyb/session",
    internal_notes: "do not expose",
  },
  wallet_address: "0x1234567890abcdef1234567890abcdef12345678",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("copilot account context", () => {
  it("formats safe authenticated account fields for the assistant", () => {
    const context = formatAccountContext(me);

    expect(context).toContain("Authenticated ElementPay account context");
    expect(context).toContain("User email: owner@mrjt.example");
    expect(context).toContain("User role: owner");
    expect(context).toContain("Business: MRJT Exports");
    expect(context).toContain("Legal name: MRJT Exports Limited");
    expect(context).toContain("Business country: KE");
    expect(context).toContain("Business status: active");
    expect(context).toContain("KYB verified: yes");
    expect(context).toContain("KYB status: approved");
    expect(context).toContain(
      "Registered business address: 14 River Road, Nairobi, 00100, KE",
    );
    expect(context).toContain("Treasury wallet: available");
    expect(context).not.toContain("hosted_url");
    expect(context).not.toContain("internal_notes");
    expect(context).not.toContain("0x1234567890abcdef");
  });

  it("fetches account context from /api/auth/me using the bearer token", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ status: "success", data: me }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const context = await fetchAccountContext(
      "Bearer test-token",
      "https://api.elementpay.test",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.elementpay.test/api/auth/me",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
    expect(context).toContain("Business: MRJT Exports");
  });

  it("treats account context fetch failures as non-fatal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ status: "error", message: "down" }), {
          status: 503,
        }),
      ),
    );

    await expect(
      fetchAccountContext("Bearer test-token", "https://api.elementpay.test"),
    ).resolves.toBeNull();
  });

  it("builds an ElementPay assistant prompt with account context and disclosure policy", () => {
    const prompt = buildCopilotSystemPrompt(formatAccountContext(me));

    expect(prompt).toContain("You are ElementPay's financial assistant");
    expect(prompt).toContain("Authenticated ElementPay account context");
    expect(prompt).toContain("Business: MRJT Exports");
    expect(prompt).toContain("must not disclose");
    expect(prompt).toContain("model");
    expect(prompt).toContain("provider");
    expect(prompt).toContain("Never set user_confirmed true");
  });
});
