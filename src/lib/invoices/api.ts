import { authedFetch } from "@/lib/authedFetch";
import type { InvoiceCreatePayload } from "@/stores/invoicePayload";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export class InvoiceApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "InvoiceApiError";
    this.status = status;
    this.body = body;
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const isJson = res.headers
    .get("content-type")
    ?.toLowerCase()
    .includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const message =
      (body as { message?: string; error?: string })?.message ||
      (body as { error?: string })?.error ||
      `Invoice request failed (${res.status})`;
    throw new InvoiceApiError(message, res.status, body);
  }
  return ((body as { data?: T })?.data ?? (body as T)) as T;
}

export type SendVia = "none" | "email" | "whatsapp" | "both";

export type InvoiceDraft = {
  id: number;
  business_id: number;
  title: string | null;
  due_date: string | null;
  payload: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
};

export type Invoice = {
  id: number;
  business_id: number;
  draft_id: number | null;
  invoice_number: string;
  status: string;
  payload: Record<string, unknown>;
  send_via: string | null;
  sent_at: string | null;
  paid_at: string | null;
  public_token: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PublicLink = {
  public_url: string;
  public_pdf_url: string;
};

type InvoiceDraftLineItemBody = {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
};

export type InvoiceDraftSupportingDocumentBody = {
  id: string;
  name: string;
  size_bytes: number;
  mime_type: string;
};

export type InvoiceDraftPayloadBody = {
  line_items: InvoiceDraftLineItemBody[];
  supporting_documents: InvoiceDraftSupportingDocumentBody[];
  currency: string;
  notes: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  details: InvoiceCreatePayload;
};

export type InvoiceDraftRequestBody = {
  title: string | null;
  due_date: string | null;
  payload: InvoiceDraftPayloadBody;
};

/**
 * Build the backend draft payload from the rich frontend invoice payload.
 *
 * The backend's DraftPayloadIn surfaces a few top-level keys (currency,
 * notes, client_name, client_email, client_phone, line_items) that drive
 * PDF rendering and email/whatsapp delivery. We keep the full rich FE
 * payload alongside under `details` so the dashboard can render it back
 * without lossy round-trips.
 */
function buildDraftPayload(
  payload: InvoiceCreatePayload,
): InvoiceDraftPayloadBody {
  const lineItems = payload.lineItems.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    amount: item.amount,
  }));
  const supportingDocuments = payload.supportingDocuments.map((document) => ({
    id: document.id,
    name: document.name,
    size_bytes: document.sizeBytes,
    mime_type: document.mimeType,
  }));

  return {
    line_items: lineItems,
    supporting_documents: supportingDocuments,
    currency: payload.invoice.currency || "USD",
    notes: payload.invoice.note,
    client_name: payload.client.fullName || "",
    client_email: payload.client.email || "",
    client_phone: payload.client.phone.e164 || payload.client.phone.raw || "",
    details: payload,
  };
}

export function buildDraftRequestBody(
  payload: InvoiceCreatePayload,
): InvoiceDraftRequestBody {
  return {
    title: payload.invoice.title || null,
    due_date: payload.invoice.dueDate || null,
    payload: buildDraftPayload(payload),
  };
}

export async function getNextInvoiceId(): Promise<{
  next_invoice_number: string;
}> {
  const res = await authedFetch(`${API_BASE}/api/v1/invoices/next-id`);
  return parseResponse(res);
}

export async function createDraft(
  payload: InvoiceCreatePayload,
): Promise<InvoiceDraft> {
  const res = await authedFetch(`${API_BASE}/api/v1/invoices/drafts`, {
    method: "POST",
    body: JSON.stringify(buildDraftRequestBody(payload)),
  });
  return parseResponse(res);
}

export async function updateDraft(
  draftId: number,
  payload: InvoiceCreatePayload,
): Promise<InvoiceDraft> {
  const res = await authedFetch(
    `${API_BASE}/api/v1/invoices/drafts/${encodeURIComponent(String(draftId))}`,
    {
      method: "PUT",
      body: JSON.stringify(buildDraftRequestBody(payload)),
    },
  );
  return parseResponse(res);
}

export async function saveInvoiceDraft(
  payload: InvoiceCreatePayload,
  draftId: number | null,
): Promise<InvoiceDraft> {
  if (draftId == null) {
    return createDraft(payload);
  }

  try {
    return await updateDraft(draftId, payload);
  } catch (err) {
    if (err instanceof InvoiceApiError && err.status === 404) {
      return createDraft(payload);
    }
    throw err;
  }
}

export async function getDraft(draftId: number): Promise<InvoiceDraft> {
  const res = await authedFetch(
    `${API_BASE}/api/v1/invoices/drafts/${encodeURIComponent(String(draftId))}`,
  );
  return parseResponse(res);
}

export async function deleteDraft(draftId: number): Promise<void> {
  const res = await authedFetch(
    `${API_BASE}/api/v1/invoices/drafts/${encodeURIComponent(String(draftId))}`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    throw new InvoiceApiError(
      `Failed to delete draft (${res.status})`,
      res.status,
      null,
    );
  }
}

export async function issueInvoice(args: {
  draftId: number;
  sendVia: SendVia;
}): Promise<Invoice> {
  const res = await authedFetch(`${API_BASE}/api/v1/invoices`, {
    method: "POST",
    body: JSON.stringify({
      draft_id: args.draftId,
      send_via: args.sendVia,
    }),
  });
  return parseResponse(res);
}

export async function sendInvoice(args: {
  invoiceId: number;
  sendVia: SendVia;
  toEmail?: string | null;
  toPhoneE164?: string | null;
}): Promise<Invoice> {
  const res = await authedFetch(
    `${API_BASE}/api/v1/invoices/${encodeURIComponent(
      String(args.invoiceId),
    )}/send`,
    {
      method: "POST",
      body: JSON.stringify({
        send_via: args.sendVia,
        to_email: args.toEmail ?? null,
        to_phone_e164: args.toPhoneE164 ?? null,
      }),
    },
  );
  return parseResponse(res);
}

export async function getPublicLink(invoiceId: number): Promise<PublicLink> {
  const res = await authedFetch(
    `${API_BASE}/api/v1/invoices/${encodeURIComponent(
      String(invoiceId),
    )}/public-link`,
  );
  return parseResponse(res);
}

export async function getInvoice(invoiceId: number): Promise<Invoice> {
  const res = await authedFetch(
    `${API_BASE}/api/v1/invoices/${encodeURIComponent(String(invoiceId))}`,
  );
  return parseResponse(res);
}
