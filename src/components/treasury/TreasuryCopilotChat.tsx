"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Paperclip, Send, Sparkles, X } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import AssistantMessageBubble from "@/components/treasury/AssistantMessageBubble";
import InvoiceIntakeCard from "@/components/treasury/InvoiceIntakeCard";
import PendingActionCard, {
  type PendingAction,
} from "@/components/treasury/PendingActionCard";
import UserMessageBubble from "@/components/treasury/UserMessageBubble";
import {
  treasuryCopilotChat,
  treasuryCopilotConfirm,
  type TreasuryChatMessage,
} from "@/lib/treasury/api";
import { formatAssistantMessage } from "@/lib/treasury/formatAssistantMessage";
import {
  buildInvoiceIntakeAssistantMessage,
  parseInvoiceIntakeRequest,
  type InvoiceIntakeDraft,
} from "@/lib/treasury/invoiceIntake";

type ChatMessage = TreasuryChatMessage;

type UiChatMessage = ChatMessage & {
  timestamp?: string;
  displayContent?: string;
};

const TEXT_EXTENSIONS = /\.(txt|csv|md|json)$/i;
const MAX_DOC_CHARS = 24_000;

function messageTimestamp(date = new Date()): string {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

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
  const [messages, setMessages] = useState<UiChatMessage[]>([
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
  const [invoiceIntake, setInvoiceIntake] = useState<InvoiceIntakeDraft | null>(
    null,
  );
  const [attachment, setAttachment] = useState<{ name: string; text: string } | null>(
    null,
  );
  const historyRef = useRef<ChatMessage[]>([]);
  const invoiceIntakeRef = useRef<InvoiceIntakeDraft | null>(null);
  const submitInFlightRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, pendingActions, invoiceIntake, error]);

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

  const clearAttachment = useCallback(() => {
    setAttachment(null);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }, []);

  const updateInvoiceIntake = useCallback((draft: InvoiceIntakeDraft | null) => {
    invoiceIntakeRef.current = draft;
    setInvoiceIntake(draft);
  }, []);

  const submitUserMessage = useCallback(
    async (
      text: string,
      options: {
        displayContent?: string;
        document?: { name: string; text: string } | null;
        rollbackOnFailure?: boolean;
      } = {},
    ) => {
      if (loading || submitInFlightRef.current) {
        return false;
      }

      submitInFlightRef.current = true;

      const userMsg: UiChatMessage = {
        role: "user",
        content: text,
        timestamp: messageTimestamp(),
        ...(options.displayContent === undefined
          ? {}
          : { displayContent: options.displayContent }),
      };
      const historyUserMsg: ChatMessage = { role: "user", content: text };
      const previousHistory = historyRef.current;
      const nextHistory = [...historyRef.current, historyUserMsg];
      const selectedDocument = "document" in options ? options.document : attachment;
      const shouldRollback = Boolean(options.rollbackOnFailure);

      historyRef.current = nextHistory;
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setLoading(true);
      setError(null);

      try {
        const data = await callChat(nextHistory, selectedDocument);
        const assistantMsg: UiChatMessage = {
          role: "assistant",
          content: formatAssistantMessage(data.reply || "(no response)"),
          timestamp: messageTimestamp(),
        };
        if (Array.isArray(data.messages)) {
          historyRef.current = data.messages
            .filter(
              (m: { role: string }) => m.role === "user" || m.role === "assistant",
            )
            .map((m: ChatMessage) =>
              m.role === "assistant"
                ? { ...m, content: formatAssistantMessage(m.content) }
                : m,
            ) as ChatMessage[];
        } else {
          historyRef.current = [
            ...nextHistory,
            { role: assistantMsg.role, content: assistantMsg.content },
          ];
        }
        setMessages((m) => [...m, assistantMsg]);
        if (Array.isArray(data.pending_actions)) {
          setPendingActions(data.pending_actions as PendingAction[]);
        }
        clearAttachment();
        return true;
      } catch (err) {
        if (shouldRollback) {
          historyRef.current = previousHistory;
          setMessages((m) => m.filter((message) => message !== userMsg));
        }
        setError(err instanceof Error ? err.message : "Request failed");
        return false;
      } finally {
        submitInFlightRef.current = false;
        setLoading(false);
      }
    },
    [attachment, callChat, clearAttachment, loading],
  );

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const intakeDraft = parseInvoiceIntakeRequest(text);

    if (intakeDraft) {
      const userMsg: UiChatMessage = {
        role: "user",
        content: text,
        timestamp: messageTimestamp(),
      };
      const assistantMsg: UiChatMessage = {
        role: "assistant",
        content: buildInvoiceIntakeAssistantMessage(intakeDraft),
        timestamp: messageTimestamp(),
      };
      setMessages((m) => [...m, userMsg, assistantMsg]);
      updateInvoiceIntake(intakeDraft);
      setInput("");
      setError(null);
      clearAttachment();
      return;
    }

    updateInvoiceIntake(null);
    await submitUserMessage(text);
  }, [clearAttachment, input, loading, submitUserMessage, updateInvoiceIntake]);

  const submitInvoiceIntake = useCallback(
    (message: string) => {
      const draft = invoiceIntake;
      void (async () => {
        const submitted = await submitUserMessage(message, {
          displayContent: draft
            ? `Submitted invoice details for ${draft.clientName}.`
            : "Submitted invoice details.",
          document: null,
          rollbackOnFailure: true,
        });

        if (submitted) {
          const nextDraft = invoiceIntakeRef.current === draft
            ? null
            : invoiceIntakeRef.current;
          updateInvoiceIntake(nextDraft);
        }
      })();
    },
    [invoiceIntake, submitUserMessage, updateInvoiceIntake],
  );

  const confirmAction = useCallback(
    async (action: PendingAction) => {
      if (loading) return;
      setConfirming(true);
      setError(null);
      try {
        const data = await callConfirm(action);
        const assistantMsg: UiChatMessage = {
          role: "assistant",
          content: formatAssistantMessage(
            data.reply +
              (data.confirm_result
                ? `\n\n\`\`\`json\n${JSON.stringify(data.confirm_result, null, 2)}\n\`\`\``
                : ""),
          ),
          timestamp: messageTimestamp(),
        };
        historyRef.current = [
          ...historyRef.current,
          { role: assistantMsg.role, content: assistantMsg.content },
        ];
        setMessages((m) => [...m, assistantMsg]);
        setPendingActions((prev) => prev.filter((a) => a.action_id !== action.action_id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Confirmation failed");
      } finally {
        setConfirming(false);
      }
    },
    [callConfirm, loading],
  );

  const onFilePick = useCallback(
    async (file: File | null) => {
      if (!file) return;
      if (invoiceIntake) {
        clearAttachment();
        return;
      }

      setError(null);
      try {
        const doc = await readDocumentFile(file);
        if (invoiceIntakeRef.current) {
          clearAttachment();
          return;
        }
        setAttachment(doc);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not read file");
      }
    },
    [clearAttachment, invoiceIntake],
  );

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
            <UserMessageBubble
              key={`${m.role}-${i}`}
              content={m.displayContent ?? m.content}
              timestamp={m.timestamp}
            />
          ) : (
            <AssistantMessageBubble
              key={`${m.role}-${i}`}
              content={m.content}
              timestamp={m.timestamp}
            />
          ),
        )}

        {invoiceIntake ? (
          <InvoiceIntakeCard
            key={`${invoiceIntake.clientName}-${invoiceIntake.amount}-${invoiceIntake.currency}`}
            draft={invoiceIntake}
            disabled={loading}
            onSubmit={submitInvoiceIntake}
          />
        ) : null}

        {pendingActions.map((action) => (
          <PendingActionCard
            key={action.action_id}
            action={action}
            confirming={confirming || loading}
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
              onClick={clearAttachment}
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
            disabled={loading || Boolean(invoiceIntake)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#ECEEF4] text-[#5C637A] hover:border-primary-300 disabled:cursor-not-allowed disabled:text-[#B4B9CC] disabled:hover:border-[#ECEEF4]"
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
