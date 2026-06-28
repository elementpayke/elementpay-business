export type InvoiceWhatsAppShareArgs = {
  publicUrl: string;
  invoiceNumber: string;
  clientName?: string | null;
  toPhone?: string | null;
};

function cleanPhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function buildInvoiceWhatsAppShareUrl({
  publicUrl,
  invoiceNumber,
  clientName,
  toPhone,
}: InvoiceWhatsAppShareArgs): string {
  const recipient = clientName?.trim() ? ` for ${clientName.trim()}` : "";
  const text = `Invoice ${invoiceNumber}${recipient} is ready. Pay securely: ${publicUrl}`;
  const phone = cleanPhone(toPhone);
  const path = phone ? `/${phone}` : "/";
  return `https://wa.me${path}?text=${encodeURIComponent(text)}`;
}
