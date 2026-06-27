# Auth-Grounded Copilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ground the treasury copilot in authenticated ElementPay account context from the API.

**Architecture:** Add a small server-side account-context helper beside the copilot BFF. Fetch `/api/auth/me` with the existing bearer token, format safe fields into the model context, and strengthen the copilot system prompt while preserving confirmation policy.

**Tech Stack:** Next.js route handler, TypeScript, Vitest, existing QVAC-compatible chat completion flow.

---

### Task 1: Account Context Helper

**Files:**
- Create: `src/lib/treasury/copilotAccountContext.ts`
- Test: `src/lib/treasury/copilotAccountContext.test.ts`

- [x] Write failing tests for safe account context formatting.
- [x] Run `npm test -- src/lib/treasury/copilotAccountContext.test.ts` and confirm failure.
- [x] Implement account context types, safe summarization, and authenticated fetch helper.
- [x] Re-run the targeted test and confirm pass.

### Task 2: Prompt Integration

**Files:**
- Modify: `src/lib/treasury/copilotTools.server.ts`
- Modify: `src/lib/treasury/copilotBff.ts`
- Test: `src/lib/treasury/copilotAccountContext.test.ts`

- [x] Write failing tests showing the prompt includes ElementPay identity policy, model/provider refusal policy, and account context.
- [x] Run the targeted test and confirm failure.
- [x] Export a prompt builder and use it in `runTreasuryChat`.
- [x] Re-run the targeted test and confirm pass.

### Task 3: Copy Alignment and Regression Verification

**Files:**
- Modify: `src/components/treasury/TreasuryCopilotChat.tsx`
- Modify: `src/app/dashboard/treasury-copilot/page.tsx`

- [x] Update visible copy so the assistant is ElementPay-branded and does not foreground implementation/provider details.
- [x] Run `npm test -- src/lib/treasury/copilotAccountContext.test.ts src/lib/treasury/copilotPolicy.test.ts src/lib/treasury/formatAssistantMessage.test.ts`.
- [x] Run ESLint on changed files.
- [ ] Full `npm run lint` is blocked by pre-existing hook issues in `src/components/deposit/ConfirmDepositStep.tsx` and `src/components/payments/steps/ReviewStep.tsx`.
