"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import Flag from "@/components/dashboard/Flag";
import {
  findCountry,
  invoiceCurrencies,
  paymentMethodsByCountry,
  receivingWallets,
} from "@/components/invoices/invoiceData";
import {
  calculateTotals,
  formatInvoiceMoney,
  formatInvoiceMoneyCompact,
  useInvoiceStore,
} from "@/stores/invoiceStore";

function formatDisplayDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export default function InvoicePreview() {
  const draft = useInvoiceStore((s) => s.draft);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const payload = `${window.location.origin}/pay/${draft.invoiceId}`;
    QRCode.toDataURL(payload, {
      width: 140,
      margin: 1,
      color: { dark: "#413ACB", light: "#FFFFFF" },
    })
      .then((url: string) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [draft.invoiceId]);

  const totals = calculateTotals(draft);
  const currency = draft.preferredCurrency || "USD";
  const currencyName = invoiceCurrencies.find((c) => c.code === currency)?.name ?? currency;
  const clientCountry = findCountry(draft.client.country);
  const billerCountry = findCountry(draft.biller.country);
  const wallet = receivingWallets.find((w) => w.id === draft.receivingWalletId);
  const methodList = clientCountry ? paymentMethodsByCountry[clientCountry.code] : [];
  const paymentMethod = methodList.find((m) => m.id === draft.preferredPaymentMethod);

  const billerName = [draft.biller.firstName, draft.biller.lastName].filter(Boolean).join(" ") || "—";
  const clientName = [draft.client.firstName, draft.client.lastName].filter(Boolean).join(" ") || "—";

  return (
    <article className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500">
            <span className="block h-6 w-6 rounded-md bg-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-[#1A2138]">
              {draft.invoiceTitle || `Invoice for ${clientName}`}
            </h1>
          </div>
        </div>
        <div className="flex h-[120px] w-[120px] items-center justify-center rounded-xl bg-white">
          {qrDataUrl ? (
            <Image src={qrDataUrl} alt="Invoice QR code" width={120} height={120} unoptimized />
          ) : (
            <div className="h-full w-full animate-pulse rounded-md bg-[#F4F5F9]" />
          )}
        </div>
      </header>

      <div className="h-px w-full bg-[#ECEEF4]" />

      <section className="grid gap-6 sm:grid-cols-3">
        <InfoBlock label="Invoice ID" value={draft.invoiceId} />
        <InfoBlock label="Issue date" value={formatDisplayDate(draft.issueDate)} />
        <InfoBlock label="Due date" value={formatDisplayDate(draft.dueDate)} />
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <PartyBlock
          label="Billed by:"
          name={billerName}
          email={draft.biller.email}
          phone={draft.biller.phone}
          country={billerCountry?.name}
          countryCode={draft.biller.country || undefined}
          address={draft.biller.address}
          dialCode={billerCountry?.dialCode}
        />
        <PartyBlock
          label="Billed to:"
          name={clientName}
          email={draft.client.email}
          phone={draft.client.phone}
          country={clientCountry?.name}
          countryCode={draft.client.country || undefined}
          address={draft.client.address}
          dialCode={clientCountry?.dialCode}
        />
      </section>

      {paymentMethod ? (
        <section className="space-y-2">
          <p className="text-xs text-[#8E93A7]">Payment method</p>
          <p className="text-[15px] font-semibold text-[#1A2138]">{paymentMethod.label}</p>
          <dl className="mt-3 space-y-2 text-sm">
            {paymentMethod.fields.map((field) => {
              const value = draft.paymentMethodFields[field.key];
              if (!value) return null;
              return (
                <div key={field.key}>
                  <dt className="text-xs text-[#8E93A7]">{field.label}</dt>
                  <dd className="font-medium text-[#1A2138]">{value}</dd>
                </div>
              );
            })}
            {wallet ? (
              <div>
                <dt className="text-xs text-[#8E93A7]">Receiving wallet</dt>
                <dd className="font-medium text-[#1A2138]">
                  {wallet.label} · {wallet.currency}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs text-[#8E93A7]">Preferred currency</dt>
              <dd className="font-medium text-[#1A2138]">
                {currencyName} ({currency})
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="overflow-hidden rounded-xl border border-[#ECEEF4]">
          <div className="grid grid-cols-[80px_minmax(0,2fr)_100px_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] items-center gap-2 border-b border-[#ECEEF4] bg-[#FAFBFE] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8E93A7]">
            <div>Item No.</div>
            <div>Description</div>
            <div>Quantity</div>
            <div>Unit price</div>
            <div>Amount</div>
            <div>USD Equiv.</div>
          </div>
          <div className="divide-y divide-[#ECEEF4]">
            {draft.lineItems.map((item, index) => {
              const amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
              const usd = amount > 0 ? amount / 10.76 : 0;
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[80px_minmax(0,2fr)_100px_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] items-center gap-2 px-4 py-3 text-sm"
                >
                  <div className="text-[#5F667D]">{index + 1}</div>
                  <div className="font-medium text-[#1A2138]">{item.description || "—"}</div>
                  <div className="text-[#3F465E]">{item.quantity}</div>
                  <div className="text-[#3F465E]">{formatInvoiceMoneyCompact(item.unitPrice, currency)}</div>
                  <div className="font-medium text-[#1A2138]">
                    {formatInvoiceMoneyCompact(amount, currency)}
                  </div>
                  <div className="text-[#8E93A7]">USD {usd.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="flex justify-end">
        <dl className="w-full max-w-md space-y-3 text-sm">
          <Row label="Subtotal" value={formatInvoiceMoney(totals.subtotal, currency)} />
          {draft.vatEnabled ? (
            <Row
              label="VAT"
              extra={<span className="text-xs text-[#8E93A7]">{draft.vatPercent}%</span>}
              value={`+${formatInvoiceMoney(totals.vat, currency)}`}
            />
          ) : null}
          {draft.discountEnabled ? (
            <Row
              label="Discount"
              extra={<span className="text-xs text-[#8E93A7]">{draft.discountPercent}%</span>}
              value={`-${formatInvoiceMoney(totals.discount, currency)}`}
            />
          ) : null}
          {draft.shippingEnabled ? (
            <Row label="Shipping" value={`+${formatInvoiceMoney(totals.shipping, currency)}`} />
          ) : null}
          <div className="flex items-center justify-between border-t border-[#ECEEF4] pt-3">
            <span className="text-sm font-semibold text-[#1A2138]">Total</span>
            <span className="text-base font-bold text-tertiary-500">
              {formatInvoiceMoney(totals.total, currency)}
            </span>
          </div>
        </dl>
      </section>

      {draft.note ? (
        <section className="space-y-2">
          <p className="text-xs text-[#8E93A7]">Note to client</p>
          <p className="whitespace-pre-line text-sm text-[#1A2138]">{draft.note}</p>
        </section>
      ) : null}
    </article>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#8E93A7]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#1A2138]">{value}</p>
    </div>
  );
}

type PartyBlockProps = {
  label: string;
  name: string;
  email: string;
  phone: string;
  country?: string;
  countryCode?: string;
  address: string;
  dialCode?: string;
};

function PartyBlock({ label, name, email, phone, country, countryCode, address, dialCode }: PartyBlockProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-[#8E93A7]">{label}</p>
      <p className="text-[15px] font-semibold text-[#1A2138]">{name}</p>
      {email ? <p className="text-sm text-[#4D556D]">{email}</p> : null}
      {phone && dialCode ? (
        <p className="text-sm text-[#4D556D]">
          {dialCode} {phone}
        </p>
      ) : null}
      {country ? (
        <p className="flex items-center gap-2 text-sm text-[#4D556D]">
          {countryCode && (countryCode === "KE" || countryCode === "NG" || countryCode === "GH") ? (
            <Flag code={countryCode} size={14} />
          ) : null}
          {address ? `${address}, ${country}` : country}
        </p>
      ) : address ? (
        <p className="text-sm text-[#4D556D]">{address}</p>
      ) : null}
    </div>
  );
}

function Row({ label, value, extra }: { label: string; value: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-[#3F465E]">
        {label}
        {extra}
      </span>
      <span className="font-medium text-[#1A2138]">{value}</span>
    </div>
  );
}
