# Navigation And Invoice UX Design

## Goal

Improve the ElementPay business dashboard UX by moving primary dashboard navigation into a desktop left sidebar and redesigning invoice creation into a guided workspace with a live invoice preview, matching the direction selected from the HEVN reference screens.

## Approved Direction

- Navigation: full left sidebar on desktop.
- Invoice creation: guided editor with a right-side live preview panel.
- Development method: test-driven development for implementation.

## Navigation Design

The dashboard shell will move from the current two-row top navigation (`DashboardNavbar` plus `DashboardTabs`) to a two-column app shell:

- A persistent left sidebar on desktop for primary product navigation.
- A top utility bar for search, currency switching, theme, notifications, and account menu.
- A mobile fallback that hides the sidebar behind a menu/drawer so content remains usable on narrow screens.

The sidebar will group routes by workflow:

- Main: Overview, Treasury AI, Transactions, Wallets.
- Money movement: Send Payment, Bulk Payment, Deposit Money.
- Business tools: Invoicing, Reports, Verification, Developer.
- Support: Contact Support, Settings.

Active route state will be based on `usePathname`, preserving the current exact-match behavior for `/dashboard` and prefix matching for nested dashboard routes.

## Invoice Creation Design

The invoice create page will become a focused invoice workspace:

- Left editor pane: invoice details, customer/client details, line items, discount, memo, supporting documents, and payment details.
- Right preview pane: live preview tabs for `PDF Preview`, `Payer Preview`, and `Email Preview`.
- Sticky footer actions: `Back`, `Save draft`, and a primary `Next` action that validates, saves the draft, and routes to the existing preview/send flow.

The editor should feel closer to the reference than the current long form:

- Use compact sections and fewer visible borders.
- Keep the live preview visible on desktop while editing.
- Collapse to a single-column flow on tablet/mobile, with preview available below the editor or through tabs.
- Add a supporting-documents drop zone UI for optional attachments. Attachments will be represented in local invoice draft state for this UX pass; backend upload/persistence is out of scope.

## Components

New or changed components:

- `DashboardSidebar`: primary route groups, active state, support/settings placement, desktop layout.
- `DashboardNavbar`: utility bar only, no product route navigation.
- `DashboardLayout`: desktop sidebar plus content shell; mobile drawer behavior.
- `InvoiceWorkspace`: create-page composition for editor, preview panel, and sticky actions.
- `InvoicePreviewTabs`: switches between PDF, payer, and email preview modes.
- `SupportingDocumentsDropzone`: optional document picker with file name, size, and removal state.

Existing components to reuse:

- Invoice store and totals helpers from `src/stores/invoiceStore.ts`.
- Draft validation and payload builders from `src/stores/invoicePayload.ts`.
- Draft API functions from `src/lib/invoices/api.ts`.
- Existing invoice form primitives where they still fit.
- Existing `InvoicePreview` for the PDF preview tab, adjusted only as needed for the narrower preview rail.
- Existing send modal and preview route flow.

## Data Flow

Invoice edits continue to update the Zustand invoice draft. The live preview reads from the same store, so edits render immediately without an extra persistence step.

Saving a draft keeps the current behavior:

1. Validate draft requirements for draft mode.
2. Build the invoice payload.
3. Create or update the server-side draft.
4. Store the returned `draftId`.
5. Show inline save status or error.

Proceeding to preview/send keeps the current behavior:

1. Validate issue-ready requirements.
2. Save the latest draft snapshot.
3. Route to the existing invoice preview/send flow.

Supporting documents are UI-only for this pass. File metadata will be stored in the invoice store, but files must not be sent to the existing invoice API.

## Error Handling

- Draft validation errors appear near the sticky actions and should point users to the first missing requirement.
- Save/proceed failures retain the current backend error message behavior.
- Unsupported file types or oversize supporting documents show inline drop-zone errors.
- Mobile drawer state must not block route changes; selecting a sidebar route should close the drawer.

## Testing Strategy

Implementation will use test-driven development:

1. Add or update tests that describe the expected behavior before implementation changes.
2. Run the relevant tests and confirm they fail for the expected reason.
3. Implement the smallest change that satisfies the tests.
4. Re-run tests until they pass.
5. Add focused visual/manual verification for responsive layout and preview behavior.

Targeted test coverage:

- Sidebar route active-state logic and grouped route data.
- Invoice totals still update as line items, discounts, tax, and shipping change.
- Supporting document metadata add/remove behavior.
- Create invoice save/proceed actions preserve existing validation and API call behavior.
- Preview tabs render the correct mode and preserve draft state.

## Out Of Scope

- Backend attachment upload API.
- New invoice email delivery backend behavior.
- Replacing the existing issued invoice/send modal flow.
- Reworking non-dashboard public landing navigation.
