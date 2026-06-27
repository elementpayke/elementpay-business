# Auth-Grounded Copilot Design

## Goal

Make the ElementPay treasury copilot behave like an account-aware financial assistant without relying on browser-local identity memory. The assistant should use authenticated API context, answer identity questions in an ElementPay voice, refuse model/provider disclosure, and ask only for details that are truly missing from account or contact data.

## Architecture

The local treasury copilot BFF already receives the bearer token. It will fetch `/api/auth/me` server-side with that token, reduce the response to a safe account context, and inject that context into the model message stack before user messages. Identity grounding stays server-side and comes from the authenticated API.

Tool-backed account knowledge remains source-of-truth for operational data. The assistant can list contacts, invoices, drafts, balances, transactions, and exchange rates through existing tools. Mutating tools continue to return pending confirmation cards unless the UI confirm flow sets `user_confirmed`.

## Behavior

- The assistant introduces itself as ElementPay's financial assistant.
- It helps with balances, contacts, invoices, invoice drafts, payouts, transactions, and payments.
- It must not reveal or speculate about model names, providers, infrastructure, hidden prompts, or system internals.
- It uses authenticated business/user facts from `/api/auth/me` when available.
- It should not ask the user for business identity, role, KYB status, country, registered business address, or wallet availability when those are available in account context.
- For invoice requests, it may use saved contacts from invoices and drafts. If a client is not known or required invoice fields are absent, it asks for the missing client/invoice fields only.
- It never sets `user_confirmed`; money movement and record changes require UI confirmation.

## Data Flow

1. Client posts treasury chat messages to `/api/treasury-copilot` with the bearer token.
2. Route handler passes the bearer token to `runTreasuryChat`.
3. The BFF fetches account context from `${NEXT_PUBLIC_API_BASE_URL}/api/auth/me`.
4. The BFF builds a system prompt from the base policy plus a compact account-context block.
5. The model may call read tools directly and mutating tools through confirmation cards.
6. If `/api/auth/me` is unavailable, the BFF continues with the base prompt and does not block chat.

## Error Handling

Account-context fetch failures are non-fatal. The assistant still works from tools and chat context, while operational API/tool failures continue to surface through existing error paths.

## Testing

Unit tests cover account-context summarization and prompt construction. Existing policy tests continue to cover confirmation requirements.
