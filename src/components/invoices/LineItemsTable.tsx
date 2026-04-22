"use client";

import { useState } from "react";
import { ChevronUp, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/invoices/formPrimitives";
import { useInvoiceStore, formatInvoiceMoneyCompact, type LineItem } from "@/stores/invoiceStore";

export default function LineItemsTable() {
  const draft = useInvoiceStore((s) => s.draft);
  const addLineItem = useInvoiceStore((s) => s.addLineItem);
  const removeLineItem = useInvoiceStore((s) => s.removeLineItem);
  const clearLineItems = useInvoiceStore((s) => s.clearLineItems);
  const updateLineItem = useInvoiceStore((s) => s.updateLineItem);

  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const currency = draft.preferredCurrency || "USD";

  function toggleRow(id: string, next: boolean) {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }

  function toggleAll(next: boolean) {
    setSelected(next ? new Set(draft.lineItems.map((i) => i.id)) : new Set());
  }

  const allSelected = draft.lineItems.length > 0 && selected.size === draft.lineItems.length;

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-[#1C2238]"
      >
        <ChevronUp
          className={`h-4 w-4 text-[#7E8498] transition-transform ${collapsed ? "rotate-180" : ""}`}
        />
        Line items
        <span className="text-xs font-medium text-[#9CA3B6]">{draft.lineItems.length} items</span>
      </button>

      {!collapsed ? (
        <>
          <div className="overflow-hidden rounded-xl border border-[#ECEEF4] bg-white">
            <div className="grid grid-cols-[44px_64px_minmax(0,2fr)_96px_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_56px] items-center gap-2 border-b border-[#ECEEF4] bg-[#FAFBFE] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8E93A7]">
              <div className="flex justify-center">
                <Checkbox checked={allSelected} onChange={toggleAll} />
              </div>
              <div>Item No.</div>
              <div>Description</div>
              <div>Quantity</div>
              <div>Unit price</div>
              <div>Amount</div>
              <div>USD Equiv.</div>
              <div className="text-right">Action</div>
            </div>
            <div className="divide-y divide-[#ECEEF4]">
              {draft.lineItems.map((item, index) => (
                <LineItemRow
                  key={item.id}
                  item={item}
                  index={index + 1}
                  selected={selected.has(item.id)}
                  onSelect={(next) => toggleRow(item.id, next)}
                  onChange={(patch) => updateLineItem(item.id, patch)}
                  onRemove={() => {
                    removeLineItem(item.id);
                    setSelected((prev) => {
                      const copy = new Set(prev);
                      copy.delete(item.id);
                      return copy;
                    });
                  }}
                  currency={currency}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-5 text-sm">
            <button
              type="button"
              onClick={addLineItem}
              className="font-medium text-primary-600 transition hover:text-primary-700"
            >
              Add new item
            </button>
            <button
              type="button"
              onClick={clearLineItems}
              className="font-medium text-[#E35D5B] transition hover:text-[#BF3F3D]"
            >
              Delete all items
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}

type LineItemRowProps = {
  item: LineItem;
  index: number;
  selected: boolean;
  onSelect: (next: boolean) => void;
  onChange: (patch: Partial<Omit<LineItem, "id">>) => void;
  onRemove: () => void;
  currency: string;
};

function LineItemRow({ item, index, selected, onSelect, onChange, onRemove, currency }: LineItemRowProps) {
  const amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  const usdEquivalent = amount > 0 ? amount / 10.76 : 0;

  return (
    <div className="grid grid-cols-[44px_64px_minmax(0,2fr)_96px_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_56px] items-center gap-2 px-3 py-2.5 text-sm text-[#1F2640]">
      <div className="flex justify-center">
        <Checkbox checked={selected} onChange={onSelect} />
      </div>
      <div className="text-[#5F667D]">{index}</div>
      <input
        type="text"
        placeholder="Service name"
        value={item.description}
        onChange={(e) => onChange({ description: e.target.value })}
        className="h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-sm text-[#1F2640] outline-none transition hover:border-[#ECEEF4] focus:border-primary-300 focus:bg-white"
      />
      <input
        type="number"
        min="0"
        step="1"
        value={item.quantity}
        onChange={(e) => onChange({ quantity: Number(e.target.value) || 0 })}
        className="h-9 w-20 rounded-md border border-transparent bg-transparent px-2 text-sm text-[#1F2640] outline-none transition hover:border-[#ECEEF4] focus:border-primary-300 focus:bg-white"
      />
      <CurrencyCellInput
        currency={currency}
        value={item.unitPrice}
        onChange={(v) => onChange({ unitPrice: v })}
      />
      <div className="text-sm font-medium text-[#1F2640]">{formatInvoiceMoneyCompact(amount, currency)}</div>
      <div className="text-sm text-[#8E93A7]">USD {usdEquivalent.toFixed(2)}</div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove item"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#E35D5B] transition hover:bg-[#FFF5F4]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function CurrencyCellInput({
  currency,
  value,
  onChange,
}: {
  currency: string;
  value: number;
  onChange: (next: number) => void;
}) {
  const display = value === 0 ? "" : String(value);
  return (
    <div className="flex h-9 items-center gap-1 rounded-md border border-transparent bg-transparent px-2 transition hover:border-[#ECEEF4] focus-within:border-primary-300 focus-within:bg-white">
      <span className="text-xs font-medium text-[#8E93A7]">{currency}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={display}
        placeholder="0"
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-full w-full min-w-0 bg-transparent text-sm text-[#1F2640] outline-none"
      />
    </div>
  );
}
