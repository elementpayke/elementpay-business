# Agent Response UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Treasury AI responses feel like the approved HEVN-style direction B: clean chat bubbles plus a structured invoice intake card for obvious invoice requests.

**Architecture:** Add pure, well-tested treasury UI helpers for invoice intent parsing, intake validation, follow-up message generation, and assistant-message display blocks. Add small presentational components for user bubbles, assistant bubbles, and the invoice intake card. Refactor `TreasuryCopilotChat` to use those components and to short-circuit obvious invoice requests into the local intake-card flow before sending a follow-up through the existing Treasury AI chat API.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest in node mode, lucide-react, Tailwind CSS.

---

## File Structure

- Create: `src/lib/treasury/invoiceIntake.ts`
  - Pure parser, validation, and follow-up message builder for invoice intake cards.
- Create: `src/lib/treasury/invoiceIntake.test.ts`
  - TDD coverage for parsing `invoice jane doe 50$`, validation, and follow-up message output.
- Create: `src/lib/treasury/assistantMessageView.ts`
  - Pure helper that converts assistant text into display blocks without raw thinking tags or raw `**bold**` markers.
- Create: `src/lib/treasury/assistantMessageView.test.ts`
  - TDD coverage for paragraphs, list blocks, markdown cleanup, and thinking-tag removal.
- Create: `src/components/treasury/AssistantMessageBubble.tsx`
  - Presentational assistant bubble with avatar, timestamp, and formatted message blocks.
- Create: `src/components/treasury/UserMessageBubble.tsx`
  - Presentational compact user bubble with timestamp.
- Create: `src/components/treasury/InvoiceIntakeCard.tsx`
  - HEVN-style invoice intake card that validates local fields and emits a structured follow-up message.
- Modify: `src/components/treasury/TreasuryCopilotChat.tsx`
  - Use the new bubble/card components and route obvious invoice requests into the intake-card flow.
- Modify: `src/lib/treasury/formatAssistantMessage.test.ts`
  - Keep existing regression coverage for thinking-tag cleanup.

Notes:

- Do not add React Testing Library in this pass. The repo's Vitest config currently includes only `src/**/*.test.ts`, so keep tests pure TypeScript.
- Do not change Treasury AI backend endpoints or tool schemas.
- Do not replace `PendingActionCard`.

---

### Task 1: Invoice Intake Parser And Validation

**Files:**
- Create: `src/lib/treasury/invoiceIntake.ts`
- Create: `src/lib/treasury/invoiceIntake.test.ts`

- [ ] **Step 1: Write the failing invoice intake tests**

