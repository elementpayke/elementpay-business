/** Strip local-model reasoning blocks from assistant text before display. */
export function formatAssistantMessage(content: string): string {
  return content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<redacted_thinking>[\s\S]*?<\/redacted_thinking>/gi, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .replace(/<redacted_thinking>[\s\S]*$/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
