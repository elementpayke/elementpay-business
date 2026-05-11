# Noah Onboarding: Current Flow + Proposal to Backend

Audience: backend team. Goal: agree on a simpler contract that lets the frontend make fewer calls and stops generating identifiers it shouldn't own.

## 1. What we collect on the frontend

Two forms before any Noah call is made.

**Step A — Basic Info** (user identity)
- `firstName`, `lastName`
- `country`, `countryCode` (ISO-2)
- `phoneNumber`
- `dateOfBirth` (day / month / year)

**Step B — Business Details** (KYB payload)
- `legalName`, `registrationNumber`, `taxId`
- `entityType` — one of Noah's enum values: `LimitedLiabilityCompany`, `PublicCompany`, `SoleProprietorship`, `Partnership`, `Corporation`, `Trust`, `PrivateFoundation`, `Charity`, `NonProfitOrganization`, `PublicAgency`
- `registrationCountryCode` (ISO-2)
- `incorporationDate` (day / month / year → ISO-8601 `YYYY-MM-DD`)
- `websiteUrl`
- `address` — `line1`, `city`, `state`, `postalCode`, `countryCode` (ISO-2)
- `stakeholders[]` — each with `firstName`, `lastName`, `relationshipTypes[]` (`UBO` / `Representative` / `Director` / `Signatory`), `dateOfBirth`. Frontend generates a UUID for `Associate.ID` per stakeholder.

The user is always authenticated by this point — `user.id` from `/auth/me` is available.

---

## 2. Current flow (what we do today)

```
[Browser] BusinessDetailsStep submit
   │
   │ 1.  GET /api/onboarding/noah-enrollment?subject_type=organization&subject_id=<user.id>&rail_key=noah
   │     (Next proxy → backend GET /internal/psp/enrollments)
   │     → 200 { data: { external_customer_id, status, last_error, ... } }
   │     → 404 if no row yet
   │
   │ 2.  If 200: reuse data.external_customer_id as noah_customer_id
   │
   │ 3.  POST /api/onboarding/noah-prefill   (Next proxy)
   │       │
   │       ├── POST <backend>/internal/psp/enrollments/noah/prefill-business
   │       │     body: { subject_id: <user.id>, subject_type: "organization",
   │       │             rail_key: "noah", noah_customer_id: <from step 2>,
   │       │             noah: { CompanyName, RegistrationNumber, LegalAddress,
   │       │                     IncorporationDate, EntityType, Associates, ... } }
   │       │     → creates customer in Noah AND seeds KYB → link status: pending
   │       │
   │       ├── GET <backend>/internal/psp/enrollments?subject_type=organization
   │       │     &subject_id=<user.id>&rail_key=noah
   │       │     (re-fetch — needed because if step 2 was a 404, the canonical
   │       │      external_customer_id only exists after prefill ran)
   │       │     → 200 { data: { external_customer_id: <canonical>, ... } }
   │       │
   │       └── POST <backend>/internal/psp/enrollments/noah/hosted-onboarding
   │             body: { subject_id, subject_type: "organization", rail_key: "noah",
   │                     noah_customer_id: <canonical>, return_url, user_id: null }
   │             → returns HostedURL → link status: submitted (200/202) or approved (201)
   │
   │ 4.  Browser redirects to HostedURL
   │
   ▼
[Noah hosted UI]  user fills email, KYC docs, etc.
   │
   ▼
[Noah → backend webhook]  POST /webhooks/noah/customer  → link status: approved | declined
   │
   ▼
[Browser returns to /onboarding/hosted-onboarding/callback]  (UX only)
```

### Backend endpoints we hit per submission

| # | Method | Path | Purpose |
|---|---|---|---|
| 1 | GET | `/internal/psp/enrollments` | Find existing `noah_customer_id` for this user |
| 2 | POST | `/internal/psp/enrollments/noah/prefill-business` | Create Noah customer + seed KYB |
| 3 | GET | `/internal/psp/enrollments` | Re-fetch canonical `noah_customer_id` post-prefill |
| 4 | POST | `/internal/psp/enrollments/noah/hosted-onboarding` | Get HostedURL |

