import { describe, expect, it } from "vitest";
import { BrainCircuit } from "lucide-react";
import {
  dashboardNavGroups,
  getDashboardNavItemActiveState,
  isDashboardNavItemActive,
} from "@/components/dashboard/dashboardNav";
import { dashboardTabs, quickActions } from "@/components/dashboard/dashboardData";

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

  it("puts Agents under Business tools with Nuru as its first child", () => {
    const mainGroup = dashboardNavGroups.find((group) => group.label === "Main");
    const businessToolsGroup = dashboardNavGroups.find((group) => group.label === "Business tools");

    expect(mainGroup?.items.map((item) => item.label)).toEqual(["Overview", "Transactions", "Wallets"]);

    const agentsItem = businessToolsGroup?.items.find((item) => item.label === "Agents");
    expect(agentsItem).toBeDefined();
    expect(agentsItem?.href).toBe("/dashboard/treasury-copilot");
    expect(agentsItem?.children?.map((item) => item.label)).toEqual(["Nuru"]);
    expect(agentsItem?.children?.[0]).toMatchObject({
      href: "/dashboard/treasury-copilot",
      badge: "Beta",
      icon: BrainCircuit,
    });
  });

  it("labels the treasury copilot entry as Nuru across dashboard shortcuts", () => {
    expect(dashboardTabs.find((tab) => tab.href === "/dashboard/treasury-copilot")).toMatchObject({
      label: "Nuru",
      badge: "Beta",
    });
    expect(quickActions.find((action) => action.href === "/dashboard/treasury-copilot")).toMatchObject({
      title: "Nuru",
      description: "Account-aware invoice and payout assistance",
    });
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

  it("marks Agents active when Nuru is active", () => {
    const agentsItem = dashboardNavGroups
      .find((group) => group.label === "Business tools")
      ?.items.find((item) => item.label === "Agents");

    expect(agentsItem).toBeDefined();
    expect(getDashboardNavItemActiveState(agentsItem!, "/dashboard/treasury-copilot")).toEqual({
      self: true,
      child: true,
      active: true,
    });
    expect(getDashboardNavItemActiveState(agentsItem!, "/dashboard/treasury-copilot/session")).toEqual({
      self: true,
      child: true,
      active: true,
    });
  });
});