Create `src/lib/treasury/invoiceIntake.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildInvoiceIntakeAssistantMessage,
  buildInvoiceIntakeFollowUpMessage,
  createEmptyInvoiceIntakeFields,
  parseInvoiceIntakeRequest,
  validateInvoiceIntakeFields,
} from "@/lib/treasury/invoiceIntake";

describe("parseInvoiceIntakeRequest", () => {
  it("detects a simple invoice request with client and dollar amount", () => {
    expect(parseInvoiceIntakeRequest("invoice jane doe 50$")).toEqual({
      clientName: "Jane Doe",
      amount: "50.00",
      currency: "USD",
    });
  });

  it("detects a simple invoice request with a for-clause", () => {
    expect(parseInvoiceIntakeRequest("create invoice for acme ltd for $1,200.50")).toEqual({
      clientName: "Acme Ltd",
      amount: "1200.50",
      currency: "USD",
    });
  });

  it("ignores non-invoice requests", () => {
    expect(parseInvoiceIntakeRequest("what is our treasury balance?")).toBeNull();
  });
});

describe("invoice intake copy and validation", () => {
  it("builds the HEVN-style assistant prompt", () => {
    const draft = parseInvoiceIntakeRequest("invoice jane doe 50$");
    expect(draft).not.toBeNull();

    expect(buildInvoiceIntakeAssistantMessage(draft!)).toBe(
      "To draft this invoice I need a couple of details about Jane Doe and your billing address.",
    );
  });

  it("reports required missing fields with stable field keys", () => {
    const draft = parseInvoiceIntakeRequest("invoice jane doe 50$");
    expect(draft).not.toBeNull();

    const result = validateInvoiceIntakeFields(createEmptyInvoiceIntakeFields(), draft!);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual({
      clientEmail: "Jane Doe's email is required.",
      lineItemDescription: "Line item description is required.",
      businessStreetAddress: "Street address is required.",
      businessCity: "City is required.",
      businessCountry: "Country is required.",
      businessPostalCode: "ZIP / postal code is required.",
    });
  });

  it("builds a structured follow-up message for Treasury AI", () => {
    const draft = parseInvoiceIntakeRequest("invoice jane doe 50$");
    expect(draft).not.toBeNull();

    const message = buildInvoiceIntakeFollowUpMessage(draft!, {
      clientEmail: "jane@example.com",
      lineItemDescription: "Services",
      businessStreetAddress: "Kijabe Street",
      businessCity: "Nairobi",
      businessCountry: "KE",
      businessPostalCode: "00800",
    });

    expect(message).toContain("Create an invoice draft with these details:");
    expect(message).toContain("- Client: Jane Doe <jane@example.com>");
    expect(message).toContain("- Amount: USD 50.00");
    expect(message).toContain("- Line item: Services");
    expect(message).toContain("- Biller address: Kijabe Street, Nairobi, KE, 00800");
    expect(message).toContain("Use the existing confirmation flow before creating or changing records.");
  });
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run:

```bash
npm test -- src/lib/treasury/invoiceIntake.test.ts
```

Expected: FAIL because `src/lib/treasury/invoiceIntake.ts` does not exist.

- [ ] **Step 3: Implement the invoice intake helper**

Create `src/lib/treasury/invoiceIntake.ts`:

```ts
export type InvoiceIntakeDraft = {
  clientName: string;
  amount: string;
  currency: "USD";
};

export type InvoiceIntakeFields = {
  clientEmail: string;
  lineItemDescription: string;
  businessStreetAddress: string;
  businessCity: string;
  businessCountry: string;
  businessPostalCode: string;
};

export type InvoiceIntakeFieldErrors = Partial<Record<keyof InvoiceIntakeFields, string>>;

export type InvoiceIntakeValidationResult = {
  valid: boolean;
  errors: InvoiceIntakeFieldErrors;
};

function requiredFieldMessages(
  draft?: InvoiceIntakeDraft,
): Record<keyof InvoiceIntakeFields, string> {
  const clientEmailLabel = draft ? `${draft.clientName}'s email` : "Customer email";

  return {
    clientEmail: `${clientEmailLabel} is required.`,
    lineItemDescription: "Line item description is required.",
    businessStreetAddress: "Street address is required.",
    businessCity: "City is required.",
    businessCountry: "Country is required.",
    businessPostalCode: "ZIP / postal code is required.",
  };
}

