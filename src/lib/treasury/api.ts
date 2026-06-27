import { authedFetch } from "@/lib/authedFetch";
import type { PendingConfirmation } from "@/lib/treasury/copilotPolicy";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export type TreasuryChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type TreasuryDocument = {
  name: string;
  text: string;
};

export type TreasuryChatResponse = {
  reply: string;
  messages: TreasuryChatMessage[];
  pending_actions: PendingConfirmation[];
};

export type TreasuryConfirmResponse = {
  reply: string;
  confirm_result: unknown;
};

async function parseEnvelope<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (body as { message?: string }).message ||
      (body as { error?: string }).error ||
      res.statusText;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return ((body as { data?: T }).data ?? body) as T;
}

/** Prefer Mboka copilot API; fall back to Next.js BFF when not deployed (404). */
async function treasuryFetch<T>(
  mbokaPath: string,
  bffBody: Record<string, unknown>,
): Promise<T> {
  if (API_BASE) {
    const mbokaRes = await authedFetch(`${API_BASE}${mbokaPath}`, {
      method: "POST",
      body: JSON.stringify(bffBody),
    });
    if (mbokaRes.status !== 404) {
      return parseEnvelope<T>(mbokaRes);
    }
  }

  const bffRes = await authedFetch("/api/treasury-copilot", {
    method: "POST",
    body: JSON.stringify(bffBody),
  });
  return parseEnvelope<T>(bffRes);
}

export async function treasuryCopilotChat(input: {
  messages: TreasuryChatMessage[];
  document?: TreasuryDocument | null;
}): Promise<TreasuryChatResponse> {
  return treasuryFetch<TreasuryChatResponse>("/api/v1/treasury/copilot/chat", {
    messages: input.messages,
    document: input.document ?? null,
  });
}

export async function treasuryCopilotConfirm(input: {
  tool: string;
  args: Record<string, unknown>;
}): Promise<TreasuryConfirmResponse> {
  if (API_BASE) {
    const mbokaRes = await authedFetch(`${API_BASE}/api/v1/treasury/copilot/confirm`, {
      method: "POST",
      body: JSON.stringify({ tool: input.tool, args: input.args }),
    });
    if (mbokaRes.status !== 404) {
      return parseEnvelope<TreasuryConfirmResponse>(mbokaRes);
    }
  }

  const bffRes = await authedFetch("/api/treasury-copilot", {
    method: "POST",
    body: JSON.stringify({
      confirm_action: { tool: input.tool, args: input.args },
    }),
  });
  return parseEnvelope<TreasuryConfirmResponse>(bffRes);
}
