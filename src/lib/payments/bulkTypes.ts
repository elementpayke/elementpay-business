import type { Country } from "@/components/payments/paymentData";

export const BULK_REQUIRED_COLUMNS = [
  "recipient_name",
  "recipient_identifier",
  "country",
  "payment_method",
  "amount",
  "currency",
] as const;

export const BULK_OPTIONAL_COLUMNS = [
  "phone_number",
  "email",
  "bank_name",
  "account_number",
  "paybill_number",
  "reference",
] as const;

export type BulkCsvColumn =
  | (typeof BULK_REQUIRED_COLUMNS)[number]
  | (typeof BULK_OPTIONAL_COLUMNS)[number];

export type BulkRowStatus = "valid" | "invalid";

export type BulkRowPayload = {
  recipientName: string;
  recipientIdentifier: string;
  country: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  phoneNumber?: string;
  email?: string;
  bankName?: string;
  accountNumber?: string;
  paybillNumber?: string;
  reference?: string;
};

export type BulkParsedRow = {
  rowIndex: number;
  raw: Record<string, string>;
  payload: BulkRowPayload;
  status: BulkRowStatus;
  errors: string[];
};

export type BulkParseSummary = {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  totalAmount: number;
  currencies: string[];
};

export type BulkParseResult = {
  rows: BulkParsedRow[];
  summary: BulkParseSummary;
  fileErrors: string[];
  headerErrors: string[];
};

export type BulkUploadedFileMeta = {
  name: string;
  size: number;
  lastModified: number;
};

export type BulkProcessingStage =
  | "validating-batch"
  | "reserving-fees"
  | "initializing-queue"
  | "sending-transfers"
  | "finalizing"
  | "done";

export type BulkProgressSnapshot = {
  stage: BulkProcessingStage;
  totalRecipients: number;
  processed: number;
  successful: number;
  failed: number;
  pending: number;
};

export type BulkBatchResult = {
  batchId: string;
  totalRecipients: number;
  successful: number;
  failed: number;
  processingMs: number;
  completedAt: number;
  failedRows: BulkParsedRow[];
};

export type BulkError = {
  code: string;
  message: string;
  retryable: boolean;
};

export type BulkPhase =
  | "csv-upload"
  | "csv-validating"
  | "recipients-preview"
  | "payment-review"
  | "processing"
  | "success"
  | "error";

export const SUPPORTED_CURRENCIES = ["KES", "USD", "NGN", "GHS", "UGX", "TZS"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const COUNTRY_ALIASES: Record<string, Country> = {
  kenya: "Kenya",
  ke: "Kenya",
  nigeria: "Nigeria",
  ng: "Nigeria",
  ghana: "Ghana",
  gh: "Ghana",
  uganda: "Uganda",
  ug: "Uganda",
  tanzania: "Tanzania",
  tz: "Tanzania",
};
