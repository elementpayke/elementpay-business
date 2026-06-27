/** Strip local-model reasoning blocks from assistant text before display. */
export function formatAssistantMessage(content: string): string {
  return content
    .replace(/[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*?<\/redacted_thinking>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
