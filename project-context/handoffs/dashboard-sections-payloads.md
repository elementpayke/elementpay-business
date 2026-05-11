# Dashboard sections — proposed JSON payloads

Audience: Backend team
Author: Frontend (Nelson)
Date: 2026-05-11

This document specifies the JSON payloads the dashboard home page (`/dashboard`) expects from the backend. Each section below corresponds to a component currently rendering mocked data from [src/components/dashboard/dashboardData.ts](src/components/dashboard/dashboardData.ts).

## Conventions

- All responses follow the existing envelope used elsewhere in the API:
  ```json
  { "status": "success", "message": "…", "data": { ... } }
  ```
- **Monetary values**: send as numeric `amount` + ISO 4217 `currency` code. The frontend handles formatting (`KES 212,274`, `-KES 2,274`, etc.). Do **not** pre-format strings — formatting differs by locale and we already need the raw number to sort/filter.
- **Timestamps**: ISO 8601 with timezone (`2026-01-14T12:34:23+03:00`). The UI formats them.
- **Country**: ISO 3166-1 alpha-2 (`KE`, `NG`, `GH`). Used to render flags.
- **Pagination** (where listed): `{ page, page_size, total, total_pages }` on the data object.
- **Auth**: all endpoints require the user's session/bearer token. Data is scoped to the authenticated business/org.

---

## 1. Exchange rates ticker

**Component:** [ExchangeRateTicker.tsx](src/components/dashboard/ExchangeRateTicker.tsx)
**Suggested endpoint:** `GET /api/dashboard/exchange-rates`

Query params:
- `base` (optional, default `USD`)
- `quotes` (optional, comma list, default `KES,NGN,GHS`)

```json
{
  "status": "success",
  "message": "ok",
  "data": {
    "base_currency": "USD",
    "as_of": "2026-01-14T09:12:35+03:00",
    "rates": [
      { "country": "KE", "currency": "KES", "rate": 129.00 },
      { "country": "NG", "currency": "NGN", "rate": 1422.73 },
      { "country": "GH", "currency": "GHS", "rate": 10.775086 }
    ]
  }
}
```

---

## 2. Wallet summary card

**Component:** [WalletSummaryCard.tsx](src/components/dashboard/WalletSummaryCard.tsx)
**Suggested endpoint:** `GET /api/dashboard/wallet-summary`

