import { describe, expect, it } from "vitest";
import { formatAssistantMessage } from "@/lib/treasury/formatAssistantMessage";

describe("formatAssistantMessage", () => {
  it("removes thinking blocks and keeps the reply", () => {
    const open = "<" + "think>";
    const close = "</" + "think>";
    const raw = `${open}internal reasoning${close}\n\nHey there! How can I help?`;
    expect(formatAssistantMessage(raw)).toBe("Hey there! How can I help?");
  });

  it("removes redacted_thinking blocks", () => {
    const raw =
      "<redacted_thinking>planning</redacted_thinking>\n\nHello from treasury.";
    expect(formatAssistantMessage(raw)).toBe("Hello from treasury.");
  });

  it("removes unclosed thinking blocks from local model output", () => {
    const raw = "<think>still thinking\nmore internal text";
    expect(formatAssistantMessage(raw)).toBe("");
  });

  it("removes unclosed redacted_thinking blocks from local model output", () => {
    const raw = "<redacted_thinking>still thinking";
    expect(formatAssistantMessage(raw)).toBe("");
  });

  it.each([
    ["think opening with redacted closing", "<think>planning</redacted_thinking>\n\nHello from treasury."],
    ["redacted opening with think closing", "<redacted_thinking>planning</think>\n\nHello from treasury."],
  ])("removes malformed %s", (_label, raw) => {
    expect(formatAssistantMessage(raw)).toBe("Hello from treasury.");
  });

  it.each([
    ["think closing", "planning</think>\n\nHello from treasury."],
    ["redacted closing", "planning</redacted_thinking>\n\nHello from treasury."],
  ])("removes leading text through orphan %s", (_label, raw) => {
    expect(formatAssistantMessage(raw)).toBe("Hello from treasury.");
  });
});
