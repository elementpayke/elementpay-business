# Agents Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Treasury AI out of the Main sidebar group and into an Agents parent entry under Business tools, while keeping the existing `/dashboard/treasury-copilot` route.

**Architecture:** The navigation model gains nested child items so `Agents` can own `Treasury AI` without changing routes. Active-state logic becomes recursive enough for a parent item to become active when one of its children is active. `DashboardSidebar` renders one visible nested level using the same Next.js `<Link>` behavior already used by the shell.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, lucide-react icons, Tailwind CSS.

---

## File Structure

- Modify: `src/components/dashboard/dashboardNav.ts`
  - Owns route groups, nested `children`, and active-state helpers.
- Modify: `src/components/dashboard/dashboardNav.test.ts`
  - Adds failing tests for the selected Agents/Treasury AI information architecture and parent active state.
- Modify: `src/components/dashboard/DashboardSidebar.tsx`
  - Renders one nested level below parent items and keeps mobile drawer `onClose` behavior for both parent and child links.
- Reference before implementation:
  - `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`
  - The repo-specific `AGENTS.md` requires reading relevant Next docs before code. This guide confirms dashboard navigation should keep using `<Link>` for client-side transitions and prefetching.

---

### Task 1: Write Failing Navigation Model Tests

**Files:**
- Modify: `src/components/dashboard/dashboardNav.test.ts`
- Test: `src/components/dashboard/dashboardNav.test.ts`

- [ ] **Step 1: Replace the existing nav model test file with failing expectations**

```ts
import { describe, expect, it } from "vitest";
import {
  dashboardNavGroups,
  getDashboardNavItemActiveState,
  isDashboardNavItemActive,
} from "@/components/dashboard/dashboardNav";

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

  it("puts Agents under Business tools with Treasury AI as its first child", () => {
    const mainGroup = dashboardNavGroups.find((group) => group.label === "Main");
    const businessToolsGroup = dashboardNavGroups.find((group) => group.label === "Business tools");

    expect(mainGroup?.items.map((item) => item.label)).toEqual(["Overview", "Transactions", "Wallets"]);

    const agentsItem = businessToolsGroup?.items.find((item) => item.label === "Agents");
    expect(agentsItem).toBeDefined();
    expect(agentsItem?.href).toBe("/dashboard/treasury-copilot");
    expect(agentsItem?.children?.map((item) => item.label)).toEqual(["Treasury AI"]);
    expect(agentsItem?.children?.[0]).toMatchObject({
      href: "/dashboard/treasury-copilot",
      badge: "Beta",
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

  it("marks Agents active when Treasury AI is active", () => {
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
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- src/components/dashboard/dashboardNav.test.ts
```

Expected: FAIL because `getDashboardNavItemActiveState` is not exported and `DashboardNavItem` does not have `children`.

- [ ] **Step 3: Commit nothing**

Do not commit a red test by itself unless the user explicitly asks for checkpoint commits. Continue to Task 2.

---

### Task 2: Implement the Nested Navigation Model

**Files:**
- Modify: `src/components/dashboard/dashboardNav.ts`
- Test: `src/components/dashboard/dashboardNav.test.ts`

- [ ] **Step 1: Update imports, item type, nav data, and active helpers**

Replace the complete contents of `src/components/dashboard/dashboardNav.ts` with:

```ts
import {
  ArrowLeftRight,
  Banknote,
  Bot,
  Code2,
  FileText,
  Headphones,
  LayoutDashboard,
  ReceiptText,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  Wallet,
} from "lucide-react";
import type { ComponentType } from "react";

export type DashboardNavItem = {
  label: string;
  href: string;
  activePrefix?: string;
  badge?: string;
  icon: ComponentType<{ className?: string }>;
  children?: DashboardNavItem[];
};

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavItem[];
};

export type DashboardNavItemActiveState = {
  self: boolean;
  child: boolean;
  active: boolean;
};

export const dashboardNavGroups: DashboardNavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
      { label: "Wallets", href: "/dashboard/wallets", icon: Wallet },
    ],
  },
  {
    label: "Money movement",
    items: [
      { label: "Send Payment", href: "/dashboard/send-payment", icon: Send },
      { label: "Bulk Payment", href: "/dashboard/bulk-payment", icon: Upload },
      { label: "Deposit Money", href: "/dashboard/deposit-money", icon: Banknote },
    ],
  },
  {
    label: "Business tools",
    items: [
      {
        label: "Agents",
        href: "/dashboard/treasury-copilot",
        icon: Bot,
        children: [
          {
            label: "Treasury AI",
            href: "/dashboard/treasury-copilot",
            badge: "Beta",
            icon: Sparkles,
          },
        ],
      },
      {
        label: "Invoicing",
        href: "/dashboard/invoices/create",
        activePrefix: "/dashboard/invoices",
        icon: ReceiptText,
      },
      { label: "Reports", href: "/dashboard/reports", icon: FileText },
      { label: "Verification", href: "/dashboard/verification", badge: "Tier 2", icon: ShieldCheck },
      { label: "Developer", href: "/dashboard/developer", icon: Code2 },
    ],
  },
  {
    label: "Support",
    items: [
      { label: "Contact Support", href: "/dashboard/support", icon: Headphones },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function isDashboardNavItemActive(
  item: Pick<DashboardNavItem, "href" | "activePrefix"> | string,
  pathname: string,
): boolean {
  const href = typeof item === "string" ? item : item.href;
  const activePrefix = typeof item === "string" ? undefined : item.activePrefix;

  if (href === "/dashboard") return pathname === href;

  const prefix = activePrefix ?? href;
  return pathname === href || pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getDashboardNavItemActiveState(
  item: DashboardNavItem,
  pathname: string,
): DashboardNavItemActiveState {
  const self = isDashboardNavItemActive(item, pathname);
  const child = item.children?.some((childItem) => isDashboardNavItemActive(childItem, pathname)) ?? false;

  return {
    self,
    child,
    active: self || child,
  };
}
```

- [ ] **Step 2: Run the focused test and verify GREEN**

Run:

```bash
npm test -- src/components/dashboard/dashboardNav.test.ts
```

Expected: PASS for all tests in `dashboardNav.test.ts`.

- [ ] **Step 3: Commit the nav model**

Run:

```bash
git add src/components/dashboard/dashboardNav.ts src/components/dashboard/dashboardNav.test.ts
git commit -m "feat: nest treasury ai under agents nav"
```

---

### Task 3: Render Nested Agents Items In The Sidebar

**Files:**
- Modify: `src/components/dashboard/DashboardSidebar.tsx`
- Test: `src/components/dashboard/dashboardNav.test.ts`

- [ ] **Step 1: Update sidebar imports**

In `src/components/dashboard/DashboardSidebar.tsx`, change the dashboard nav import to:

```ts
import {
  dashboardNavGroups,
  getDashboardNavItemActiveState,
  isDashboardNavItemActive,
} from "@/components/dashboard/dashboardNav";
```

- [ ] **Step 2: Replace parent active calculation in the item loop**

Inside `group.items.map((item) => { ... })`, replace:

```ts
const active = isDashboardNavItemActive(item, pathname);
const Icon = item.icon;
return (
  <Link
    key={item.href}
    href={item.href}
    aria-current={active ? "page" : undefined}
    onClick={onClose}
    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
      active
        ? "bg-primary-100/70 font-semibold text-primary-700"
        : "font-medium text-[#4D556D] hover:bg-[#F4F6FA] hover:text-[#1F2640]"
    }`}
  >
    <Icon className="h-4 w-4 shrink-0" />
    <span className="min-w-0 flex-1 truncate">{item.label}</span>
    {item.badge ? (
      <span className="rounded-full bg-[#FFE8EE] px-2 py-0.5 text-[10px] font-semibold text-[#FF6B8E]">
        {item.badge}
      </span>
    ) : null}
  </Link>
);
```

with:

```tsx
const activeState = getDashboardNavItemActiveState(item, pathname);
const Icon = item.icon;
return (
  <div key={item.href}>
    <Link
      href={item.href}
      aria-current={activeState.active && !item.children?.length ? "page" : undefined}
      onClick={onClose}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
        activeState.active
          ? "bg-primary-100/70 font-semibold text-primary-700"
          : "font-medium text-[#4D556D] hover:bg-[#F4F6FA] hover:text-[#1F2640]"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span className="rounded-full bg-[#FFE8EE] px-2 py-0.5 text-[10px] font-semibold text-[#FF6B8E]">
          {item.badge}
        </span>
      ) : null}
    </Link>
    {item.children?.length ? (
      <div className="mt-1 space-y-1 pl-7">
        {item.children.map((child) => {
          const childActive = isDashboardNavItemActive(child, pathname);
          const ChildIcon = child.icon;
          return (
            <Link
              key={child.href}
              href={child.href}
              aria-current={childActive ? "page" : undefined}
              onClick={onClose}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition ${
                childActive
                  ? "bg-[#F7F9FF] font-semibold text-primary-700"
                  : "font-medium text-[#626B84] hover:bg-[#F4F6FA] hover:text-[#1F2640]"
              }`}
            >
              <ChildIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{child.label}</span>
              {child.badge ? (
                <span className="rounded-full bg-[#FFE8EE] px-2 py-0.5 text-[10px] font-semibold text-[#FF6B8E]">
                  {child.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    ) : null}
  </div>
);
```

- [ ] **Step 3: Run focused nav tests**

Run:

```bash
npm test -- src/components/dashboard/dashboardNav.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run lint for TypeScript/JSX correctness**

Run:

```bash
npm run lint
```

Expected: PASS with no errors.

- [ ] **Step 5: Commit sidebar rendering**

Run:

```bash
git add src/components/dashboard/DashboardSidebar.tsx
git commit -m "feat: render nested dashboard nav items"
```

---

### Task 4: Manual Verification And Final Checks

**Files:**
- No code files unless verification finds a defect.
- Read-only verification of running app.

- [ ] **Step 1: Verify dashboard route responds**

Run:

```bash
curl -sS -I http://localhost:3000/dashboard | sed -n '1,8p'
```

Expected: `HTTP/1.1 200 OK`.

If the frontend is not running, start it in a separate terminal with:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001 \
BUSINESS_API_UPSTREAM_URL=http://127.0.0.1:8001 \
QVAC_API_URL=http://127.0.0.1:11434/v1 \
QVAC_MODEL=llm \
npm run dev
```

Then repeat the curl check.

- [ ] **Step 2: Verify Treasury AI route responds**

Run:

```bash
curl -sS -I http://localhost:3000/dashboard/treasury-copilot | sed -n '1,8p'
```

Expected: `HTTP/1.1 200 OK`.

- [ ] **Step 3: Inspect the sidebar in browser**

Open:

```text
http://localhost:3000/dashboard/treasury-copilot
```

Expected:

- `Main` shows `Overview`, `Transactions`, `Wallets`.
- `Business tools` shows `Agents` before `Invoicing`.
- `Treasury AI` appears indented under `Agents`.
- `Agents` and `Treasury AI` both visually read as active on the Treasury AI page.
- Clicking the nested `Treasury AI` entry keeps the user on `/dashboard/treasury-copilot`.
- On mobile drawer width, `Treasury AI` is visible without hover and tapping it closes the drawer.

- [ ] **Step 4: Run final focused tests**

Run:

```bash
npm test -- src/components/dashboard/dashboardNav.test.ts
```

Expected: PASS.

- [ ] **Step 5: Check git status**

Run:

```bash
git status --short
```

Expected: only intentional untracked `.superpowers/` visual companion files may remain. Do not commit `.superpowers/`.
