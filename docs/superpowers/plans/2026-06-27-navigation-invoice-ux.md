# Navigation Invoice UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved ElementPay dashboard left-sidebar navigation and HEVN-style invoice creation workspace, with Mboka backend support for invoice supporting-document metadata.

**Architecture:** The frontend keeps the current Next.js App Router dashboard guard but changes the dashboard shell to a desktop sidebar plus utility top bar. Invoice creation remains Zustand-driven; editor inputs and live preview read/write the same draft state. The backend preserves optional `details` and `supporting_documents` JSON in invoice draft and issued invoice payloads, with no file upload/storage in this pass.

**Tech Stack:** Next.js 16.2.4 App Router, React 19, Tailwind CSS 4, Zustand, Vitest, FastAPI, Pydantic, pytest, SQLAlchemy JSON payload columns.

---

## Repo Notes

- Frontend repo: `/home/joe/kazi/company/ELEMENTPAY/elementpay-business`
- Backend repo: `/home/joe/kazi/company/ELEMENTPAY/Mboka-Backend`
- The backend worktree already has unrelated dirty files. Use path-specific `git add` and never stage unrelated existing changes.
- The frontend has `.superpowers/` scratch files from brainstorming. Do not commit `.superpowers/`.
- Next.js local docs already read for this plan:
  - `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-pathname.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md`

## File Structure

### Frontend

- Create `src/components/dashboard/dashboardNav.ts`
  - Owns sidebar route groups, icons, and active-route matching.
- Create `src/components/dashboard/dashboardNav.test.ts`
  - Vitest coverage for route grouping and active state.
- Create `src/components/dashboard/DashboardSidebar.tsx`
  - Desktop sidebar and mobile drawer content, driven by `dashboardNav.ts`.
- Create `src/app/dashboard/support/page.tsx`
  - Lightweight support placeholder so the sidebar has no dead route.
- Modify `src/components/dashboard/DashboardNavbar.tsx`
  - Utility bar only; accepts `onOpenSidebar?: () => void` for mobile menu.
- Modify `src/app/dashboard/layout.tsx`
  - Shell becomes sidebar + content area + utility header.
- Modify `src/stores/invoiceStore.ts`
  - Adds supporting-document metadata and add/remove actions.
- Create `src/stores/invoiceStore.test.ts`
  - Covers supporting document metadata behavior.
- Modify `src/stores/invoicePayload.ts`
  - Serializes supporting documents into rich invoice payload.
- Create `src/stores/invoicePayload.test.ts`
  - Covers metadata serialization and no file bytes.
- Modify `src/lib/invoices/api.ts`
  - Exposes/testable backend draft body builder and sends `supporting_documents`.
- Create `src/lib/invoices/api.test.ts`
  - Covers backend draft payload shape.
- Create `src/components/invoices/SupportingDocumentsDropzone.tsx`
  - UI-only file picker storing metadata, with validation.
- Create `src/components/invoices/InvoicePreviewTabs.tsx`
  - PDF, payer, and email preview tabs.
- Create `src/components/invoices/InvoiceWorkspace.tsx`
  - Composes editor pane, preview pane, sticky actions.
- Modify `src/app/dashboard/invoices/create/page.tsx`
  - Delegates to `InvoiceWorkspace` and preserves existing save/proceed behavior.
- Modify `src/components/invoices/InvoicePreview.tsx`
  - Small responsive adjustments so it fits the preview rail.

### Backend

- Modify `/home/joe/kazi/company/ELEMENTPAY/Mboka-Backend/app/schema/invoices.py`
  - Adds `InvoiceSupportingDocumentIn`, `details`, and `supporting_documents` fields.
- Create `/home/joe/kazi/company/ELEMENTPAY/Mboka-Backend/tests/unit/invoices/test_invoice_payload_schema.py`
  - Covers valid metadata, preservation, and rejection of file bytes/unknown fields.
- Modify `/home/joe/kazi/company/ELEMENTPAY/Mboka-Backend/tests/integration/test_invoice_routes.py`
  - Covers draft create + issue preserving metadata and details.
- Modify `/home/joe/kazi/company/ELEMENTPAY/Mboka-Backend/docs/api/fullintegration.md`
  - Documents `details` and `supporting_documents`.
- Modify `/home/joe/kazi/company/ELEMENTPAY/mobile-app/docs/loop/api-contract.md`
  - Notes the backend invoice metadata contract as backend-only/business-dashboard usage.

---

### Task 1: Backend Invoice Metadata Schema

**Files:**
- Create: `/home/joe/kazi/company/ELEMENTPAY/Mboka-Backend/tests/unit/invoices/test_invoice_payload_schema.py`
- Modify: `/home/joe/kazi/company/ELEMENTPAY/Mboka-Backend/app/schema/invoices.py`

