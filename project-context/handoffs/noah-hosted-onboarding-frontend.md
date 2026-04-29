# Noah Hosted Onboarding: Frontend Quick Guide

This guide explains the frontend flow for Noah business onboarding in ElementPay.

## Purpose

When a business user submits business details in onboarding, we:

1. Send prefill data to backend (`prefill-business`)
2. Start Noah hosted onboarding (`hosted-onboarding`)
3. Redirect browser to Noah HostedURL
4. Noah returns the user to our callback page
5. Final verification outcome is set by webhook, not by callback URL alone

## Files Involved

- `src/app/onboarding/page.tsx`
  - Calls submit function after Business Details form submit
  - Redirects to HostedURL when present

- `src/lib/onboarding/noahPayload.ts`
  - Builds payload for backend with envelope:
    - `subject_id`
    - `rail_key: "noah"`
    - `noah_customer_id` (stable UUID)
    - `noah` object (prefill body)

- `src/lib/onboarding/noahService.ts`
  - Posts to `/api/onboarding/noah-prefill`
  - Extracts HostedURL from backend response
  - Generates/stores stable UUIDs for Noah customer id

- `src/app/api/onboarding/noah-prefill/route.ts`
  - Server route used by frontend
  - Calls backend prefill endpoint first
  - Calls backend hosted-onboarding endpoint second
  - Returns combined response with hosted onboarding payload

- `src/app/onboarding/hosted-onboarding/callback/page.tsx`
  - Return URL page shown after user leaves Noah hosted flow
  - Shows success/pending/error guidance and links to verification center

## Required Env Value

- `NOAH_HOSTED_ONBOARDING_RETURN_URL`
  - Must be an `https://` URL (backend validation)
  - Should point to frontend callback route:
  - `https://<your-domain>/onboarding/hosted-onboarding/callback`

Example (local with HTTPS):

`NOAH_HOSTED_ONBOARDING_RETURN_URL=https://localhost:3000/onboarding/hosted-onboarding/callback`

## Important Behavior

- Prefill success alone is not the end of onboarding.
- Hosted onboarding returns the HostedURL used for redirect.
- Callback page is user UX only.
- Deterministic final state (`approved` or `declined`) is driven by backend webhook:
  - `POST /webhooks/noah/customer`

## Testing Checklist

1. Submit business details form.
2. Confirm frontend receives HostedURL and redirects to Noah.
3. Complete or cancel flow in Noah UI.
4. Confirm browser returns to callback page.
5. Confirm dashboard verification status updates after webhook delivery.
