"use client";

import { Loader2, ShieldCheck } from "lucide-react";

export type PendingAction = {
  status: "pending_confirmation";
  action_id: string;
  tool: string;
  args: Record<string, unknown>;
  summary: string;
  message: string;
};

export default function PendingActionCard({
  action,
  confirming,
  onConfirm,
  onDismiss,
}: {
  action: PendingAction;
  confirming: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="rounded-xl border border-[#F5D69A] bg-[#FFFBF0] p-4 text-sm">
      <div className="flex items-start gap-2">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#B8860B]" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#5C4A12]">Confirmation required</p>
          <p className="mt-1 text-[#6B5A2E]">{action.summary}</p>
          <p className="mt-2 text-xs text-[#8A7340]">{action.message}</p>
          <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-white/80 p-2 text-[10px] text-[#4D556D]">
            {JSON.stringify(action.args, null, 2)}
          </pre>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirming}
          className="h-10 flex-1 rounded-lg bg-primary-500 text-xs font-semibold text-white disabled:bg-[#B4B9CC]"
        >
          {confirming ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Running…
            </span>
          ) : (
            "Confirm"
          )}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={confirming}
          className="h-10 flex-1 rounded-lg border border-[#E1E4EE] text-xs font-semibold text-[#4D556D]"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
