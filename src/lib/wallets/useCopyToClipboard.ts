"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ToastState = { message: string; visible: boolean };

export function useCopyToClipboard() {
  const [toast, setToast] = useState<ToastState>({ message: "", visible: false });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = useCallback(async (text: string, message = "Copied successfully") => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }

      setToast({ message, visible: true });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 1800);
    } catch (err) {
      console.error("[copy] failed", err);
      setToast({ message: "Could not copy to clipboard", visible: true });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 1800);
    }
  }, []);

  return { copy, toast };
}
