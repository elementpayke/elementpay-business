import { afterEach, describe, expect, it, vi } from "vitest";
import { login } from "@/lib/auth";

describe("auth API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs into the business auth endpoint for dashboard sessions", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "success",
          message: "Login successful.",
          data: {
            access_token: "access-token",
            refresh_token: "refresh-token",
            token_type: "bearer",
            business_id: 1,
            wallet_address: "0xA4782E5A357869409cAf6B6F7dF6b384B2cf4Bc3",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await login({ email: "jane@example.com", password: "String123345" });

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/businesses/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "jane@example.com",
        password: "String123345",
      }),
    });
  });
});
