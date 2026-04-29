"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Phone, RotateCcw } from "lucide-react";

interface PhoneVerificationStepProps {
  phoneDisplay: string;
  onVerified: () => Promise<void> | void;
  onSkip: () => Promise<void> | void;
  onBack: () => void;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
}

const RESEND_SECONDS = 45;

export default function PhoneVerificationStep({
  phoneDisplay,
  onVerified,
  onSkip,
  onBack,
  requestOtp,
  verifyOtp,
}: PhoneVerificationStepProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    void requestOtp(phoneDisplay).catch(() => {
      // Non-fatal — user can still resend.
    });
    inputRefs.current[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const handleChange = (idx: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[idx] = value.slice(-1);
    setCode(next);
    if (value && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...code];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || "";
    setCode(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const fullCode = code.join("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullCode.length !== 6) return;
    setError("");
    setInfo("");
    setVerifying(true);
    try {
      await verifyOtp(phoneDisplay, fullCode);
      await onVerified();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError("");
    setInfo("");
    setResending(true);
    try {
      await requestOtp(phoneDisplay);
      setCooldown(RESEND_SECONDS);
      setInfo("New code sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code.");
    } finally {
      setResending(false);
    }
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      await onSkip();
    } finally {
      setSkipping(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
          <Phone className="w-7 h-7 text-primary-500" />
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight text-center">
        Verify your phone
      </h2>
      <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-gray-700 dark:text-gray-200">{phoneDisplay}</span>
      </p>

      {error ? (
        <div
          role="alert"
          className="mt-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl"
        >
          {error}
        </div>
      ) : null}

      {info ? (
        <div className="mt-4 bg-tertiary-100 dark:bg-tertiary-900/30 border border-tertiary-200 dark:border-tertiary-800 text-tertiary-700 dark:text-tertiary-200 text-sm px-4 py-3 rounded-xl">
          {info}
        </div>
      ) : null}

      <form onSubmit={handleVerify} className="mt-8">
        <div className="flex items-center justify-center gap-2.5" onPaste={handlePaste}>
          {code.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              aria-label={`Digit ${idx + 1} of 6`}
              className="w-12 h-14 rounded-xl border-0 bg-gray-100 text-center text-lg font-bold text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:bg-gray-800/70 dark:text-white"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={verifying || fullCode.length !== 6}
          className="w-full mt-6 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold h-12 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-500/25 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {verifying ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : "Verify phone"}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-center text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors disabled:opacity-50 disabled:hover:text-gray-500"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
          {cooldown > 0 ? `Resend code in ${cooldown}s` : resending ? "Sending..." : "Resend code"}
        </button>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800 pt-5">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={skipping}
          className="text-sm font-semibold text-primary-500 hover:text-primary-600 disabled:opacity-60"
        >
          {skipping ? "Skipping..." : "Skip for now"}
        </button>
      </div>
    </div>
  );
}
