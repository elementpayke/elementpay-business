import { describe, expect, it } from "vitest";
import { buildAssistantMessageBlocks } from "@/lib/treasury/assistantMessageView";

describe("buildAssistantMessageBlocks", () => {
  it("removes thinking blocks and raw markdown emphasis from paragraphs", () => {
    expect(
      buildAssistantMessageBlocks("<think>hidden</think>\n\n**Invoice Number**: INV-1"),
    ).toEqual([{ type: "paragraph", text: "Invoice Number: INV-1" }]);
  });

  it("groups numbered next steps into a list block", () => {
    expect(
      buildAssistantMessageBlocks("### Next Steps:\n1. **Preview** payouts\n2. **Confirm** draft"),
    ).toEqual([
      { type: "paragraph", text: "Next Steps:" },
      { type: "list", items: ["Preview payouts", "Confirm draft"] },
    ]);
  });

  it("keeps compact paragraphs separate", () => {
    expect(buildAssistantMessageBlocks("First line.\n\nSecond line.")).toEqual([
      { type: "paragraph", text: "First line." },
      { type: "paragraph", text: "Second line." },
    ]);
  });
});
