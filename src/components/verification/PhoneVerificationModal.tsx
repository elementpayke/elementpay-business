"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Phone, RotateCcw, X } from "lucide-react";

interface PhoneVerificationModalProps {
  open: boolean;
  phoneDisplay: string;
  onClose: () => void;
  onVerified: () => void;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
}

const RESEND_SECONDS = 45;

export default function PhoneVerificationModal({
  open,
  phoneDisplay,
  onClose,
  onVerified,
  requestOtp,
  verifyOtp,
}: PhoneVerificationModalProps) {
  const [code, setCode] = useState<string[]>(() => ["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset modal state during render when opening, instead of in an effect.
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setCode(["", "", "", "", "", ""]);
      setError("");
      setInfo("");
      setSuccess(false);
      setVerifying(false);
      setResending(false);
      setCooldown(RESEND_SECONDS);
    }
  }

  useEffect(() => {
    if (!open) return;
    void requestOtp(phoneDisplay).catch(() => {
      // Non-fatal — user can still resend.
    });
    const id = window.setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 30);
    return () => window.clearTimeout(id);
  }, [open, phoneDisplay, requestOtp]);

  useEffect(() => {
    if (!open || cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

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
      setSuccess(true);
      window.setTimeout(() => {
        onVerified();
      }, 700);
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-verification-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-950 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center justify-center">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
              success
                ? "bg-tertiary-100 text-tertiary-600 dark:bg-tertiary-900/40 dark:text-tertiary-300"
                : "bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300"
            }`}
          >
            {success ? (
              <CheckCircle2 className="h-7 w-7" />
            ) : (
              <Phone className="h-7 w-7" />
            )}
          </div>
        </div>

        <h2
          id="phone-verification-title"
          className="mt-4 text-center text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl"
        >
          {success ? "Phone verified" : "Verify your phone number"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          {success ? (
            <>Your phone number has been verified successfully.</>
          ) : (
            <>
              Enter the 6-digit code sent to{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {phoneDisplay}
              </span>
            </>
          )}
        </p>

        {!success ? (
          <>
            {error ? (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
              >
                {error}
              </div>
            ) : null}

            {info ? (
              <div className="mt-4 rounded-xl border border-tertiary-200 bg-tertiary-100 px-4 py-3 text-sm text-tertiary-700 dark:border-tertiary-800 dark:bg-tertiary-900/30 dark:text-tertiary-200">
                {info}
              </div>
            ) : null}

            <form onSubmit={handleVerify} className="mt-6">
              <div
                className="flex items-center justify-center gap-2.5"
                onPaste={handlePaste}
              >
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
                    className="h-14 w-11 rounded-xl border-0 bg-gray-100 text-center text-lg font-bold text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:bg-gray-800/70 dark:text-white"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={verifying || fullCode.length !== 6}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 font-semibold text-white transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25 disabled:cursor-not-allowed disabled:bg-primary-300 disabled:shadow-none"
              >
                {verifying ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  "Verify phone"
                )}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center text-sm">
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className="inline-flex items-center gap-1.5 text-gray-500 transition-colors hover:text-primary-500 disabled:opacity-50 disabled:hover:text-gray-500 dark:text-gray-400 dark:hover:text-primary-400"
              >
                <RotateCcw
                  className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`}
                />
                {cooldown > 0
                  ? `Resend code in ${cooldown}s`
                  : resending
                    ? "Sending..."
                    : "Resend code"}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