- [ ] **Step 1: Write the failing schema tests**

Create `/home/joe/kazi/company/ELEMENTPAY/Mboka-Backend/tests/unit/invoices/test_invoice_payload_schema.py`:

```python
"""Invoice payload schema tests for dashboard metadata."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.schema.invoices import DraftPayloadIn


def test_draft_payload_preserves_details_and_supporting_documents():
    payload = DraftPayloadIn(
        line_items=[{"description": "Design", "quantity": 1, "unit_price": 250}],
        currency="USD",
        notes="Thank you",
        client_name="Acme Ltd",
        client_email="finance@acme.example",
        client_phone="+254711111111",
        details={"invoice": {"id": "inv-2026-0001"}, "meta": {"schemaVersion": 1}},
        supporting_documents=[
            {
                "id": "doc-1",
                "name": "statement.pdf",
                "size_bytes": 524288,
                "mime_type": "application/pdf",
            }
        ],
    )

    dumped = payload.model_dump()

    assert dumped["details"]["invoice"]["id"] == "inv-2026-0001"
    assert dumped["supporting_documents"] == [
        {
            "id": "doc-1",
            "name": "statement.pdf",
            "size_bytes": 524288,
            "mime_type": "application/pdf",
        }
    ]


def test_supporting_documents_reject_file_bytes():
    with pytest.raises(ValidationError) as exc:
        DraftPayloadIn(
            line_items=[],
            currency="USD",
            supporting_documents=[
                {
                    "id": "doc-1",
                    "name": "statement.pdf",
                    "size_bytes": 12,
                    "mime_type": "application/pdf",
                    "file_bytes": "JVBERi0xLjQ=",
                }
            ],
        )

    assert "file_bytes" in str(exc.value)
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/Mboka-Backend
source myenv/bin/activate
pytest tests/unit/invoices/test_invoice_payload_schema.py -q
```

Expected: FAIL because `DraftPayloadIn` does not preserve `details` or define `supporting_documents` with strict metadata fields.

- [ ] **Step 3: Implement the minimal schema change**

In `/home/joe/kazi/company/ELEMENTPAY/Mboka-Backend/app/schema/invoices.py`, add `ConfigDict` to the import and insert the metadata model above `DraftPayloadIn`:

```python
from pydantic import BaseModel, ConfigDict, Field
```

```python
class InvoiceSupportingDocumentIn(BaseModel):
    """Metadata only. Invoice file upload/storage is out of scope."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=128)
    name: str = Field(min_length=1, max_length=255)
    size_bytes: int = Field(ge=0, le=20 * 1024 * 1024)
    mime_type: str = Field(min_length=1, max_length=120)
```

Then update `DraftPayloadIn`:

```python
class DraftPayloadIn(BaseModel):
    """Flexible draft body — line items, totals, counterparty, etc."""

    line_items: list[dict[str, Any]] = Field(default_factory=list)
    currency: str = Field(default="KES", max_length=10)
    notes: str | None = None
    client_name: str | None = None
    client_email: str | None = None
    client_phone: str | None = None
    details: dict[str, Any] | None = None
    supporting_documents: list[InvoiceSupportingDocumentIn] = Field(
        default_factory=list,
        max_length=10,
    )
```

- [ ] **Step 4: Run the test to verify GREEN**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/Mboka-Backend
source myenv/bin/activate
pytest tests/unit/invoices/test_invoice_payload_schema.py -q
```

Expected: PASS.

- [ ] **Step 5: Commit backend schema task**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/Mboka-Backend
git add app/schema/invoices.py tests/unit/invoices/test_invoice_payload_schema.py
git commit -m "feat: preserve invoice supporting document metadata"
```

---

### Task 2: Backend Invoice Route Preservation And Docs

**Files:**
- Modify: `/home/joe/kazi/company/ELEMENTPAY/Mboka-Backend/tests/integration/test_invoice_routes.py`
- Modify: `/home/joe/kazi/company/ELEMENTPAY/Mboka-Backend/docs/api/fullintegration.md`
- Modify: `/home/joe/kazi/company/ELEMENTPAY/mobile-app/docs/loop/api-contract.md`

- [ ] **Step 1: Write the failing integration assertion**

In `/home/joe/kazi/company/ELEMENTPAY/Mboka-Backend/tests/integration/test_invoice_routes.py`, update the first draft create payload in `test_invoice_draft_issue_pdf_flow`:

```python
        json={
            "title": "Consulting",
            "payload": {
                "line_items": [{"desc": "Work", "amount": "100"}],
                "currency": "KES",
                "details": {"invoice": {"id": "inv-local-001"}},
                "supporting_documents": [
                    {
                        "id": "doc-1",
                        "name": "statement.pdf",
                        "size_bytes": 524288,
                        "mime_type": "application/pdf",
                    }
                ],
            },
        },
```

