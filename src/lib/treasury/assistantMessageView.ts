import { formatAssistantMessage } from "@/lib/treasury/formatAssistantMessage";

export type AssistantMessageBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

const listLinePattern = /^\s*(?:[-*]\s+|\d+\.\s+)(.+)$/;

function stripDisplayMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s*/, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*|__|`/g, "")
    .trim();
}

function appendListBlock(
  blocks: AssistantMessageBlock[],
  items: string[],
): void {
  if (items.length > 0) {
    blocks.push({ type: "list", items: [...items] });
    items.length = 0;
  }
}

export function buildAssistantMessageBlocks(
  content: string,
): AssistantMessageBlock[] {
  const formatted = formatAssistantMessage(content);

  if (formatted.length === 0) {
    return [];
  }

  const blocks: AssistantMessageBlock[] = [];
  const listItems: string[] = [];

  for (const line of formatted.split(/\n/)) {
    if (line.trim().length === 0) {
      appendListBlock(blocks, listItems);
      continue;
    }

    const listMatch = line.match(listLinePattern);

    if (listMatch) {
      const item = stripDisplayMarkdown(listMatch[1]);

      if (item.length > 0) {
        listItems.push(item);
      }

      continue;
    }

    appendListBlock(blocks, listItems);

    const text = stripDisplayMarkdown(line);

    if (text.length > 0) {
      blocks.push({ type: "paragraph", text });
    }
  }

  appendListBlock(blocks, listItems);

  return blocks;
}
