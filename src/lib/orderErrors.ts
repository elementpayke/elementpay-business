import { OrderApiError } from "@/lib/orders";

/**
 * Two-level error model for the order quote / create flow.
 *
 * Backend (aggregator) errors are often verbose and developer-oriented, e.g.
 *   "Missing PII fields: ['name','phone',...]. Pass them in the request body
 *    or complete KYC for the end user."
 *
 * We never show that raw string to a normal user. Instead we normalize every
 * error into:
 *   - `userMessage` — plain, calm, actionable. Safe to render front-and-centre.
 *   - `devDetail`   — the raw message + status + body, shown only behind a
 *                     collapsible "Technical details" disclosure for debugging.
 *   - `retryable`   — whether retrying the *same* request could succeed. A 422
 *                     validation/KYC failure is NOT retryable (the input must
 *                     change); a network/5xx blip is.
 *   - `kind`        — coarse category, so callers can tailor the CTA (e.g. point
 *                     a `kyc` error at the verification page instead of retry).
 */
export type QuoteErrorKind =
  | "kyc"
  | "validation"
  | "rate"
  | "network"
  | "server"
  | "unknown";

export type NormalizedQuoteError = {
  title: string;
  userMessage: string;
  /** Raw, developer-facing detail. Never shown unless the user expands it. */
  devDetail: string;
  retryable: boolean;
  kind: QuoteErrorKind;
};

/** True when the backend is telling us PII/KYC is incomplete for the end user. */
function isKycError(message: string, status: number | null): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("missing pii") ||
    m.includes("complete kyc") ||
    m.includes("kyc for the end user") ||
    // Some deployments phrase this as a generic 422 with "pii" in the body.
    (status === 422 && m.includes("pii"))
  );
}

function isRateError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("quote") &&
    (m.includes("expired") || m.includes("no longer valid") || m.includes("stale"))
  );
}

/** Build the developer-facing detail string from whatever we have. */
function buildDevDetail(rawMessage: string, status: number | null, body: unknown): string {
  const parts: string[] = [];
  if (status != null) parts.push(`HTTP ${status}`);
  if (rawMessage) parts.push(rawMessage);
  if (body && typeof body === "object") {
    try {
      const json = JSON.stringify(body);
      // Avoid duplicating the message if the body is just { message: ... }.
      if (json && json !== "{}" && !parts.join(" ").includes(json)) {
        parts.push(json);
      }
    } catch {
      // body wasn't serializable — ignore.
    }
  }
  return parts.join(" — ") || "No additional detail.";
}

/**
 * Normalize any thrown value from the order flow into a user/developer split.
 * Pass the action name ("quote" | "deposit" | "payment") so the fallback copy
 * reads naturally.
 */
export function normalizeOrderError(
  err: unknown,
  context: "quote" | "deposit" | "payment" = "quote",
): NormalizedQuoteError {
  const isApi = err instanceof OrderApiError;
  const status = isApi ? err.status : null;
  const body = isApi ? err.body : undefined;
  const rawMessage =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";

  const devDetail = buildDevDetail(rawMessage, status, body);

  // 1. KYC / missing PII — not retryable; the fix is verification, not a retry.
  if (isKycError(rawMessage, status)) {
    return {
      title: "Verification required",
      userMessage:
        "We need to verify your account details before this transaction can go through. Please complete verification, then try again.",
      devDetail,
      retryable: false,
      kind: "kyc",
    };
  }

  // 2. Quote expired / stale — retryable (a fresh quote fixes it).
  if (isRateError(rawMessage)) {
    return {
      title: "Rate expired",
      userMessage:
        "The exchange rate for this quote has expired. Tap retry to fetch an up-to-date rate.",
      devDetail,
      retryable: true,
      kind: "rate",
    };
  }

  // 3. Other client validation (4xx that isn't KYC) — generally not retryable
  //    without changing input, but we still let the user retry the request.
  if (status != null && status >= 400 && status < 500) {
    return {
      title: "We couldn't process that",
      userMessage:
        context === "payment"
          ? "We couldn't set up this payment. Please review the details and try again."
          : "We couldn't set up this deposit. Please review the details and try again.",
      devDetail,
      retryable: true,
      kind: "validation",
    };
  }

  // 4. Server error (5xx) — transient, retryable.
  if (status != null && status >= 500) {
    return {
      title: "Service temporarily unavailable",
      userMessage:
        "Our payments partner is taking longer than usual. Please try again in a moment.",
      devDetail,
      retryable: true,
      kind: "server",
    };
  }

  // 5. No status at all — almost always a network/transport failure.
  if (status == null) {
    return {
      title: "Connection problem",
      userMessage:
        "We couldn't reach our servers. Check your connection and try again.",
      devDetail,
      retryable: true,
      kind: "network",
    };
  }

  // 6. Anything else.
  return {
    title: "Something went wrong",
    userMessage: "We couldn't complete that request. Please try again.",
    devDetail,
    retryable: true,
    kind: "unknown",
  };
}
