"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Paperclip, Send, Sparkles, X } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import PendingActionCard, {
  type PendingAction,
} from "@/components/treasury/PendingActionCard";
import {
  treasuryCopilotChat,
  treasuryCopilotConfirm,
  type TreasuryChatMessage,
} from "@/lib/treasury/api";
import { formatAssistantMessage } from "@/lib/treasury/formatAssistantMessage";

type ChatMessage = TreasuryChatMessage;

const TEXT_EXTENSIONS = /\.(txt|csv|md|json)$/i;
const MAX_DOC_CHARS = 24_000;

async function readDocumentFile(file: File): Promise<{ name: string; text: string }> {
  if (TEXT_EXTENSIONS.test(file.name)) {
    const text = await file.text();
    return { name: file.name, text: text.slice(0, MAX_DOC_CHARS) };
  }
  throw new Error(
    "Upload .txt, .csv, .md, or .json for now — or paste invoice text into the chat.",
  );
}

export default function TreasuryCopilotChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "I'm ElementPay's financial assistant. I can help with your account — balances, contacts, invoices, invoice drafts, payout previews, transactions, and payments.\n\nI use your authenticated ElementPay account context, so I won't ask for business details that are already on file. Anything that moves money or changes records waits for your confirmation.\n\nTry: \"What's our treasury balance?\" or upload a supplier invoice CSV and say \"Create drafts from this.\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [attachment, setAttachment] = useState<{ name: string; text: string } | null>(
    null,
  );
  const historyRef = useRef<ChatMessage[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, pendingActions, error]);

  const callChat = useCallback(
    async (messages: ChatMessage[], document?: { name: string; text: string } | null) =>
      treasuryCopilotChat({ messages, document }),
    [],
  );

  const callConfirm = useCallback(
    async (action: PendingAction) =>
      treasuryCopilotConfirm({
        tool: action.tool,
        args: action.args,
      }),
    [],
  );

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const nextHistory = [...historyRef.current, userMsg];
    historyRef.current = nextHistory;
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);
    setPendingActions([]);

    try {
      const data = await callChat(nextHistory, attachment);
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: formatAssistantMessage(data.reply || "(no response)"),
      };
      if (Array.isArray(data.messages)) {
        historyRef.current = data.messages
          .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
          .map((m: ChatMessage) =>
            m.role === "assistant"
              ? { ...m, content: formatAssistantMessage(m.content) }
              : m,
          ) as ChatMessage[];
      } else {
        historyRef.current = [...nextHistory, assistantMsg];
      }
      setMessages((m) => [...m, assistantMsg]);
      if (Array.isArray(data.pending_actions) && data.pending_actions.length > 0) {
        setPendingActions(data.pending_actions as PendingAction[]);
      }
      setAttachment(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [input, loading, attachment, callChat]);

  const confirmAction = useCallback(
    async (action: PendingAction) => {
      setConfirming(true);
      setError(null);
      try {
        const data = await callConfirm(action);
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: formatAssistantMessage(
            data.reply +
              (data.confirm_result
                ? `\n\n\`\`\`json\n${JSON.stringify(data.confirm_result, null, 2)}\n\`\`\``
                : ""),
          ),
        };
        historyRef.current = [...historyRef.current, assistantMsg];
        setMessages((m) => [...m, assistantMsg]);
        setPendingActions((prev) => prev.filter((a) => a.action_id !== action.action_id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Confirmation failed");
      } finally {
        setConfirming(false);
      }
    },
    [callConfirm],
  );

  const onFilePick = useCallback(async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const doc = await readDocumentFile(file);
      setAttachment(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read file");
    }
  }, []);

  return (
    <div
      className={cardClassName(
        "flex h-[min(70vh,720px)] flex-col overflow-hidden sm:h-[min(75vh,720px)]",
      )}
    >
      <div className="flex items-center gap-2 border-b border-[#EFF1F7] px-5 py-4">
        <Sparkles className="h-5 w-5 text-primary-500" />
        <div>
          <h2 className="text-sm font-semibold text-[#171D32]">Financial Assistant</h2>
          <p className="text-xs text-[#8E93A7]">
            Balances · invoices · payouts
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={`${m.role}-${i}`} className="ml-8 flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary-500 px-4 py-3 text-sm text-white">
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              </div>
            </div>
          ) : (
            <div key={`${m.role}-${i}`} className="mr-4 flex gap-2.5">
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600"
                aria-hidden
              >
                <Bot className="h-4 w-4" />
              </span>
              <div className="min-w-0 max-w-[85%] rounded-2xl rounded-bl-md bg-[#F4F6FB] px-4 py-3 text-sm text-[#1D243C]">
                <p className="whitespace-pre-wrap leading-relaxed">
                  {formatAssistantMessage(m.content)}
                </p>
              </div>
            </div>
          ),
        )}

        {pendingActions.map((action) => (
          <PendingActionCard
            key={action.action_id}
            action={action}
            confirming={confirming}
            onConfirm={() => void confirmAction(action)}
            onDismiss={() =>
              setPendingActions((prev) =>
                prev.filter((a) => a.action_id !== action.action_id),
              )
            }
          />
        ))}

        {loading ? (
          <div className="mr-4 flex items-center gap-2.5 text-sm text-[#8E93A7]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <Bot className="h-4 w-4" />
            </span>
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking…
          </div>
        ) : null}
        <div ref={messagesEndRef} className="h-px shrink-0" aria-hidden />
      </div>

      {error ? <p className="px-5 pb-2 text-xs text-[#B23A4E]">{error}</p> : null}

      <div className="border-t border-[#EFF1F7] p-4">
        {attachment ? (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#F4F6FB] px-3 py-2 text-xs text-[#4D556D]">
            <Paperclip className="h-3.5 w-3.5" />
            <span className="flex-1 truncate">{attachment.name}</span>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="text-[#8E93A7] hover:text-[#B23A4E]"
              aria-label="Remove attachment"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.csv,.md,.json,text/plain,text/csv"
            className="hidden"
            onChange={(e) => void onFilePick(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#ECEEF4] text-[#5C637A] hover:border-primary-300"
            aria-label="Attach document"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Ask about balances, invoices, or payouts…"
            disabled={loading}
            className="h-11 flex-1 rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm outline-none focus:border-primary-300 focus:bg-white"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={loading || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500 text-white disabled:bg-[#B4B9CC]"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-[#8E93A7]">
          Upload CSV/txt invoices or contracts — confirm before any payout or record change.
        </p>
      </div>
    </div>
  );
}