Two of these calls (#1 and #3) are the same endpoint. #1 only exists because frontend has historically generated the `noah_customer_id` and we want to avoid stomping a real one. #3 only exists because the prefill response shape doesn't reliably echo `external_customer_id`, so we re-look it up.

### Identifier rules currently enforced

- `subject_type = "organization"` for business onboarding.
- `user_id` MUST be `null` when `subject_type = "organization"`.
- `subject_id` = our authenticated `user.id` (numeric, sent as string).
- `rail_key = "noah"`.
- `noah_customer_id` is owned by the backend. Frontend reads it from `/internal/psp/enrollments` if a row exists, and **omits the field entirely** on first prefill — backend must assign one on the first call. Frontend never generates a `noah_customer_id`.

---

## 3. Pain points

1. **Two GETs to the same endpoint per submission.** #1 and #3 in the table above. Wasted round-trip.r
2. **First-call dependency on the backend assigning `noah_customer_id`.** The frontend does not generate identifiers. On the first prefill (when no `psp_customer_links` row exists yet) we omit `noah_customer_id` and rely on the backend to assign one and return it. If the backend rejects requests without `noah_customer_id`, first-time onboarding fails. Please confirm this is supported, or add support.
3. **Two POSTs (prefill + hosted) for what is conceptually one user action.** The frontend always wants both. Doing them as one upstream call would halve the HTTP overhead and remove a partial-failure window where prefill succeeds but hosted fails.
4. **Prefill response shape is undocumented.** We have to recursively scan it for `external_customer_id` / `noah_customer_id` / `NoahCustomerID`, and fall back to a GET when we can't find it.

---

## 4. Proposal

Two changes, in order of preference. Either is a strict improvement.

### Proposal A (preferred) — single endpoint that does prefill + hosted in one call

Add (or repurpose) one endpoint that the frontend hits once:

```
POST /internal/psp/enrollments/noah/onboard-business
```

Request body (frontend supplies — no `noah_customer_id`):

```jsonc
{
  "subject_id":   "42",            // our user.id
  "subject_type": "organization",
  "rail_key":     "noah",
  "user_id":      null,            // always null for organization
  "return_url":   "https://app.elementpay.net/onboarding/hosted-onboarding/callback",
  "noah": {
    "RegistrationCountry": "KE",
    "CompanyName": "...",
    "RegistrationNumber": "...",
    "LegalAddress":   { "Street": "...", "City": "...", "PostCode": "...", "State": "...", "Country": "KE" },
    "IncorporationDate": "2020-05-12",
    "EntityType": "LimitedLiabilityCompany",
    "TaxID": "...",
    "PrimaryWebsite": "...",
    "Associates": [{ "ID": "...", "RelationshipTypes": ["UBO"], "FullName": {...}, "DateOfBirth": "..." }]
  }
}
```

Backend behaviour:

1. Look up `psp_customer_links` for `(subject_type, subject_id, rail_key)`.
2. If a row exists, reuse its `external_customer_id`. If not, generate a UUID server-side and create the row.
3. Call Noah's prefill API.
4. Call Noah's hosted-onboarding API.
5. Return one combined response:

```jsonc
{
  "status": "success",
  "data": {
    "noah_customer_id": "<canonical>",   // useful for logs/debug
    "link_status":      "submitted",     // pending | submitted | approved | declined
    "hosted_url":       "https://..."
  }
}
```

Frontend collapses to **one** call per submission, generates **zero** identifiers, and handles partial-failure as a single status code.

### Proposal B (cheaper for backend) — keep the two endpoints, fix the contract

If splitting into a single endpoint is too invasive, two smaller fixes solve the same problems:

1. **Allow `noah_customer_id` to be omitted on `prefill-business`.** When omitted, backend generates the UUID, stores the row, and returns it.
2. **Echo `noah_customer_id` (or `external_customer_id`) in the prefill response top-level.** No deep nesting. Example:

   ```jsonc
   {
     "status": "success",
     "data": {
       "noah_customer_id": "<canonical>",
       "link_status": "pending"
     }
   }
   ```

With those two changes the frontend flow becomes:

```
1. POST prefill-business  (no noah_customer_id)
   → response includes noah_customer_id
2. POST hosted-onboarding (with that noah_customer_id)
   → response includes hosted_url
```

Two calls instead of four. No frontend UUID generation. No GETs. No re-fetch.

---

## 5. Smaller asks regardless of which proposal lands

These are independent of the above and would help us debug the current Noah 500s:

- **Forward Noah's error body / `x-request-id` on upstream failure.** When Noah returns 5xx, include the raw body (or at minimum the request id) in the backend's response detail. Right now we get a generic upstream message and have no way to trace it on Noah's side.
- **Document the prefill-business response shape.** Even if we keep the current contract, knowing exactly which field carries `external_customer_id` removes our recursive search and the fallback GET.
- **Confirm whether `psp_customer_links` rows can be reset.** If a customer is stuck in `submitted` with a Noah-side error, what's the supported way to retry? Delete the row? Patch status back to `pending`?

---

## 6. What the frontend will do once Proposal A or B is live

- Delete `getOrCreateNoahCustomerId` and the localStorage UUID code (already partial — finish removing).
- Delete the `/api/onboarding/noah-enrollment` proxy route (only exists for the pre-prefill GET).
- Delete the post-prefill re-GET in `/api/onboarding/noah-prefill/route.ts`.
- For Proposal A: collapse `/api/onboarding/noah-prefill` into a thin pass-through to the new combined endpoint.

End state: the frontend does **one** authenticated POST, gets back a `hosted_url`, redirects. That's it.
