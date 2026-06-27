import {
  COUNTRY_CODE,
  isMobileMoneyMethod,
  type Country,
} from "@/components/payments/paymentData";
import { fetchExchangeRates } from "@/lib/dashboard/api";
import {
  acceptOrderQuote,
  createOrderQuote,
  type OrderQuoteOffRampIn,
  type OrderQuoteOut,
} from "@/lib/orders";
import type { BulkParsedRow, BulkRowPayload } from "@/lib/payments/bulkTypes";

/** Yellow Card OffRamp corridors use Polygon USDT (see ORDER_FLOW.md). */
export const OFFRAMP_ASSET_TOKEN = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";

const PROBE_CRYPTO_AMOUNT = "10";
const FIAT_TOLERANCE = 0.01;
/** Safety cap for same-day MVP — raise when treasury batch API ships. */
export const MAX_BULK_EXECUTE_ROWS = 25;

export type BulkSenderContext = {
  refundAddress: string;
  senderName?: string;
  senderCountry?: string;
  senderEmail?: string;
};

export type BulkLineSuccess = {
  rowIndex: number;
  externalOrderId: string;
  quoteId: string;
  merchantOrderId: number;
  txHash: string | null;
  fiatAmount: string;
  cryptoAmount: string;
};

export type BulkLineFailure = {
  row: BulkParsedRow;
  message: string;
};

function toCryptoAmount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Invalid crypto amount for quote.");
  }
  return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function countryCode(country: string): string {
  return COUNTRY_CODE[country as Country] ?? country.slice(0, 2).toUpperCase();
}

export function resolveBulkDestination(
  payload: BulkRowPayload,
): OrderQuoteOffRampIn["destination"] | null {
  const cc = countryCode(payload.country);
  const method = payload.paymentMethod.toLowerCase();

  if (method.includes("paybill") || payload.paybillNumber) {
    const num = payload.paybillNumber?.trim();
    if (!num) return null;
    return {
      accountType: "paybill",
      accountNumber: num,
      accountName: payload.recipientName,
      countryCode: cc,
    };
  }

  if (method.includes("bank") || payload.accountNumber) {
    const num = payload.accountNumber?.trim();
    if (!num) return null;
    return {
      accountType: "bank",
      accountNumber: num,
      accountName: payload.recipientName,
      countryCode: cc,
    };
  }

  if (isMobileMoneyMethod(payload.paymentMethod) || payload.phoneNumber) {
    const phone =
      payload.phoneNumber?.trim() ||
      (payload.recipientIdentifier.startsWith("+") ? payload.recipientIdentifier : "");
    if (!phone) return null;
    return {
      accountType: "momo",
      accountNumber: phone,
      accountName: payload.recipientName,
      countryCode: cc,
    };
  }

  return null;
}

async function quoteOfframpForFiat(
  fiatTarget: number,
  base: Omit<OrderQuoteOffRampIn, "crypto_amount">,
): Promise<OrderQuoteOut> {
  const quoteFor = (cryptoAmount: string) =>
    createOrderQuote({ ...base, crypto_amount: cryptoAmount });

  let rate: number | null = null;
  try {
    const fx = await fetchExchangeRates();
    const r = fx?.rates?.[base.currency];
    if (typeof r === "number" && r > 0) rate = r;
  } catch {
    /* fall through to probe quote */
  }

  if (rate === null) {
    const probe = await quoteFor(PROBE_CRYPTO_AMOUNT);
    const achieved = Number(probe.amounts.user_receives.amount);
    const probeUnits = Number(PROBE_CRYPTO_AMOUNT);
    rate =
      achieved > 0 && probeUnits > 0
        ? achieved / probeUnits
        : Number(probe.amounts.rate ?? 0) || null;
    if (rate === null) {
      throw new Error("Could not determine exchange rate for this corridor.");
    }
  }

  let res = await quoteFor(toCryptoAmount(fiatTarget / rate));
  const achievedFiat = Number(res.amounts.user_receives.amount);
  if (
    achievedFiat > 0 &&
    Math.abs(achievedFiat - fiatTarget) / fiatTarget > FIAT_TOLERANCE
  ) {
    const quotedCrypto = Number(res.amounts.user_pays.amount);
    if (quotedCrypto > 0) {
      res = await quoteFor(toCryptoAmount(quotedCrypto * (fiatTarget / achievedFiat)));
    }
  }
  return res;
}

export async function executeBulkRow(
  row: BulkParsedRow,
  ctx: BulkSenderContext,
  batchRef: string,
): Promise<BulkLineSuccess> {
  const destination = resolveBulkDestination(row.payload);
  if (!destination) {
    throw new Error(
      `Row ${row.rowIndex}: unsupported payment method or missing account details.`,
    );
  }

  const cc = countryCode(row.payload.country);
  const externalOrderId =
    row.payload.reference?.trim() ||
    `bulk-${batchRef}-row-${row.rowIndex}`;

  const base: Omit<OrderQuoteOffRampIn, "crypto_amount"> = {
    order_type: "OffRamp",
    token: OFFRAMP_ASSET_TOKEN,
    currency: row.payload.currency,
    country: cc,
    refund_address: ctx.refundAddress,
    destination,
    external_order_id: externalOrderId,
    sender: {
      name: ctx.senderName,
      country: ctx.senderCountry ?? cc,
      email: ctx.senderEmail,
    },
  };

  const quote = await quoteOfframpForFiat(row.payload.amount, base);
  const accepted = await acceptOrderQuote(quote.quote_id);

  return {
    rowIndex: row.rowIndex,
    externalOrderId,
    quoteId: quote.quote_id,
    merchantOrderId: accepted.merchant_order_id,
    txHash: accepted.order.psp_transaction_id,
    fiatAmount: accepted.order.amount_fiat,
    cryptoAmount: accepted.order.amount_crypto ?? quote.amounts.user_pays.amount,
  };
}
