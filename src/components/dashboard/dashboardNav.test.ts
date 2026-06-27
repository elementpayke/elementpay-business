import { describe, expect, it } from "vitest";
import { dashboardNavGroups, isDashboardNavItemActive } from "@/components/dashboard/dashboardNav";

describe("dashboard navigation model", () => {
  it("groups primary dashboard routes for the left sidebar", () => {
    expect(dashboardNavGroups.map((group) => group.label)).toEqual([
      "Main",
      "Money movement",
      "Business tools",
      "Support",
    ]);
    expect(dashboardNavGroups.flatMap((group) => group.items.map((item) => item.href))).toContain(
      "/dashboard/invoices/create",
    );
  });

  it("uses exact matching for overview and prefix matching for nested sections", () => {
    expect(isDashboardNavItemActive("/dashboard", "/dashboard")).toBe(true);
    expect(isDashboardNavItemActive("/dashboard", "/dashboard/wallets")).toBe(false);
    expect(isDashboardNavItemActive("/dashboard/invoices/create", "/dashboard/invoices/create")).toBe(true);
    expect(isDashboardNavItemActive("/dashboard/wallets", "/dashboard/wallets/usd")).toBe(true);
    expect(isDashboardNavItemActive("/dashboard/wallets", "/dashboard/wallets-foo")).toBe(false);
  });

  it("keeps invoicing active across invoice routes", () => {
    const invoicingItem = dashboardNavGroups
      .flatMap((group) => group.items)
      .find((item) => item.href === "/dashboard/invoices/create");

    expect(invoicingItem).toBeDefined();
    expect(isDashboardNavItemActive(invoicingItem!, "/dashboard/invoices/preview")).toBe(true);
  });
});