Immediately after `draft_id = r.json()["data"]["id"]`, add:

```python
    draft_payload = r.json()["data"]["payload"]
    assert draft_payload["details"]["invoice"]["id"] == "inv-local-001"
    assert draft_payload["supporting_documents"][0]["name"] == "statement.pdf"
```

Immediately after `inv_id = r3.json()["data"]["id"]`, add:

```python
    issued_payload = r3.json()["data"]["payload"]
    assert issued_payload["details"]["invoice"]["id"] == "inv-local-001"
    assert issued_payload["supporting_documents"][0]["mime_type"] == "application/pdf"
```

- [ ] **Step 2: Run the integration test to verify RED if Task 1 was not applied**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/Mboka-Backend
source myenv/bin/activate
pytest tests/integration/test_invoice_routes.py::test_invoice_draft_issue_pdf_flow -q
```

Expected before Task 1 GREEN: FAIL because the schema drops unknown payload fields. Expected after Task 1 GREEN: PASS, because persistence already stores payload JSON.

- [ ] **Step 3: Update backend invoice API docs**

In `/home/joe/kazi/company/ELEMENTPAY/Mboka-Backend/docs/api/fullintegration.md`, update the Create draft JSON example to include:

```json
    "details": {
      "invoice": {
        "id": "inv-local-001"
      },
      "meta": {
        "source": "elementpay-dashboard",
        "schemaVersion": 1
      }
    },
    "supporting_documents": [
      {
        "id": "doc-1",
        "name": "statement.pdf",
        "size_bytes": 524288,
        "mime_type": "application/pdf"
      }
    ]
```

Below the example, add:

```markdown
`supporting_documents` is metadata only. Do not send file bytes to this endpoint. Binary upload/storage and attachment download URLs are not part of the invoice API contract in this version.
```

- [ ] **Step 4: Update mobile loop API contract**

In `/home/joe/kazi/company/ELEMENTPAY/mobile-app/docs/loop/api-contract.md`, under **Backend-only routes**, adjust the invoice row:

```markdown
| Invoices | `/api/v1/invoices/*` | Business-dashboard/backend-only. Draft payload preserves optional `details` and metadata-only `supporting_documents`; no file bytes/upload storage. |
```

- [ ] **Step 5: Run backend invoice tests**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/Mboka-Backend
source myenv/bin/activate
pytest tests/unit/invoices/test_invoice_payload_schema.py tests/unit/invoices/test_invoices_routes.py tests/integration/test_invoice_routes.py -q
```

Expected: PASS.

- [ ] **Step 6: Commit backend route/docs task**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/Mboka-Backend
git add tests/integration/test_invoice_routes.py docs/api/fullintegration.md ../mobile-app/docs/loop/api-contract.md
git commit -m "test: preserve invoice metadata through issue flow"
```

---

### Task 3: Frontend Dashboard Navigation Model

**Files:**
- Create: `/home/joe/kazi/company/ELEMENTPAY/elementpay-business/src/components/dashboard/dashboardNav.ts`
- Create: `/home/joe/kazi/company/ELEMENTPAY/elementpay-business/src/components/dashboard/dashboardNav.test.ts`

- [ ] **Step 1: Write the failing navigation tests**

Create `src/components/dashboard/dashboardNav.test.ts`:

```typescript
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
    expect(isDashboardNavItemActive("/dashboard/invoices/create", "/dashboard/invoices/create/preview")).toBe(true);
    expect(isDashboardNavItemActive("/dashboard/wallets", "/dashboard/wallets/usd")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/elementpay-business
npm test -- src/components/dashboard/dashboardNav.test.ts
```

Expected: FAIL because `dashboardNav.ts` does not exist.

- [ ] **Step 3: Implement the navigation model**

Create `src/components/dashboard/dashboardNav.ts`:

```typescript
import {
  ArrowLeftRight,
  Banknote,
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
  badge?: string;
  icon: ComponentType<{ className?: string }>;
};

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavItem[];
};

export const dashboardNavGroups: DashboardNavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Treasury AI", href: "/dashboard/treasury-copilot", badge: "Beta", icon: Sparkles },
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
      { label: "Invoicing", href: "/dashboard/invoices/create", icon: ReceiptText },
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

export function isDashboardNavItemActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
```

- [ ] **Step 4: Run the test to verify GREEN**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/elementpay-business
npm test -- src/components/dashboard/dashboardNav.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit navigation model**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/elementpay-business
git add src/components/dashboard/dashboardNav.ts src/components/dashboard/dashboardNav.test.ts
git commit -m "feat: add dashboard sidebar navigation model"
```

---

### Task 4: Frontend Sidebar Shell

