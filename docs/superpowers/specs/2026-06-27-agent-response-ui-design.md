# Agent Response UI Design

## Goal

Make the Treasury AI agent response experience feel clean and action-oriented like the HEVN reference: narrow readable chat bubbles for normal replies, plus compact structured intake cards when the assistant needs missing details for invoice-like tasks.

## Approved Direction

- Use direction B from the visual companion.
- Keep normal assistant replies as polished chat bubbles with better width, spacing, timestamps, and readable formatting.
- Add smart intake cards for invoice creation requests, starting with prompts like `invoice jane doe 50$`.
- Keep the existing Treasury AI route and backend tool endpoints unchanged in this pass.

## UX Design

The chat surface should become calmer and more focused:

- User messages remain right-aligned, compact, and primary-colored.
- Assistant messages become left-aligned bubbles with a small assistant avatar and a max width that avoids full-row paragraphs.
- Assistant text should render simple markdown affordances instead of exposing raw `**bold**`, numbered-list clutter, or thinking tags.
- Each message can show a small timestamp in muted text.
- The composer remains fixed at the bottom of the chat card, but should feel lighter and less cramped.

When the assistant recognizes an invoice-draft request with missing required details, it should render an intake card below the assistant explanation. The card should look like the HEVN reference:

- Title: `Invoice details for <client name>`.
- Summary: amount/currency detected from the request.
- Fields for missing information, such as client email, line item description, business street address, city, country, and postal code.
- A compact `Next` action.
- Clear inline validation for missing required fields.

The first implementation can use deterministic client-side detection for obvious invoice requests and missing details. It does not need full model-generated UI schemas yet.

In this pass, the intake card does not directly call invoice APIs. Clicking `Next` validates the local fields, builds a structured follow-up user message with the collected invoice details, and sends that message through the existing Treasury AI chat flow. If creating a draft requires a mutating tool, the existing pending-confirmation flow must still handle it.

## Components

New or changed frontend units:

- `TreasuryCopilotChat`: chat layout, message list, composer, and intake-card placement.
- `AssistantMessageBubble`: assistant avatar, formatted text, timestamp, and compact bubble styling.
- `UserMessageBubble`: compact right-aligned user bubble with timestamp.
- `InvoiceIntakeCard`: structured invoice detail form for missing fields.
- `formatAssistantMessage`: keep removing thinking blocks and improve lightweight markdown cleanup/rendering support where needed.

Existing components to keep:

- `PendingActionCard` for actions that require confirmation.
- Treasury chat API functions in `src/lib/treasury/api.ts`.
- Existing confirmation behavior for mutating tools.

## Data Flow

Normal chat stays the same:

1. User submits a message.
2. `TreasuryCopilotChat` appends the user message locally.
3. The component calls `treasuryCopilotChat`.
4. The assistant reply renders as a polished bubble.
5. Any returned pending actions render through `PendingActionCard`.

Invoice intake card flow:

1. User sends an obvious invoice request.
2. The frontend extracts best-effort invoice facts from the prompt, such as client name and amount.
3. If required draft fields are missing, the assistant bubble explains what is needed and the intake card appears.
4. The user fills the missing fields and clicks `Next`.
5. The component converts the filled card into a structured follow-up user message and sends it through `treasuryCopilotChat`.
6. Any draft creation still follows the existing Treasury AI tool and pending-confirmation behavior.

No backend schema or endpoint changes are required in this pass.

## Error Handling

- If invoice intent cannot be parsed confidently, fall back to a normal chat reply.
- Intake card validation should stay local and specific: mark the missing field and keep user-entered values.
- API errors still show in the chat card error area.
- Pending confirmation cards remain separate from intake cards so money movement and record changes still require explicit confirmation.

## Testing Strategy

Implementation must use TDD:

- Add tests for invoice intent extraction and amount/client parsing.
- Add tests for intake-card missing-field behavior.
- Add tests that normal assistant messages use clean formatted output without thinking tags.
- Add component tests or focused state tests for submitting an intake-card follow-up.
- Keep existing treasury policy and account-context tests passing.

## Out Of Scope

- Model-generated dynamic form schemas.
- Backend changes to Treasury AI tool schemas.
- Replacing `PendingActionCard`.
- Automatic invoice issuing without confirmation.
- Full rich markdown rendering with tables/code blocks in this pass.
