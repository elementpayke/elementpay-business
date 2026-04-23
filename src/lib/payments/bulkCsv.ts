import { paymentMethodsByCountry, type Country } from "@/components/payments/paymentData";
import {
  BULK_REQUIRED_COLUMNS,
  COUNTRY_ALIASES,
  SUPPORTED_CURRENCIES,
  type BulkParseResult,
  type BulkParsedRow,
  type BulkRowPayload,
} from "@/lib/payments/bulkTypes";

export const MAX_CSV_BYTES = 5 * 1024 * 1024;
export const MAX_CSV_ROWS = 5000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{7,15}$/;

export function normalizeHeader(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

export function parseCsvText(text: string): { headers: string[]; rows: string[][] } {
  const normalized = text.replace(/\r\n?/g, "\n").replace(/^﻿/, "");
  const lines = normalized.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
  const rows = lines.slice(1).map(splitCsvLine);
  return { headers, rows };
}

function resolveCountry(input: string): Country | null {
  const key = input.trim().toLowerCase();
  if (key in COUNTRY_ALIASES) return COUNTRY_ALIASES[key];
  return null;
}

function isSupportedCurrency(input: string): boolean {
  return SUPPORTED_CURRENCIES.includes(input.toUpperCase() as (typeof SUPPORTED_CURRENCIES)[number]);
}

function parseAmount(input: string): number | null {
  const cleaned = input.replace(/,/g, "").trim();
  if (cleaned.length === 0) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return n;
}

function looksLikeEmail(s: string): boolean {
  return EMAIL_RE.test(s);
}

function looksLikePhone(s: string): boolean {
  return PHONE_RE.test(s.replace(/\s/g, ""));
}

function validatePaymentMethod(country: Country, method: string): boolean {
  const options = paymentMethodsByCountry[country] ?? [];
  if (options.length === 0) return true;
  const m = method.trim().toLowerCase();
  return options.some((opt) => opt.toLowerCase() === m) || m.length > 0;
}

export function validateFileMeta(file: { name: string; size: number; type?: string }): string[] {
  const errors: string[] = [];
  const name = file.name.toLowerCase();
  if (!name.endsWith(".csv")) errors.push("File must be a .csv");
  if (file.type && file.type !== "" && !file.type.includes("csv") && !file.type.includes("excel") && file.type !== "text/plain") {
    errors.push(`Unsupported MIME type: ${file.type}`);
  }
  if (file.size <= 0) errors.push("File is empty");
  if (file.size > MAX_CSV_BYTES) {
    errors.push(`File exceeds ${Math.round(MAX_CSV_BYTES / (1024 * 1024))}MB limit`);
  }
  return errors;
}

function validateHeaders(headers: string[]): string[] {
  const errors: string[] = [];
  const present = new Set(headers);
  for (const required of BULK_REQUIRED_COLUMNS) {
    if (!present.has(required)) errors.push(`Missing required column: ${required}`);
  }
  return errors;
}

function buildPayload(record: Record<string, string>): BulkRowPayload {
  const rawAmount = record.amount ?? "";
  return {
    recipientName: record.recipient_name ?? "",
    recipientIdentifier: record.recipient_identifier ?? "",
    country: record.country ?? "",
    paymentMethod: record.payment_method ?? "",
    amount: parseAmount(rawAmount) ?? 0,
    currency: (record.currency ?? "").toUpperCase(),
    phoneNumber: record.phone_number || undefined,
    email: record.email || undefined,
    bankName: record.bank_name || undefined,
    accountNumber: record.account_number || undefined,
    paybillNumber: record.paybill_number || undefined,
    reference: record.reference || undefined,
  };
}

function validateRow(
  rowIndex: number,
  record: Record<string, string>,
): BulkParsedRow {
  const errors: string[] = [];
  const payload = buildPayload(record);

  if (!payload.recipientName) errors.push("Recipient name is required");
  if (!payload.recipientIdentifier) {
    errors.push("Recipient identifier is required");
  } else if (!looksLikeEmail(payload.recipientIdentifier) && !looksLikePhone(payload.recipientIdentifier)) {
    errors.push("Identifier must be a valid email or phone number");
  }

  const country = resolveCountry(payload.country);
  if (!country) {
    errors.push(`Unsupported country: ${payload.country || "—"}`);
  } else {
    payload.country = country;
    if (!validatePaymentMethod(country, payload.paymentMethod)) {
      errors.push(`Payment method "${payload.paymentMethod}" not available for ${country}`);
    }
  }

  const rawAmount = record.amount ?? "";
  const parsedAmount = parseAmount(rawAmount);
  if (parsedAmount === null) {
    errors.push("Amount must be numeric");
  } else if (parsedAmount <= 0) {
    errors.push("Amount must be greater than 0");
  }

  if (!payload.currency) {
    errors.push("Currency is required");
  } else if (!isSupportedCurrency(payload.currency)) {
    errors.push(`Unsupported currency: ${payload.currency}`);
  }

  return {
    rowIndex,
    raw: record,
    payload,
    status: errors.length === 0 ? "valid" : "invalid",
    errors,
  };
}

export function validateParsedCsv(headers: string[], rows: string[][]): BulkParseResult {
  const headerErrors = validateHeaders(headers);
  const fileErrors: string[] = [];

  if (rows.length === 0) fileErrors.push("CSV contains no data rows");
  if (rows.length > MAX_CSV_ROWS) {
    fileErrors.push(`CSV exceeds maximum of ${MAX_CSV_ROWS} rows`);
  }

  if (headerErrors.length > 0) {
    return {
      rows: [],
      summary: {
        totalRows: rows.length,
        validCount: 0,
        invalidCount: rows.length,
        totalAmount: 0,
        currencies: [],
      },
      fileErrors,
      headerErrors,
    };
  }

  const parsedRows = rows.map((cols, idx) => {
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = (cols[i] ?? "").trim();
    });
    return validateRow(idx + 2, record);
  });

  let totalAmount = 0;
  const currencySet = new Set<string>();
  let validCount = 0;
  for (const row of parsedRows) {
    if (row.status === "valid") {
      validCount += 1;
      totalAmount += row.payload.amount;
      if (row.payload.currency) currencySet.add(row.payload.currency);
    }
  }

  return {
    rows: parsedRows,
    summary: {
      totalRows: parsedRows.length,
      validCount,
      invalidCount: parsedRows.length - validCount,
      totalAmount,
      currencies: Array.from(currencySet),
    },
    fileErrors,
    headerErrors: [],
  };
}

export async function parseAndValidateFile(file: File): Promise<BulkParseResult> {
  const metaErrors = validateFileMeta({ name: file.name, size: file.size, type: file.type });
  if (metaErrors.length > 0) {
    return {
      rows: [],
      summary: { totalRows: 0, validCount: 0, invalidCount: 0, totalAmount: 0, currencies: [] },
      fileErrors: metaErrors,
      headerErrors: [],
    };
  }
  const text = await file.text();
  const { headers, rows } = parseCsvText(text);
  return validateParsedCsv(headers, rows);
}

export function toFailedRowsCsv(rows: BulkParsedRow[]): string {
  const headers = [...BULK_REQUIRED_COLUMNS, "error"];
  const lines = [headers.join(",")];
  for (const row of rows) {
    const cells = BULK_REQUIRED_COLUMNS.map((col) => csvEscape(row.raw[col] ?? ""));
    cells.push(csvEscape(row.errors.join("; ")));
    lines.push(cells.join(","));
  }
  return lines.join("\n");
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
