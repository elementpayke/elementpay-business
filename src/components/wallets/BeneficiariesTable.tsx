"use client";

import { MoreHorizontal, Plus } from "lucide-react";
import Flag from "@/components/dashboard/Flag";
import type { CountryCode } from "@/components/dashboard/dashboardData";

export type Beneficiary = {
  id: string;
  name: string;
  destination: string;
  country: CountryCode;
  rail: string;
  lastUsed: string;
};

export default function BeneficiariesTable({
  beneficiaries,
  onAdd,
}: {
  beneficiaries: Beneficiary[];
  onAdd?: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#7E8498]">
          Saved recipients funded directly from this wallet.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-2 text-xs font-semibold text-white transition hover:brightness-105"
        >
          <Plus className="h-3.5 w-3.5" />
          Add beneficiary
        </button>
      </div>

      {beneficiaries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E1E4EE] bg-[#FAFBFE] px-5 py-10 text-center">
          <p className="text-sm font-medium text-[#1A2138]">No beneficiaries yet</p>
          <p className="mt-1 text-xs text-[#8E93A7]">
            Save recipients to send payments faster from this wallet.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#ECEEF5]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAFBFE] text-xs font-medium uppercase tracking-[0.06em] text-[#8E93A7]">
              <tr>
                <th className="px-4 py-3">Beneficiary</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Payment rail</th>
                <th className="px-4 py-3">Last used</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECEEF5]">
              {beneficiaries.map((b) => (
                <tr key={b.id} className="bg-white">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#1A2138]">{b.name}</p>
                    <p className="text-xs text-[#8E93A7]">{b.destination}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-[#4D556C]">
                      <Flag code={b.country} size={14} />
                      {b.country}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#4D556C]">{b.rail}</td>
                  <td className="px-4 py-3 text-[#4D556C]">{b.lastUsed}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      aria-label={`Open actions for ${b.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#8E93A7] transition hover:bg-[#F1F3F9] hover:text-[#1A2138]"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
