import {
  buildDocumentUserMessage,
  COPILOT_SYSTEM_PROMPT,
  dispatchCopilotTool,
  isPendingConfirmation,
  toolsForQvac,
  type CopilotToolContext,
} from "@/lib/treasury/copilotTools.server";

const QVAC_URL = (process.env.QVAC_API_URL || "http://127.0.0.1:11434/v1").replace(
  /\/$/,
  "",
);
const QVAC_MODEL = process.env.QVAC_MODEL || "llm";
const MBOKA_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const MAX_TOOL_ROUNDS = 8;

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
};

async function qvacCompletion(messages: ChatMessage[]) {
  let res: Response;
  try {
    res = await fetch(`${QVAC_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: QVAC_MODEL,
        messages,
        tools: toolsForQvac(),
        tool_choice: "auto",
      }),
    });
  } catch (err) {
    throw new Error(
      `QVAC unavailable — start it with: npx @qvac/cli serve (${err instanceof Error ? err.message : String(err)})`,
    );
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `QVAC unavailable (${res.status}). Start QVAC: npx @qvac/cli serve — ${text.slice(0, 200)}`,
    );
  }
  const body = await res.json();
  return body.choices?.[0]?.message as ChatMessage | undefined;
}

export async function proxyTreasuryChat(authHeader: string, body: unknown) {
  if (!MBOKA_BASE) return null;
  const res = await fetch(`${MBOKA_BASE}/api/v1/treasury/copilot/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(body),
  });
  if (res.status === 404) return null;
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

export async function proxyTreasuryConfirm(authHeader: string, body: unknown) {
  if (!MBOKA_BASE) return null;
  const res = await fetch(`${MBOKA_BASE}/api/v1/treasury/copilot/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(body),
  });
  if (res.status === 404) return null;
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

export async function runTreasuryChat(
  authHeader: string,
  input: {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    document?: { name: string; text: string } | null;
  },
) {
  const ctx: CopilotToolContext = { authHeader };
  const incoming = input.messages;
  const lastUser = [...incoming].reverse().find((m) => m.role === "user");
  const messages: ChatMessage[] = [{ role: "system", content: COPILOT_SYSTEM_PROMPT }];

  for (const m of incoming) {
    if (lastUser && m === lastUser) {
      messages.push({
        role: "user",
        content: buildDocumentUserMessage(m.content, input.document),
      });
    } else {
      messages.push(m);
    }
  }

  const pendingActions: Array<Record<string, unknown>> = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const message = await qvacCompletion(messages);
    if (!message) throw new Error("Empty QVAC response");
    messages.push(message);

    if (!message.tool_calls?.length) {
      return {
        reply: message.content ?? "",
        messages: messages.filter((m) => m.role === "user" || m.role === "assistant"),
        pending_actions: pendingActions,
      };
    }

    for (const call of message.tool_calls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }
      let result: unknown;
      try {
        result = await dispatchCopilotTool(call.function.name, args, ctx);
      } catch (err) {
        result = { error: err instanceof Error ? err.message : String(err) };
      }
      if (isPendingConfirmation(result)) {
        pendingActions.push(result as Record<string, unknown>);
      }
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  throw new Error("Too many treasury copilot tool rounds.");
}

export async function runTreasuryConfirm(
  authHeader: string,
  input: { tool: string; args: Record<string, unknown> },
) {
  const ctx: CopilotToolContext = { authHeader };
  const result = await dispatchCopilotTool(
    input.tool,
    { ...input.args, user_confirmed: true },
    ctx,
  );
  return {
    reply: `Confirmed — ${input.tool} completed.`,
    confirm_result: result,
  };
}
