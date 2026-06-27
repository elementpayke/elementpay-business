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
      "<think>planning</think>\n\nHello from treasury.";
    expect(formatAssistantMessage(raw)).toBe("Hello from treasury.");
  });
});
