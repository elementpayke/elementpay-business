import { NextResponse } from "next/server";
import {
  proxyTreasuryChat,
  proxyTreasuryConfirm,
  runTreasuryChat,
  runTreasuryConfirm,
} from "@/lib/treasury/copilotBff";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { status: "error", message: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: {
    messages?: Array<{ role: "user" | "assistant"; content: string }>;
    document?: { name: string; text: string } | null;
    confirm_action?: { tool: string; args: Record<string, unknown> };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid JSON" },
      { status: 400 },
    );
  }

  try {
    if (body.confirm_action?.tool) {
      const proxied = await proxyTreasuryConfirm(authHeader, {
        tool: body.confirm_action.tool,
        args: body.confirm_action.args,
      });
      if (proxied) {
        return NextResponse.json(proxied.body, { status: proxied.status });
      }
      const data = await runTreasuryConfirm(authHeader, body.confirm_action);
      return NextResponse.json({
        status: "success",
        message: "Treasury action confirmed.",
        data,
      });
    }

    const proxied = await proxyTreasuryChat(authHeader, {
      messages: body.messages ?? [],
      document: body.document ?? null,
    });
    if (proxied) {
      return NextResponse.json(proxied.body, { status: proxied.status });
    }

    const data = await runTreasuryChat(authHeader, {
      messages: body.messages ?? [],
      document: body.document ?? null,
    });
    return NextResponse.json({
      status: "success",
      message: "Treasury copilot reply.",
      data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Treasury copilot failed";
    const status = message.toLowerCase().includes("assistant service unavailable")
      ? 503
      : 400;
    return NextResponse.json({ status: "error", message }, { status });
  }
}
