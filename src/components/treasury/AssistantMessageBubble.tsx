"use client";

import { Bot } from "lucide-react";
import { buildAssistantMessageBlocks } from "@/lib/treasury/assistantMessageView";

type AssistantMessageBubbleProps = {
  content: string;
  timestamp?: string;
};

export default function AssistantMessageBubble({
  content,
  timestamp,
}: AssistantMessageBubbleProps) {
  const blocks = buildAssistantMessageBlocks(content);

  return (
    <div className="mr-4 flex items-end gap-2.5">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E3E2FA] text-primary-600"
        aria-hidden
      >
        <Bot className="h-4 w-4" />
      </span>
      <div className="min-w-0 max-w-[560px] break-words rounded-2xl rounded-bl-md bg-[#F2F5FA] px-4 py-3 text-sm text-[#1D243C]">
        <div className="space-y-2">
          {blocks.length > 0 ? (
            blocks.map((block, index) =>
              block.type === "paragraph" ? (
                <p key={`${block.type}-${index}`} className="leading-relaxed">
                  {block.text}
                </p>
              ) : (
                <ol
                  key={`${block.type}-${index}`}
                  className="list-decimal space-y-1 pl-5 leading-relaxed"
                >
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              ),
            )
          ) : (
            <p className="leading-relaxed">{"I'm ready when you are."}</p>
          )}
        </div>
        {timestamp ? (
          <p className="mt-2 text-right text-[11px] text-[#9AA3B6]">
            {timestamp}
          </p>
        ) : null}
      </div>
    </div>
  );
}