function titleCaseName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((part) => {
      if (part.length <= 3 && part === part.toUpperCase()) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
}

function normalizeAmount(value: string): string | null {
  const parsed = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed.toFixed(2);
}

export function parseInvoiceIntakeRequest(content: string): InvoiceIntakeDraft | null {
  const normalized = content.trim().replace(/\s+/g, " ");
  const invoiceMatch = normalized.match(/\b(?:create\s+)?invoice(?:\s+for)?\s+(.+)$/i);
  if (!invoiceMatch) return null;

  const tail = invoiceMatch[1].trim();
  const amountMatch = tail.match(/(?:\s+for)?\s+(?:usd\s*)?\$?\s*([\d,]+(?:\.\d{1,2})?)\s*\$?$/i);
  if (!amountMatch) return null;

  const amount = normalizeAmount(amountMatch[1]);
  if (!amount) return null;

  const clientName = tail
    .slice(0, amountMatch.index)
    .replace(/\s+for\s*$/i, "")
    .trim();
  if (!clientName) return null;

  return {
    clientName: titleCaseName(clientName),
    amount,
    currency: "USD",
  };
}

export function createEmptyInvoiceIntakeFields(): InvoiceIntakeFields {
  return {
    clientEmail: "",
    lineItemDescription: "",
    businessStreetAddress: "",
    businessCity: "",
    businessCountry: "",
    businessPostalCode: "",
  };
}

export function validateInvoiceIntakeFields(
  fields: InvoiceIntakeFields,
  draft?: InvoiceIntakeDraft,
): InvoiceIntakeValidationResult {
  const errors: InvoiceIntakeFieldErrors = {};
  const messages = requiredFieldMessages(draft);

  for (const key of Object.keys(messages) as Array<keyof InvoiceIntakeFields>) {
    if (!fields[key].trim()) {
      errors[key] = messages[key];
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildInvoiceIntakeAssistantMessage(draft: InvoiceIntakeDraft): string {
  return `To draft this invoice I need a couple of details about ${draft.clientName} and your billing address.`;
}

export function buildInvoiceIntakeFollowUpMessage(
  draft: InvoiceIntakeDraft,
  fields: InvoiceIntakeFields,
): string {
  return [
    "Create an invoice draft with these details:",
    `- Client: ${draft.clientName} <${fields.clientEmail.trim()}>`,
    `- Amount: ${draft.currency} ${draft.amount}`,
    `- Line item: ${fields.lineItemDescription.trim()}`,
    `- Biller address: ${[
      fields.businessStreetAddress,
      fields.businessCity,
      fields.businessCountry,
      fields.businessPostalCode,
    ]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ")}`,
    "Use the existing confirmation flow before creating or changing records.",
  ].join("\n");
}
```

- [ ] **Step 4: Run the new test and verify GREEN**

Run:

```bash
npm test -- src/lib/treasury/invoiceIntake.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit invoice intake helper**

Run:

```bash
git add src/lib/treasury/invoiceIntake.ts src/lib/treasury/invoiceIntake.test.ts
git commit -m "feat: add treasury invoice intake model"
```

---

### Task 2: Assistant Message Display Blocks

**Files:**
- Create: `src/lib/treasury/assistantMessageView.ts`
- Create: `src/lib/treasury/assistantMessageView.test.ts`
- Modify: `src/lib/treasury/formatAssistantMessage.ts`
- Modify: `src/lib/treasury/formatAssistantMessage.test.ts`

- [ ] **Step 1: Write failing display-block tests**

Create `src/lib/treasury/assistantMessageView.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildAssistantMessageBlocks } from "@/lib/treasury/assistantMessageView";

describe("buildAssistantMessageBlocks", () => {
  it("removes thinking blocks and raw markdown emphasis from paragraphs", () => {
    expect(
      buildAssistantMessageBlocks("<think>hidden</think>\n\n**Invoice Number**: INV-1"),
    ).toEqual([{ type: "paragraph", text: "Invoice Number: INV-1" }]);
  });

  it("groups numbered next steps into a list block", () => {
    expect(
      buildAssistantMessageBlocks("### Next Steps:\n1. **Preview** payouts\n2. **Confirm** draft"),
    ).toEqual([
      { type: "paragraph", text: "Next Steps:" },
      { type: "list", items: ["Preview payouts", "Confirm draft"] },
    ]);
  });

  it("keeps compact paragraphs separate", () => {
    expect(buildAssistantMessageBlocks("First line.\n\nSecond line.")).toEqual([
      { type: "paragraph", text: "First line." },
      { type: "paragraph", text: "Second line." },
    ]);
  });
});
```

Update `src/lib/treasury/formatAssistantMessage.test.ts` with one new assertion:

```ts
  it("removes unclosed thinking blocks from local model output", () => {
    const raw = "<think>still thinking\nmore internal text";
    expect(formatAssistantMessage(raw)).toBe("");
  });
```

- [ ] **Step 2: Run display tests and verify RED**

Run:

```bash
npm test -- src/lib/treasury/assistantMessageView.test.ts src/lib/treasury/formatAssistantMessage.test.ts
```

Expected: FAIL because `assistantMessageView.ts` does not exist and unclosed thinking blocks are not handled.

- [ ] **Step 3: Harden thinking-tag cleanup**

Replace `src/lib/treasury/formatAssistantMessage.ts` with:

```ts
/** Strip local-model reasoning blocks from assistant text before display. */
export function formatAssistantMessage(content: string): string {
  return content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<redacted_thinking>[\s\S]*?<\/redacted_thinking>/gi, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .replace(/<redacted_thinking>[\s\S]*$/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
```

- [ ] **Step 4: Implement display blocks**

Create `src/lib/treasury/assistantMessageView.ts`:

```ts
import { formatAssistantMessage } from "@/lib/treasury/formatAssistantMessage";

export type AssistantMessageBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function cleanInlineMarkdown(value: string): string {
  return value
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function parseListLine(value: string): string | null {
  const match = value.match(/^\s*(?:[-*]|\d+\.)\s+(.+)$/);
  if (!match) return null;
  return cleanInlineMarkdown(match[1]);
}

export function buildAssistantMessageBlocks(content: string): AssistantMessageBlock[] {
  const formatted = formatAssistantMessage(content);
  if (!formatted) return [];

  const blocks: AssistantMessageBlock[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }
  };

  for (const paragraph of formatted.split(/\n{2,}/)) {
    const lines = paragraph.split("\n").map((line) => line.trim()).filter(Boolean);
    for (const line of lines) {
      const listItem = parseListLine(line);
      if (listItem) {
        listItems.push(listItem);
        continue;
      }
      flushList();
      const text = cleanInlineMarkdown(line);
      if (text) blocks.push({ type: "paragraph", text });
    }
    flushList();
  }

  return blocks;
}
```

- [ ] **Step 5: Run display tests and verify GREEN**

Run:

```bash
npm test -- src/lib/treasury/assistantMessageView.test.ts src/lib/treasury/formatAssistantMessage.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit message display helpers**

Run:

```bash
git add src/lib/treasury/assistantMessageView.ts src/lib/treasury/assistantMessageView.test.ts src/lib/treasury/formatAssistantMessage.ts src/lib/treasury/formatAssistantMessage.test.ts
git commit -m "feat: format treasury assistant messages"
```

---

### Task 3: Presentational Treasury Chat Components

**Files:**
- Create: `src/components/treasury/AssistantMessageBubble.tsx`
- Create: `src/components/treasury/UserMessageBubble.tsx`
- Create: `src/components/treasury/InvoiceIntakeCard.tsx`

- [ ] **Step 1: Create assistant bubble component**

Create `src/components/treasury/AssistantMessageBubble.tsx`:

```tsx
"use client";

import { Bot } from "lucide-react";
import { buildAssistantMessageBlocks } from "@/lib/treasury/assistantMessageView";

type AssistantMessageBubbleProps = {
  content: string;
  timestamp?: string;
};

export default function AssistantMessageBubble({
  content,
  timestamp,
}: AssistantMessageBubbleProps) {
  const blocks = buildAssistantMessageBlocks(content);

  return (
    <div className="mr-4 flex items-end gap-2.5">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E3E2FA] text-primary-600"
        aria-hidden
      >
        <Bot className="h-4 w-4" />
      </span>
      <div className="min-w-0 max-w-[560px] rounded-2xl rounded-bl-md bg-[#F2F5FA] px-4 py-3 text-sm text-[#1D243C]">
        <div className="space-y-2">
          {blocks.length > 0 ? (
            blocks.map((block, index) =>
              block.type === "paragraph" ? (
                <p key={`${block.type}-${index}`} className="leading-relaxed">
                  {block.text}
                </p>
              ) : (
                <ol
                  key={`${block.type}-${index}`}
                  className="list-decimal space-y-1 pl-5 leading-relaxed"
                >
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              ),
            )
          ) : (
            <p className="leading-relaxed">I'm ready when you are.</p>
          )}
        </div>
        {timestamp ? (
          <p className="mt-2 text-right text-[11px] text-[#9AA3B6]">{timestamp}</p>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create user bubble component**

Create `src/components/treasury/UserMessageBubble.tsx`:

```tsx
"use client";

type UserMessageBubbleProps = {
  content: string;
  timestamp?: string;
};

export default function UserMessageBubble({ content, timestamp }: UserMessageBubbleProps) {
  return (
    <div className="ml-8 flex justify-end">
      <div className="max-w-[360px] rounded-2xl rounded-br-md bg-[#2D74B8] px-4 py-3 text-sm text-white">
        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        {timestamp ? (
          <p className="mt-2 text-right text-[11px] text-white/75">{timestamp}</p>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create invoice intake card component**

Create `src/components/treasury/InvoiceIntakeCard.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import {
  buildInvoiceIntakeFollowUpMessage,
  createEmptyInvoiceIntakeFields,
  validateInvoiceIntakeFields,
  type InvoiceIntakeDraft,
  type InvoiceIntakeFieldErrors,
  type InvoiceIntakeFields,
} from "@/lib/treasury/invoiceIntake";

type FieldKey = keyof InvoiceIntakeFields;

const BASE_FIELD_CONFIG: Array<{
  key: FieldKey;
  label: string;
  placeholder: string;
}> = [
  { key: "clientEmail", label: "Customer email", placeholder: "Customer email" },
  { key: "lineItemDescription", label: "Line item description", placeholder: "Line item description" },
  { key: "businessStreetAddress", label: "Street address", placeholder: "Your street address" },
  { key: "businessCity", label: "City", placeholder: "Your city" },
  { key: "businessCountry", label: "Country", placeholder: "Your country" },
  { key: "businessPostalCode", label: "ZIP / postal code", placeholder: "Your ZIP / postal code" },
];

export default function InvoiceIntakeCard({
  draft,
  disabled = false,
  onSubmit,
}: {
  draft: InvoiceIntakeDraft;
  disabled?: boolean;
  onSubmit: (message: string) => void;
}) {
  const [fields, setFields] = useState<InvoiceIntakeFields>(() =>
    createEmptyInvoiceIntakeFields(),
  );
  const [errors, setErrors] = useState<InvoiceIntakeFieldErrors>({});
  const amountSummary = useMemo(
    () => `${draft.currency} ${draft.amount}`,
    [draft.amount, draft.currency],
  );
  const fieldConfig = useMemo(
    () =>
      BASE_FIELD_CONFIG.map((field) =>
        field.key === "clientEmail"
          ? {
              ...field,
              label: `${draft.clientName}'s email`,
              placeholder: `${draft.clientName}'s email`,
            }
          : field,
      ),
    [draft.clientName],
  );

  const updateField = (key: FieldKey, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const submit = () => {
    const validation = validateInvoiceIntakeFields(fields, draft);
    setErrors(validation.errors);
    if (!validation.valid) return;
    onSubmit(buildInvoiceIntakeFollowUpMessage(draft, fields));
  };

  return (
    <div className="ml-[42px] max-w-[430px] rounded-2xl bg-[#EEF2F7] p-5 text-sm text-[#1D243C]">
      <h3 className="text-base font-semibold">Invoice details for {draft.clientName}</h3>
      <p className="mt-1 text-sm text-[#4D556D]">
        Amount: {amountSummary}. Fill in the rest to draft the invoice.
      </p>
      <div className="mt-5 space-y-3">
        {fieldConfig.map((field) => (
          <div key={field.key}>
            <label className="sr-only" htmlFor={`invoice-intake-${field.key}`}>
              {field.label}
            </label>
            <input
              id={`invoice-intake-${field.key}`}
              value={fields[field.key]}
              onChange={(event) => updateField(field.key, event.target.value)}
              placeholder={field.placeholder}
              disabled={disabled}
              className={`h-12 w-full rounded-xl border bg-white px-4 text-sm outline-none transition placeholder:text-[#A4ADBE] focus:border-primary-300 ${
                errors[field.key] ? "border-[#E47A8A]" : "border-[#DDE3EC]"
              }`}
            />
            {errors[field.key] ? (
              <p className="mt-1 text-xs text-[#B23A4E]">{errors[field.key]}</p>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={disabled}
          className="h-10 min-w-24 rounded-xl bg-[#2D74B8] px-5 text-sm font-semibold text-white disabled:bg-[#B4B9CC]"
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run TypeScript check for new components**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 5: Commit presentational components**

Run:

```bash
git add src/components/treasury/AssistantMessageBubble.tsx src/components/treasury/UserMessageBubble.tsx src/components/treasury/InvoiceIntakeCard.tsx
git commit -m "feat: add treasury chat response components"
```

---

### Task 4: Integrate Intake Cards Into TreasuryCopilotChat

**Files:**
- Modify: `src/components/treasury/TreasuryCopilotChat.tsx`
- Test: `src/lib/treasury/invoiceIntake.test.ts`

- [ ] **Step 1: Update imports and local message type**

In `src/components/treasury/TreasuryCopilotChat.tsx`, keep the existing lucide import, then add these imports below the existing component imports:

```ts
import AssistantMessageBubble from "@/components/treasury/AssistantMessageBubble";
import InvoiceIntakeCard from "@/components/treasury/InvoiceIntakeCard";
import UserMessageBubble from "@/components/treasury/UserMessageBubble";
import {
  buildInvoiceIntakeAssistantMessage,
  parseInvoiceIntakeRequest,
  type InvoiceIntakeDraft,
} from "@/lib/treasury/invoiceIntake";
```

Replace:

```ts
type ChatMessage = TreasuryChatMessage;
```

with:

```ts
type ChatMessage = TreasuryChatMessage;

type UiChatMessage = ChatMessage & {
  timestamp?: string;
  displayContent?: string;
};
```

- [ ] **Step 2: Add timestamp helper**

Add below constants:

```ts
function messageTimestamp(date = new Date()): string {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}
```

- [ ] **Step 3: Update message state and add intake state**

Change:

```ts
const [messages, setMessages] = useState<ChatMessage[]>([
```

to:

```ts
const [messages, setMessages] = useState<UiChatMessage[]>([
```

Add this property to the initial assistant message:

```ts
timestamp: messageTimestamp(),
```

Add state beside `pendingActions`:

```ts
const [invoiceIntake, setInvoiceIntake] = useState<InvoiceIntakeDraft | null>(null);
```

- [ ] **Step 4: Extract shared submit function**

Replace the current `send` callback with this pair:

```ts
const submitUserMessage = useCallback(
  async (
    text: string,
    options: {
      displayContent?: string;
      document?: { name: string; text: string } | null;
    } = {},
  ) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const uiUserMsg: UiChatMessage = {
      ...userMsg,
      content: options.displayContent ?? trimmed,
      timestamp: messageTimestamp(),
    };
    const nextHistory = [...historyRef.current, userMsg];
    historyRef.current = nextHistory;
    setMessages((m) => [...m, uiUserMsg]);
    setInput("");
    setLoading(true);
    setError(null);
    setPendingActions([]);

    try {
      const selectedDocument =
        "document" in options ? options.document : attachment;
      const data = await callChat(nextHistory, selectedDocument);
      const assistantMsg: UiChatMessage = {
        role: "assistant",
        content: formatAssistantMessage(data.reply || "(no response)"),
        timestamp: messageTimestamp(),
      };
      if (Array.isArray(data.messages)) {
        historyRef.current = data.messages
          .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
          .map((m: ChatMessage) =>
            m.role === "assistant"
              ? { ...m, content: formatAssistantMessage(m.content) }
              : m,
          ) as ChatMessage[];
      } else {
        historyRef.current = [...nextHistory, assistantMsg];
      }
      setMessages((m) => [...m, assistantMsg]);
      if (Array.isArray(data.pending_actions) && data.pending_actions.length > 0) {
        setPendingActions(data.pending_actions as PendingAction[]);
      }
      setAttachment(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  },
  [attachment, callChat, loading],
);

const send = useCallback(async () => {
  const text = input.trim();
  if (!text || loading) return;

  const intakeDraft = parseInvoiceIntakeRequest(text);
  if (intakeDraft) {
    const userMsg: UiChatMessage = {
      role: "user",
      content: text,
      timestamp: messageTimestamp(),
    };
    const assistantMsg: UiChatMessage = {
      role: "assistant",
      content: buildInvoiceIntakeAssistantMessage(intakeDraft),
      timestamp: messageTimestamp(),
    };
    historyRef.current = [...historyRef.current, { role: "user", content: text }];
    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInvoiceIntake(intakeDraft);
    setInput("");
    setError(null);
    setPendingActions([]);
    return;
  }

  await submitUserMessage(text);
}, [input, loading, submitUserMessage]);
```

- [ ] **Step 5: Add intake submit callback**

Add below `confirmAction`:

```ts
const submitInvoiceIntake = useCallback(
  (message: string) => {
    const draft = invoiceIntake;
    setInvoiceIntake(null);
    void submitUserMessage(message, {
      displayContent: draft
        ? `Submitted invoice details for ${draft.clientName}.`
        : "Submitted invoice details.",
      document: null,
    });
  },
  [invoiceIntake, submitUserMessage],
);
```

- [ ] **Step 6: Include intake state in chat auto-scroll**

Update the scroll effect dependency list:

```ts
}, [messages, loading, pendingActions, invoiceIntake, error]);
```

- [ ] **Step 7: Replace message rendering with bubble components and card**

Inside the scroll area, replace the `messages.map` block with:

```tsx
{messages.map((m, i) =>
  m.role === "user" ? (
    <UserMessageBubble
      key={`${m.role}-${i}`}
      content={m.displayContent ?? m.content}
      timestamp={m.timestamp}
    />
  ) : (
    <AssistantMessageBubble
      key={`${m.role}-${i}`}
      content={m.content}
      timestamp={m.timestamp}
    />
  ),
)}

{invoiceIntake ? (
  <InvoiceIntakeCard
    draft={invoiceIntake}
    disabled={loading}
    onSubmit={submitInvoiceIntake}
  />
) : null}
```

- [ ] **Step 8: Run targeted tests and TypeScript**

Run:

```bash
npm test -- src/lib/treasury/invoiceIntake.test.ts src/lib/treasury/assistantMessageView.test.ts src/lib/treasury/formatAssistantMessage.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 9: Run targeted ESLint**

Run:

```bash
npx eslint src/components/treasury/TreasuryCopilotChat.tsx src/components/treasury/AssistantMessageBubble.tsx src/components/treasury/UserMessageBubble.tsx src/components/treasury/InvoiceIntakeCard.tsx src/lib/treasury/invoiceIntake.ts src/lib/treasury/assistantMessageView.ts
```

Expected: PASS.

- [ ] **Step 10: Commit integrated chat UI**

Run:

```bash
git add src/components/treasury/TreasuryCopilotChat.tsx
git commit -m "feat: show invoice intake cards in treasury chat"
```

---

### Task 5: Verification

**Files:**
- No new code unless verification finds a defect.

- [ ] **Step 1: Run full Vitest suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 2: Run TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Run targeted ESLint on changed files**

Run:

```bash
npx eslint src/components/treasury/TreasuryCopilotChat.tsx src/components/treasury/AssistantMessageBubble.tsx src/components/treasury/UserMessageBubble.tsx src/components/treasury/InvoiceIntakeCard.tsx src/lib/treasury/invoiceIntake.ts src/lib/treasury/invoiceIntake.test.ts src/lib/treasury/assistantMessageView.ts src/lib/treasury/assistantMessageView.test.ts src/lib/treasury/formatAssistantMessage.ts src/lib/treasury/formatAssistantMessage.test.ts
```

Expected: PASS.

- [ ] **Step 4: Check known full-lint status**

Run:

```bash
npm run lint
```

Expected: This may still fail on pre-existing unrelated files:

- `src/components/deposit/ConfirmDepositStep.tsx`
- `src/components/payments/steps/ReviewStep.tsx`

If it fails only on those files, record that in the final answer. If it fails on any changed Treasury files, fix before continuing.

- [ ] **Step 5: Manual browser verification**

Open:

```text
http://localhost:3000/dashboard/treasury-copilot
```

Verify:

- Normal assistant messages render as compact left bubbles, not full-width gray blocks.
- User messages render as compact right bubbles.
- Raw `<think>` blocks and raw `**bold**` markers are not visible.
- Sending `invoice jane doe 50$` shows the assistant explanation plus `Invoice details for Jane Doe`.
- The intake card shows amount `USD 50.00`.
- Clicking `Next` with empty fields shows inline validation.
- Filling all fields and clicking `Next` sends a concise visible user bubble, while the structured follow-up goes through the existing Treasury chat flow.
- Pending confirmation cards still render separately when the backend returns `pending_actions`.

- [ ] **Step 6: Check git status**

Run:

```bash
git status --short
```

Expected: only `.superpowers/` visual companion files may remain untracked. Do not commit `.superpowers/`.