**Files:**
- Create: `src/components/dashboard/DashboardSidebar.tsx`
- Create: `src/app/dashboard/support/page.tsx`
- Modify: `src/components/dashboard/DashboardNavbar.tsx`
- Modify: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Confirm Task 3 tests are still green**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/elementpay-business
npm test -- src/components/dashboard/dashboardNav.test.ts
```

Expected: PASS. This is the TDD guard for shell active-state behavior.

- [ ] **Step 2: Implement `DashboardSidebar`**

Create `src/components/dashboard/DashboardSidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  dashboardNavGroups,
  isDashboardNavItemActive,
} from "@/components/dashboard/dashboardNav";

type DashboardSidebarProps = {
  mobile?: boolean;
  onClose?: () => void;
};

export default function DashboardSidebar({ mobile = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`flex h-full flex-col border-r border-border bg-surface ${
        mobile ? "w-full" : "w-[248px]"
      }`}
    >
      <div className="flex h-[72px] items-center justify-between px-5">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
            <span className="block h-3 w-3 rounded-sm bg-white" />
          </span>
          <span className="text-[15px] font-semibold text-[#1C2238] dark:text-white">
            ElementPay
          </span>
        </Link>
        {mobile ? (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6B7287] hover:bg-[#F4F5F9]"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 pb-5">
        {dashboardNavGroups.map((group) => (
          <div key={group.label} className={group.label === "Support" ? "mt-auto" : ""}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8E93A7]">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isDashboardNavItemActive(item.href, pathname);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
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
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: Update `DashboardNavbar` to utility bar only**

Modify `src/components/dashboard/DashboardNavbar.tsx`:

```tsx
import { Bell, ChevronDown, Menu, Settings } from "lucide-react";
```

Update the component signature:

```tsx
export default function DashboardNavbar({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
```

Replace the `<header>` opening and logo block with:

```tsx
    <header className="grid h-[72px] grid-cols-[auto_1fr_auto] items-center gap-4">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={onOpenSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6B7287] transition hover:bg-[#F4F5F9] lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
```

Keep the greeting and right-side actions. Remove the old ElementPay logo block from this top bar.

- [ ] **Step 4: Add support route placeholder**

Create `src/app/dashboard/support/page.tsx`:

```tsx
import PlaceholderPage from "@/components/dashboard/PlaceholderPage";

export default function SupportPage() {
  return (
    <PlaceholderPage
      title="Contact Support"
      description="Support conversations, ticket history, and account help can live here without breaking the dashboard navigation shell."
    />
  );
}
```

- [ ] **Step 5: Update dashboard layout shell**

Modify `src/app/dashboard/layout.tsx`:

```tsx
import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
```

Remove the `DashboardTabs` import and all tab bar JSX. Add state inside `DashboardLayout`:

```tsx
  const [sidebarOpen, setSidebarOpen] = useState(false);
```

Replace the final authenticated return with:

```tsx
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <DashboardSidebar />
        </div>

        {sidebarOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation backdrop"
              className="absolute inset-0 bg-black/35"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-[282px] max-w-[86vw] bg-surface shadow-xl">
              <DashboardSidebar mobile onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="w-full border-b border-border bg-surface">
            <div className="mx-auto max-w-[1480px] px-5 md:px-7 lg:px-10">
              <DashboardNavbar onOpenSidebar={() => setSidebarOpen(true)} />
            </div>
          </div>

          <main className="mx-auto min-w-0 max-w-[1480px] overflow-x-hidden px-5 pb-10 pt-6 md:px-7 lg:px-10">
            {children}
          </main>
        </div>
      </div>

      <DevStatusBar />
    </div>
  );
```

- [ ] **Step 6: Verify shell tests and lint**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/elementpay-business
npm test -- src/components/dashboard/dashboardNav.test.ts
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit sidebar shell**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/elementpay-business
git add src/components/dashboard/DashboardSidebar.tsx src/components/dashboard/DashboardNavbar.tsx src/app/dashboard/layout.tsx src/app/dashboard/support/page.tsx
git commit -m "feat: move dashboard navigation to sidebar"
```

---

### Task 5: Frontend Supporting Document State And Payload

**Files:**
- Create: `src/stores/invoiceStore.test.ts`
- Modify: `src/stores/invoiceStore.ts`
- Create: `src/stores/invoicePayload.test.ts`
- Modify: `src/stores/invoicePayload.ts`
- Create: `src/lib/invoices/api.test.ts`
- Modify: `src/lib/invoices/api.ts`

- [ ] **Step 1: Write failing store tests**

Create `src/stores/invoiceStore.test.ts`:

```typescript
import { beforeEach, describe, expect, it } from "vitest";
import { useInvoiceStore } from "@/stores/invoiceStore";

describe("invoice supporting documents", () => {
  beforeEach(() => {
    useInvoiceStore.getState().resetDraft();
  });

  it("adds and removes supporting document metadata without storing file bytes", () => {
    useInvoiceStore.getState().addSupportingDocument({
      id: "doc-1",
      name: "statement.pdf",
      sizeBytes: 524288,
      mimeType: "application/pdf",
    });

    expect(useInvoiceStore.getState().draft.supportingDocuments).toEqual([
      {
        id: "doc-1",
        name: "statement.pdf",
        sizeBytes: 524288,
        mimeType: "application/pdf",
      },
    ]);

    useInvoiceStore.getState().removeSupportingDocument("doc-1");
    expect(useInvoiceStore.getState().draft.supportingDocuments).toEqual([]);
  });
});
```

- [ ] **Step 2: Run store test to verify RED**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/elementpay-business
npm test -- src/stores/invoiceStore.test.ts
```

Expected: FAIL because `supportingDocuments`, `addSupportingDocument`, and `removeSupportingDocument` do not exist.

- [ ] **Step 3: Implement store metadata**

In `src/stores/invoiceStore.ts`, add:

```typescript
export type SupportingDocumentMetadata = {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
};
```

Add to `InvoiceDraft`:

```typescript
  supportingDocuments: SupportingDocumentMetadata[];
```

Add to `createInitialDraft()`:

```typescript
    supportingDocuments: [],
```

Add to `InvoiceState`:

```typescript
  addSupportingDocument: (document: SupportingDocumentMetadata) => void;
  removeSupportingDocument: (id: string) => void;
```

Add to the store:

```typescript
  addSupportingDocument: (document) =>
    set((state) => ({
      draft: {
        ...state.draft,
        supportingDocuments: [
          ...state.draft.supportingDocuments.filter((d) => d.id !== document.id),
          document,
        ],
      },
    })),
  removeSupportingDocument: (id) =>
    set((state) => ({
      draft: {
        ...state.draft,
        supportingDocuments: state.draft.supportingDocuments.filter((d) => d.id !== id),
      },
    })),
```

- [ ] **Step 4: Run store test to verify GREEN**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/elementpay-business
npm test -- src/stores/invoiceStore.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing payload tests**

Create `src/stores/invoicePayload.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { buildInvoicePayload } from "@/stores/invoicePayload";
import type { InvoiceDraft } from "@/stores/invoiceStore";

const baseDraft: InvoiceDraft = {
  invoiceTitle: "June services",
  invoiceId: "inv-2026-0001",
  issueDate: "2026-06-27",
  dueDate: "2026-07-27",
  biller: {
    firstName: "Joseph",
    lastName: "Thuku",
    email: "joseph@example.com",
    country: "KE",
    phone: "711111111",
    address: "Nairobi",
  },
  client: {
    firstName: "Acme",
    lastName: "Finance",
    email: "finance@acme.example",
    country: "KE",
    phone: "722222222",
    address: "Westlands",
  },
  receivingWalletId: "wallet-kes",
  preferredCurrency: "USD",
  preferredPaymentMethod: "mpesa_paybill",
  paymentMethodFields: {},
  lineItems: [{ id: "li-1", description: "Design", quantity: 1, unitPrice: 250 }],
  vatEnabled: false,
  vatPercent: 0,
  discountEnabled: false,
  discountPercent: 0,
  shippingEnabled: false,
  shippingAmount: 0,
  note: "Thank you",
  supportingDocuments: [
    {
      id: "doc-1",
      name: "statement.pdf",
      sizeBytes: 524288,
      mimeType: "application/pdf",
    },
  ],
};

describe("buildInvoicePayload", () => {
  it("serializes supporting document metadata without file bytes", () => {
    const payload = buildInvoicePayload(baseDraft, "draft");

    expect(payload.supportingDocuments).toEqual([
      {
        id: "doc-1",
        name: "statement.pdf",
        sizeBytes: 524288,
        mimeType: "application/pdf",
      },
    ]);
    expect(JSON.stringify(payload)).not.toContain("file");
  });
});
```

- [ ] **Step 6: Run payload test to verify RED**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/elementpay-business
npm test -- src/stores/invoicePayload.test.ts
```

Expected: FAIL because `InvoiceCreatePayload` has no `supportingDocuments`.

- [ ] **Step 7: Implement payload serialization**

In `src/stores/invoicePayload.ts`, import the type:

```typescript
  type SupportingDocumentMetadata,
```

Add:

```typescript
export type InvoicePayloadSupportingDocument = {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
};
```

Add to `InvoiceCreatePayload`:

```typescript
  supportingDocuments: InvoicePayloadSupportingDocument[];
```

Add helper:

```typescript
function serializeSupportingDocuments(
  documents: SupportingDocumentMetadata[],
): InvoicePayloadSupportingDocument[] {
  return documents.map((document) => ({
    id: document.id,
    name: document.name,
    sizeBytes: document.sizeBytes,
    mimeType: document.mimeType,
  }));
}
```

Add inside `buildInvoicePayload`:

```typescript
    supportingDocuments: serializeSupportingDocuments(draft.supportingDocuments),
```

- [ ] **Step 8: Run payload test to verify GREEN**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/elementpay-business
npm test -- src/stores/invoicePayload.test.ts
```

Expected: PASS.

- [ ] **Step 9: Write failing API shape test**

Create `src/lib/invoices/api.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { buildDraftRequestBody } from "@/lib/invoices/api";
import type { InvoiceCreatePayload } from "@/stores/invoicePayload";

describe("invoice API draft body", () => {
  it("sends supporting document metadata to Mboka without file bytes", () => {
    const payload = {
      status: "draft",
      invoice: {
        id: "inv-2026-0001",
        title: "June services",
        issueDate: "2026-06-27",
        dueDate: "2026-07-27",
        currency: "USD",
        receivingWalletId: "wallet-usd",
        note: "Thanks",
      },
      biller: {} as InvoiceCreatePayload["biller"],
      client: {
        fullName: "Acme Ltd",
        email: "finance@acme.example",
        phone: { e164: "+254711111111", raw: "711111111", dialCode: "+254" },
      } as InvoiceCreatePayload["client"],
      paymentMethod: { rail: null, label: null, fields: {} },
      lineItems: [{ id: "li-1", position: 1, description: "Design", quantity: 1, unitPrice: 250, amount: 250 }],
      charges: {
        vat: { enabled: false, percent: 0 },
        discount: { enabled: false, percent: 0 },
        shipping: { enabled: false, amount: 0 },
      },
      totals: { subtotal: 250, vat: 0, discount: 0, shipping: 0, total: 250 },
      supportingDocuments: [{ id: "doc-1", name: "statement.pdf", sizeBytes: 1, mimeType: "application/pdf" }],
      meta: { source: "elementpay-dashboard", schemaVersion: 1, createdAt: "2026-06-27T00:00:00.000Z" },
    } satisfies InvoiceCreatePayload;

    const body = buildDraftRequestBody(payload);

    expect(body.payload.supporting_documents).toEqual([
      { id: "doc-1", name: "statement.pdf", size_bytes: 1, mime_type: "application/pdf" },
    ]);
    expect(body.payload.details).toBe(payload);
    expect(JSON.stringify(body)).not.toContain("file_bytes");
  });
});
```

- [ ] **Step 10: Run API test to verify RED**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/elementpay-business
npm test -- src/lib/invoices/api.test.ts
```

Expected: FAIL because `buildDraftRequestBody` is not exported and `supporting_documents` is not mapped.

- [ ] **Step 11: Implement API body builder**

In `src/lib/invoices/api.ts`, rename private `buildDraftBody` to exported `buildDraftRequestBody`:

```typescript
export function buildDraftRequestBody(payload: InvoiceCreatePayload) {
  return {
    title: payload.invoice.title || null,
    due_date: payload.invoice.dueDate || null,
    payload: buildDraftPayload(payload),
  };
}
```

Update `buildDraftPayload` return:

```typescript
    supporting_documents: payload.supportingDocuments.map((document) => ({
      id: document.id,
      name: document.name,
      size_bytes: document.sizeBytes,
      mime_type: document.mimeType,
    })),
    details: payload,
```

Update `createDraft` and `updateDraft` calls to use `buildDraftRequestBody(payload)`.

- [ ] **Step 12: Run frontend focused tests**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/elementpay-business
npm test -- src/stores/invoiceStore.test.ts src/stores/invoicePayload.test.ts src/lib/invoices/api.test.ts
```

Expected: PASS.

- [ ] **Step 13: Commit supporting metadata frontend**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/elementpay-business
git add src/stores/invoiceStore.ts src/stores/invoiceStore.test.ts src/stores/invoicePayload.ts src/stores/invoicePayload.test.ts src/lib/invoices/api.ts src/lib/invoices/api.test.ts
git commit -m "feat: send invoice supporting document metadata"
```

---

### Task 6: Invoice Workspace UI

**Files:**
- Create: `src/components/invoices/SupportingDocumentsDropzone.tsx`
- Create: `src/components/invoices/InvoicePreviewTabs.tsx`
- Create: `src/components/invoices/InvoiceWorkspace.tsx`
- Modify: `src/app/dashboard/invoices/create/page.tsx`
- Modify: `src/components/invoices/InvoicePreview.tsx`

- [ ] **Step 1: Confirm data tests are green before UI**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/elementpay-business
npm test -- src/stores/invoiceStore.test.ts src/stores/invoicePayload.test.ts src/lib/invoices/api.test.ts
```

Expected: PASS.

- [ ] **Step 2: Implement supporting document drop zone**

Create `src/components/invoices/SupportingDocumentsDropzone.tsx`:

```tsx
"use client";

import { FileUp, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useInvoiceStore } from "@/stores/invoiceStore";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);

function makeDocumentId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export default function SupportingDocumentsDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const documents = useInvoiceStore((s) => s.draft.supportingDocuments);
  const addSupportingDocument = useInvoiceStore((s) => s.addSupportingDocument);
  const removeSupportingDocument = useInvoiceStore((s) => s.removeSupportingDocument);
  const [error, setError] = useState<string | null>(null);

  function addFiles(files: FileList | null) {
    setError(null);
    for (const file of Array.from(files ?? [])) {
      if (file.size > MAX_FILE_SIZE) {
        setError("Supporting documents must be 20MB or less.");
        continue;
      }
      if (!ACCEPTED_TYPES.has(file.type)) {
        setError("Use PDF, PNG, or JPG supporting documents.");
        continue;
      }
      addSupportingDocument({
        id: makeDocumentId(file),
        name: file.name,
        sizeBytes: file.size,
        mimeType: file.type,
      });
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="space-y-3">
      <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#1C2238]">
        Supporting documents
        <span className="ml-1 text-xs font-medium text-[#9CA3B6]">(optional)</span>
      </h2>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex min-h-[112px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#D7DEEA] bg-[#FAFBFE] px-4 text-center transition hover:border-primary-300 hover:bg-white"
      >
        <FileUp className="h-5 w-5 text-[#5F667D]" />
        <span className="text-sm font-medium text-[#1F2640]">Upload supporting documents</span>
        <span className="text-xs text-[#8E93A7]">PDF, PNG, or JPG up to 20MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="application/pdf,image/png,image/jpeg"
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
      {error ? <p className="text-xs text-[#E35D5B]">{error}</p> : null}
      {documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between rounded-lg border border-[#ECEEF4] bg-white px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate text-[#1F2640]">{document.name}</span>
              <button
                type="button"
                aria-label={`Remove ${document.name}`}
                onClick={() => removeSupportingDocument(document.id)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#E35D5B] hover:bg-[#FFF5F4]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 3: Implement preview tabs**

Create `src/components/invoices/InvoicePreviewTabs.tsx`:

```tsx
"use client";

import { useState } from "react";
import InvoicePreview from "@/components/invoices/InvoicePreview";
import { calculateTotals, formatInvoiceMoney, useInvoiceStore } from "@/stores/invoiceStore";

type PreviewMode = "pdf" | "payer" | "email";

const tabs: Array<{ id: PreviewMode; label: string }> = [
  { id: "pdf", label: "PDF Preview" },
  { id: "payer", label: "Payer Preview" },
  { id: "email", label: "Email Preview" },
];

export default function InvoicePreviewTabs() {
  const [mode, setMode] = useState<PreviewMode>("pdf");
  const draft = useInvoiceStore((s) => s.draft);
  const totals = calculateTotals(draft);
  const currency = draft.preferredCurrency || "USD";
  const clientName = [draft.client.firstName, draft.client.lastName].filter(Boolean).join(" ") || "Customer";

  return (
    <aside className="space-y-3">
      <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-[#DDE3EE] bg-white p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={`h-8 rounded-md text-xs font-semibold transition ${
              mode === tab.id ? "bg-[#EEF2F7] text-[#101827]" : "text-[#5F667D] hover:bg-[#F6F8FB]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="min-h-[680px] overflow-hidden rounded-xl border border-[#E1E6EF] bg-white p-5 shadow-[0_6px_24px_rgba(16,24,40,0.04)]">
        {mode === "pdf" ? <InvoicePreview compact /> : null}
        {mode === "payer" ? (
          <div className="space-y-5 text-sm text-[#1F2640]">
            <h2 className="text-lg font-semibold">Pay invoice</h2>
            <p>{clientName} will see the invoice total and payment instructions here.</p>
            <div className="rounded-lg bg-[#F6F8FB] p-4">
              <p className="text-xs text-[#8E93A7]">Amount due</p>
              <p className="mt-1 text-2xl font-bold text-[#101827]">
                {formatInvoiceMoney(totals.total, currency)}
              </p>
            </div>
          </div>
        ) : null}
        {mode === "email" ? (
          <div className="space-y-4 text-sm text-[#1F2640]">
            <p className="text-xs uppercase tracking-[0.08em] text-[#8E93A7]">Subject</p>
            <h2 className="text-lg font-semibold">Invoice {draft.invoiceId}</h2>
            <p>Hello {clientName},</p>
            <p>Your invoice is ready. The total due is {formatInvoiceMoney(totals.total, currency)}.</p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Add compact prop to `InvoicePreview`**

In `src/components/invoices/InvoicePreview.tsx`, update signature:

```tsx
export default function InvoicePreview({ compact = false }: { compact?: boolean }) {
```

Use `compact` to reduce top-level spacing:

```tsx
    <article className={compact ? "space-y-5 text-[13px]" : "space-y-8"}>
```

Where the line-item table has many columns, add horizontal overflow for compact rail:

```tsx
        <div className="overflow-x-auto rounded-xl border border-[#ECEEF4]">
```

- [ ] **Step 5: Implement workspace component**

Create `src/components/invoices/InvoiceWorkspace.tsx` by moving the save/proceed/discard handlers from the current create page into this component. The rendered layout should follow this structure:

```tsx
return (
  <section className="-mx-5 -mt-6 min-h-[calc(100vh-72px)] bg-[#EEF3F8] md:-mx-7 lg:-mx-10">
    <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-[minmax(0,1fr)_minmax(380px,42vw)]">
      <div className="flex min-h-0 flex-col border-r border-[#DDE3EE] bg-white">
        <header className="flex items-center justify-between border-b border-[#E8EBF3] px-6 py-5">
          {/* Back button, title, step indicator, save status */}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-[900px] space-y-7">
            <InvoiceDetailsSection />
            <div className="grid gap-6 xl:grid-cols-2">
              <BillerCardContainer />
              <ClientCardContainer />
            </div>
            <LineItemsTable />
            <PricingSummary />
            <InvoiceNotes />
            <SupportingDocumentsDropzone />
            <PaymentDetailsSection />
          </div>
        </div>
        <footer className="sticky bottom-0 flex items-center justify-between border-t border-[#E8EBF3] bg-white px-6 py-4">
          {/* Back, Save draft, Next */}
        </footer>
      </div>
      <div className="min-h-0 overflow-y-auto bg-[#EEF3F8] p-5">
        <InvoicePreviewTabs />
      </div>
    </div>
  </section>
);
```

The handlers must retain the current behavior:

```tsx
const validation = validateInvoiceDraft(draft, "issued");
const payload = buildInvoicePayload(draft, "draft");
const saved = draftId != null ? await updateDraft(draftId, payload) : await createDraft(payload);
setDraftId(saved.id);
router.push("/dashboard/invoices/preview");
```

- [ ] **Step 6: Replace create page with workspace**

Modify `src/app/dashboard/invoices/create/page.tsx`:

```tsx
import InvoiceWorkspace from "@/components/invoices/InvoiceWorkspace";

export default function CreateInvoicePage() {
  return <InvoiceWorkspace />;
}
```

- [ ] **Step 7: Run frontend verification**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/elementpay-business
npm test
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 8: Commit invoice workspace**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/elementpay-business
git add src/components/invoices/SupportingDocumentsDropzone.tsx src/components/invoices/InvoicePreviewTabs.tsx src/components/invoices/InvoiceWorkspace.tsx src/app/dashboard/invoices/create/page.tsx src/components/invoices/InvoicePreview.tsx
git commit -m "feat: redesign invoice creation workspace"
```

---

### Task 7: End-To-End Verification

**Files:**
- No planned source changes unless verification finds bugs.

- [ ] **Step 1: Run backend focused tests**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/Mboka-Backend
source myenv/bin/activate
pytest tests/unit/invoices/test_invoice_payload_schema.py tests/unit/invoices/test_invoices_routes.py tests/integration/test_invoice_routes.py -q
```

Expected: PASS.

- [ ] **Step 2: Run frontend verification**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/elementpay-business
npm test
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 3: Start local services if not already running**

Run:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/Mboka-Backend
source myenv/bin/activate
uvicorn app.main:app --reload --port 8000
```

In a separate terminal:

```bash
cd /home/joe/kazi/company/ELEMENTPAY/elementpay-business
npm run dev
```

- [ ] **Step 4: Manual browser checks**

Open `http://localhost:3000/dashboard/invoices/create` and verify:

- Desktop dashboard uses a left sidebar.
- Top bar only contains utility actions.
- Mobile width exposes a menu button and sidebar drawer.
- Invoice create page shows editor on the left and live preview tabs on the right.
- Adding/removing a supporting document shows metadata only.
- Save draft still reaches `POST /api/v1/invoices/drafts`.
- Next still saves and routes to the existing preview/send flow.

- [ ] **Step 5: Inspect git status before final report**

Run:

```bash
git -C /home/joe/kazi/company/ELEMENTPAY/elementpay-business status --short
git -C /home/joe/kazi/company/ELEMENTPAY/Mboka-Backend status --short
git -C /home/joe/kazi/company/ELEMENTPAY/mobile-app status --short
```

Expected:

- Frontend should only show `.superpowers/` untracked unless intentionally cleaned.
- Backend may still show pre-existing unrelated dirty files. Confirm our touched files are committed.
- Mobile app should only show the contract doc change if it was committed with backend path-specific add.