Query params:
- `wallet_id` (optional — defaults to the user's primary wallet)

```json
{
  "status": "success",
  "message": "ok",
  "data": {
    "wallet_id": "wlt_01HW…",
    "wallet_name": "Operating wallet",
    "country": "KE",
    "currency": "KES",
    "balance": 3354114.81,
    "usd_equivalent": 26000.89,
    "fx_rate": {
      "base": "USD",
      "quote": "KES",
      "rate": 129.00,
      "as_of": "2026-01-14T09:12:35+03:00"
    },
    "available_wallets": [
      { "wallet_id": "wlt_01HW…", "currency": "KES", "country": "KE" },
      { "wallet_id": "wlt_02JX…", "currency": "NGN", "country": "NG" },
      { "wallet_id": "wlt_03KY…", "currency": "GHS", "country": "GH" }
    ]
  }
}
```

Note: `available_wallets` powers the currency dropdown next to the balance.

---

## 3. Quick actions

**Component:** [QuickActions.tsx](src/components/dashboard/QuickActions.tsx)

No backend payload required — these are static client-side links. Listed here for completeness.

---

## 4. Transaction volume chart + top currencies

**Component:** [TransactionVolumeChart.tsx](src/components/dashboard/TransactionVolumeChart.tsx)
**Suggested endpoint:** `GET /api/dashboard/transaction-volume`

Query params:
- `period`: `month` | `quarter` | `year` (default `year`)
- `top_period`: period for the right-hand "Top currencies" panel — `week` | `month` | `year` (default `month`)

```json
{
  "status": "success",
  "message": "ok",
  "data": {
    "period": "year",
    "currency": "USD",
    "series": [
      { "bucket": "2026-01", "label": "Jan", "money_in": 35000, "money_out": 30000 },
      { "bucket": "2026-02", "label": "Feb", "money_in": 35000, "money_out": 30000 },
      { "bucket": "2026-03", "label": "Mar", "money_in": 45000, "money_out": 30000 },
      { "bucket": "2026-04", "label": "Apr", "money_in": 25000, "money_out": 30000 },
      { "bucket": "2026-05", "label": "May", "money_in": 45000, "money_out": 30000 },
      { "bucket": "2026-06", "label": "Jun", "money_in": 25000, "money_out": 35000 },
      { "bucket": "2026-07", "label": "Jul", "money_in": 25000, "money_out": 22000 },
      { "bucket": "2026-08", "label": "Aug", "money_in": 30000, "money_out": 30000 },
      { "bucket": "2026-09", "label": "Sep", "money_in": 38000, "money_out": 25000 },
      { "bucket": "2026-10", "label": "Oct", "money_in": 40000, "money_out": 32000 },
      { "bucket": "2026-11", "label": "Nov", "money_in": 30000, "money_out": 22000 },
      { "bucket": "2026-12", "label": "Dec", "money_in": 35000, "money_out": 30000 }
    ],
    "top_currencies": {
      "period": "month",
      "items": [
        { "country": "KE", "currency": "KES", "name": "Kenya Shillings", "usd_volume": 45230, "share_pct": 88 },
        { "country": "NG", "currency": "NGN", "name": "Nigerian Naira", "usd_volume": 31520, "share_pct": 64 },
        { "country": "GH", "currency": "GHS", "name": "Ghanaian Cedis", "usd_volume": 26783, "share_pct": 52 }
      ]
    }
  }
}
```

Note: `share_pct` is the value that drives the progress bar (0–100). The frontend uses it directly as bar width.

---

## 5. Upcoming invoice payments

**Component:** [UpcomingInvoicesTable.tsx](src/components/dashboard/UpcomingInvoicesTable.tsx)
**Suggested endpoint:** `GET /api/dashboard/upcoming-invoices`

Query params:
- `limit` (default 5)
- `status` (optional, comma list — `pending`, `defaulting`)

```json
{
  "status": "success",
  "message": "ok",
  "data": {
    "items": [
      {
        "invoice_id": "inv-2024-0156",
        "transaction_id": "txn-2024-0156",
        "client": {
          "name": "Aly Mtsumi",
          "country": "KE",
          "avatar_url": null
        },
        "wallet": {
          "id": "wlt_01HW…",
          "name": "Wallet name"
        },
        "issued_at": "2025-12-12T12:34:23+03:00",
        "due_at": "2026-02-12T23:59:59+03:00",
        "status": "pending",
        "expected_amount": {
          "amount": 212274,
          "currency": "KES"
        }
      }
    ],
    "pagination": { "page": 1, "page_size": 5, "total": 12, "total_pages": 3 }
  }
}
```

Enum — `status`: `pending` | `defaulting` | `paid` | `cancelled` (only `pending`/`defaulting` show on this widget).

---

## 6. Pending payments

**Component:** [PendingPaymentsTable.tsx](src/components/dashboard/PendingPaymentsTable.tsx)
**Suggested endpoint:** `GET /api/dashboard/pending-payments`

Query params:
- `limit` (default 5)

```json
{
  "status": "success",
  "message": "ok",
  "data": {
    "items": [
      {
        "id": "txn-2026-1001",
        "client": {
          "name": "Aly Mtsumi",
          "country": "KE",
          "avatar_url": null
        },
        "initiated_at": "2025-12-12T12:34:00+03:00",
        "transaction_type": "bulk_payment",
        "payment_method": "mpesa_mobile",
        "status": "pending",
        "fees": { "amount": 22.74, "currency": "KES" },
        "amount": { "amount": 212274, "currency": "KES" }
      }
    ],
    "pagination": { "page": 1, "page_size": 5, "total": 7, "total_pages": 2 }
  }
}
```

Enums:
- `transaction_type`: `single_payment` | `bulk_payment` | `deposit` | `invoice_payin`
- `payment_method`: `mpesa_mobile` | `mtn_momo` | `vodafone_cash` | `bank_transfer` | `card`
- `status`: always `pending` for this widget

The frontend will resolve enum → display label (e.g. `mpesa_mobile` → "M-Pesa Mobile"). Sending enums (not display strings) keeps i18n and filtering clean.

---

## 7. Recent transactions

**Component:** [RecentTransactionsTable.tsx](src/components/dashboard/RecentTransactionsTable.tsx)
**Used on:** dashboard home (preview, top 5–10) and [/dashboard/transactions](src/app/dashboard/transactions/page.tsx) (full list, filtered).

**Suggested endpoint:** `GET /api/dashboard/transactions`

Query params:
- `limit` (default 10 for dashboard, 50 for full list)
- `page` (default 1)
- `direction`: `in` | `out` (filter)
- `status`: `successful` | `failed` | `pending`
- `q`: free-text search (client, reference, transaction id)
- `sort`: `newest` | `oldest` | `highest` | `lowest`
- `from`, `to`: ISO date range

```json
{
  "status": "success",
  "message": "ok",
  "data": {
    "items": [
      {
        "id": "txn-2026-0001",
        "reference": "INV-2024-0156",
        "client": {
          "name": "Aly Mtsumi",
          "country": "KE",
          "avatar_url": null
        },
        "occurred_at": "2025-12-12T12:34:00+03:00",
        "direction": "out",
        "type": "single_payment",
        "payment_method": "mpesa_mobile",
        "status": "successful",
        "fees": { "amount": 22.74, "currency": "KES" },
        "amount": { "amount": -2274, "currency": "KES" },
        "usd_equivalent": 17.58,
        "fx_rate": { "base": "USD", "quote": "KES", "rate": 129.32 },
        "processing_time": "instant",
        "category": "vendor_payout",
        "narration": "Monthly retainer",
        "counterparty": {
          "email": "aly.mtsumi@gmail.com",
          "phone": "+254712345678",
          "bank_name": "Safaricom M-Pesa",
          "account_number": "+254712345678",
          "account_name": "Aly Mtsumi"
        }
      }
    ],
    "pagination": { "page": 1, "page_size": 10, "total": 142, "total_pages": 15 }
  }
}
```

Enums:
- `direction`: `in` | `out`
- `type`: `single_payment` | `bulk_payment` | `deposit` | `invoice_payin`
- `payment_method`: same as section 6
- `status`: `successful` | `failed` | `pending`
- `processing_time`: `instant` | `within_5_minutes` | `within_1_hour` | `manual` (frontend maps to copy)
- `category`: `vendor_payout` | `payroll` | `invoice_collection` | `wallet_topup` | `other`

`amount.amount` is signed — negative for out-flows, positive for in-flows. Avoids the frontend having to flip signs based on `direction`.

---

## 8. Single transaction detail

**Component:** [/dashboard/transactions/[id]](src/app/dashboard/transactions/[id]/page.tsx)
**Suggested endpoint:** `GET /api/dashboard/transactions/{id}`

Response: same shape as one item in section 7 above, returned directly under `data`. No new fields required.

---

## Open questions for the backend team

1. **Wallet model**: is there already an internal `wallet_id` per (business, currency), or should we expect one wallet per business that just renders multiple currency balances?
2. **FX rates source**: is the rate per-wallet (the rate booked at deposit) or a single live mid-market rate? The ticker and wallet card should agree.
3. **Aggregation timezone**: `transaction-volume` buckets — should they be aggregated in the business's local timezone or UTC? Locking this early avoids off-by-one days at month boundaries.
4. **Pagination style**: cursor or offset/page? I've assumed offset/page above; happy to switch.
5. **Caching**: is the exchange-rates endpoint cacheable (e.g. 60s)? If yes, we'll skip client-side refetching beyond that.

Reply on any of these and I'll update this doc and the corresponding frontend types.
