"use client";

type UserMessageBubbleProps = {
  content: string;
  timestamp?: string;
};

export default function UserMessageBubble({
  content,
  timestamp,
}: UserMessageBubbleProps) {
  return (
    <div className="ml-8 flex justify-end">
      <div className="max-w-[360px] break-words rounded-2xl rounded-br-md bg-[#2D74B8] px-4 py-3 text-sm text-white">
        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        {timestamp ? (
          <p className="mt-2 text-right text-[11px] text-white/75">{timestamp}</p>
        ) : null}
      </div>
    </div>
  );
}
